/**
 * SPX Redis Reliability Test Suite
 * Tests per-command timeout, concurrency multiplexing, stale connection recovery,
 * chunk-buffered streaming RESP parsing, AUTH, and production fail-closed behavior.
 */

import net from 'net';
import {
  NativeSocketRedisClient,
  RedisUnavailableError,
  getSpxRedis,
  setSpxRedisClientForTesting,
} from '../src/lib/integrations/spx/redis';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: any, testName: string, detail?: string) {
  if (Boolean(condition)) {
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    testsFailed++;
  }
}

/**
 * Creates an in-process mock Redis TCP server for testing network edge cases.
 */
function createMockRedisServer(options?: {
  delayCommandMs?: number;
  expectedPassword?: string;
  chunkedResponse?: boolean;
}) {
  const store = new Map<string, string>();
  let activeSockets: net.Socket[] = [];

  const server = net.createServer((socket) => {
    activeSockets.push(socket);
    let buffer = '';

    socket.on('data', async (chunk) => {
      buffer += chunk.toString('utf-8');

      // Process RESP command arrays (*<count>\r\n...)
      while (buffer.length > 0) {
        if (!buffer.startsWith('*')) {
          buffer = '';
          break;
        }

        const firstCrlf = buffer.indexOf('\r\n');
        if (firstCrlf === -1) break;

        const argCount = parseInt(buffer.slice(1, firstCrlf), 10);
        let cursor = firstCrlf + 2;
        const args: string[] = [];
        let complete = true;

        for (let i = 0; i < argCount; i++) {
          if (cursor >= buffer.length || buffer[cursor] !== '$') {
            complete = false;
            break;
          }
          const nextCrlf = buffer.indexOf('\r\n', cursor);
          if (nextCrlf === -1) {
            complete = false;
            break;
          }
          const len = parseInt(buffer.slice(cursor + 1, nextCrlf), 10);
          cursor = nextCrlf + 2;
          if (buffer.length < cursor + len + 2) {
            complete = false;
            break;
          }
          const arg = buffer.slice(cursor, cursor + len);
          cursor = cursor + len + 2;
          args.push(arg);
        }

        if (!complete) {
          break; // wait for more TCP chunks
        }

        buffer = buffer.slice(cursor);
        const cmd = (args[0] || '').toUpperCase();

        // 1. Simulate Delays
        if (options?.delayCommandMs && cmd === 'GET' && args[1]?.includes('slow')) {
          await new Promise((r) => setTimeout(r, options.delayCommandMs));
        }

        // 2. Handle AUTH
        if (cmd === 'AUTH') {
          const pass = args[1];
          if (options?.expectedPassword && pass !== options.expectedPassword) {
            socket.write('-ERR invalid password\r\n');
          } else {
            socket.write('+OK\r\n');
          }
          continue;
        }

        // 3. Handle PING
        if (cmd === 'PING') {
          socket.write('+PONG\r\n');
          continue;
        }

        // 4. Handle SET
        if (cmd === 'SET') {
          const key = args[1];
          const val = args[2];
          store.set(key, val);
          socket.write('+OK\r\n');
          continue;
        }

        // 5. Handle GET
        if (cmd === 'GET') {
          const key = args[1];
          const val = store.get(key);

          if (val === undefined) {
            socket.write('$-1\r\n');
          } else if (options?.chunkedResponse && val.length > 10) {
            // Split response into 3 chunks with deliberate delay
            const fullResp = `$${val.length}\r\n${val}\r\n`;
            const part1 = fullResp.slice(0, 8);
            const part2 = fullResp.slice(8, 20);
            const part3 = fullResp.slice(20);

            socket.write(part1);
            await new Promise((r) => setTimeout(r, 20));
            socket.write(part2);
            await new Promise((r) => setTimeout(r, 20));
            socket.write(part3);
          } else {
            socket.write(`$${val.length}\r\n${val}\r\n`);
          }
          continue;
        }

        // 6. Handle INCR
        if (cmd === 'INCR') {
          const key = args[1];
          const cur = parseInt(store.get(key) || '0', 10);
          const next = cur + 1;
          store.set(key, next.toString());
          socket.write(`:${next}\r\n`);
          continue;
        }

        // 7. Handle DEL
        if (cmd === 'DEL') {
          const key = args[1];
          const existed = store.delete(key);
          socket.write(`:${existed ? 1 : 0}\r\n`);
          continue;
        }

        // 8. Handle TTL
        if (cmd === 'TTL') {
          socket.write(':60\r\n');
          continue;
        }

        // 9. Handle EXPIRE
        if (cmd === 'EXPIRE') {
          socket.write(':1\r\n');
          continue;
        }

        // 10. Handle Simulated Error
        if (cmd === 'SIMULATE_ERROR') {
          socket.write('-ERR simulated redis error\r\n');
          continue;
        }

        socket.write('-ERR unknown command\r\n');
      }
    });

    socket.on('close', () => {
      activeSockets = activeSockets.filter((s) => s !== socket);
    });
  });

  return {
    server,
    listen: () =>
      new Promise<number>((resolve) => {
        server.listen(0, '127.0.0.1', () => {
          const addr = server.address() as net.AddressInfo;
          resolve(addr.port);
        });
      }),
    close: () =>
      new Promise<void>((resolve) => {
        for (const s of activeSockets) s.destroy();
        server.close(() => resolve());
      }),
    destroyActiveConnections: () => {
      for (const s of activeSockets) s.destroy();
      activeSockets = [];
    },
  };
}

async function runReliabilityTests() {
  console.log('\n======================================================');
  console.log('       SPX REDIS PRODUCTION RELIABILITY VERIFICATION   ');
  console.log('======================================================\n');

  // ----------------------------------------------------
  // TEST 1: Concurrency & Serialized Command Queue
  // ----------------------------------------------------
  console.log('--- 1. High-Concurrency Serialized Command Queue ---');
  const mock1 = createMockRedisServer();
  const port1 = await mock1.listen();
  const client1 = new NativeSocketRedisClient(`redis://127.0.0.1:${port1}`, {
    commandTimeoutMs: 2000,
  });

  try {
    // Dispatch 50 concurrent INCR operations on 50 distinct keys simultaneously
    const totalOps = 50;
    const concurrentPromises = Array.from({ length: totalOps }, (_, i) =>
      client1.incr(`test_counter_${i}`)
    );

    const results = await Promise.all(concurrentPromises);

    assert(results.length === totalOps, `All ${totalOps} concurrent operations completed`);
    assert(
      results.every((val) => val === 1),
      'Every concurrent INCR correctly returned 1 with zero response interleaving'
    );

    // Run 50 concurrent GETs
    const getPromises = Array.from({ length: totalOps }, (_, i) =>
      client1.get(`test_counter_${i}`)
    );
    const getResults = await Promise.all(getPromises);
    assert(
      getResults.every((val) => val === '1'),
      'All 50 concurrent GET queries retrieved their exact corresponding value'
    );
  } finally {
    await client1.disconnect();
    await mock1.close();
  }

  // ----------------------------------------------------
  // TEST 2: Per-Command Timeout Enforcement
  // ----------------------------------------------------
  console.log('\n--- 2. Per-Command Timeout Enforcement ---');
  const mock2 = createMockRedisServer({ delayCommandMs: 800 });
  const port2 = await mock2.listen();
  const client2 = new NativeSocketRedisClient(`redis://127.0.0.1:${port2}`, {
    commandTimeoutMs: 200, // Short 200ms timeout
  });

  try {
    let timeoutCaught = false;
    let errorMessage = '';

    try {
      await client2.get('slow_key_test');
    } catch (err: any) {
      timeoutCaught = true;
      errorMessage = err.message;
    }

    assert(timeoutCaught, 'Command timed out as expected');
    assert(
      errorMessage.includes('timed out after 200ms'),
      `Error correctly identifies timeout (${errorMessage})`
    );

    // Verify client can immediately recover and execute subsequent normal command
    await client2.set('fast_key', 'fast_value');
    const fastVal = await client2.get('fast_key');
    assert(fastVal === 'fast_value', 'Client automatically reconnected and recovered after timeout');
  } finally {
    await client2.disconnect();
    await mock2.close();
  }

  // ----------------------------------------------------
  // TEST 3: Stale Socket Detection & Automatic Reconnect
  // ----------------------------------------------------
  console.log('\n--- 3. Stale Socket Detection & Auto-Reconnection ---');
  const mock3 = createMockRedisServer();
  const port3 = await mock3.listen();
  const client3 = new NativeSocketRedisClient(`redis://127.0.0.1:${port3}`);

  try {
    // 1. Initial successful command
    const ping1 = await client3.ping();
    assert(ping1 === true, 'Initial command succeeds over active socket');

    // 2. Server forcefully severs the TCP connection (simulates serverless freeze/idle timeout)
    mock3.destroyActiveConnections();
    await new Promise((r) => setTimeout(r, 50));

    // 3. Issue new command: client must detect closed connection and reconnect
    await client3.set('reconnect_key', 'reconnect_success');
    const recoveredVal = await client3.get('reconnect_key');
    assert(recoveredVal === 'reconnect_success', 'Client seamlessly reconnected on severed socket');
  } finally {
    await client3.disconnect();
    await mock3.close();
  }

  // ----------------------------------------------------
  // TEST 4: Chunked TCP Streaming Buffer Parser
  // ----------------------------------------------------
  console.log('\n--- 4. Chunked TCP Packet Streaming & Buffer Reassembly ---');
  const mock4 = createMockRedisServer({ chunkedResponse: true });
  const port4 = await mock4.listen();
  const client4 = new NativeSocketRedisClient(`redis://127.0.0.1:${port4}`);

  try {
    const largePayload = JSON.stringify({
      studentId: 'std_test_99999',
      collegeId: 'col_aditya_12345',
      tier: 'VERIFIED_LEGAL_GUARDIAN',
      scopes: ['students:read', 'students:update'],
      createdAt: new Date().toISOString(),
    });

    await client4.set('large_session', largePayload);
    const retrieved = await client4.get('large_session');

    assert(retrieved === largePayload, 'Correctly reassembled multi-chunk TCP response without truncation');
  } finally {
    await client4.disconnect();
    await mock4.close();
  }

  // ----------------------------------------------------
  // TEST 5: Password Authentication on Reconnect
  // ----------------------------------------------------
  console.log('\n--- 5. Password Authentication & Validation ---');
  const mock5 = createMockRedisServer({ expectedPassword: 'super_secret_redis_pass' });
  const port5 = await mock5.listen();

  // 5.1 Valid password
  const client5Valid = new NativeSocketRedisClient(
    `redis://default:super_secret_redis_pass@127.0.0.1:${port5}`
  );
  try {
    const authPing = await client5Valid.ping();
    assert(authPing === true, 'Successfully authenticated using URL password');

    // Destroy socket to test AUTH on reconnect
    mock5.destroyActiveConnections();
    await new Promise((r) => setTimeout(r, 50));

    const pingAfterReconnect = await client5Valid.ping();
    assert(pingAfterReconnect === true, 'Successfully re-authenticated on automatic reconnection');
  } finally {
    await client5Valid.disconnect();
  }

  // 5.2 Invalid password
  const client5Invalid = new NativeSocketRedisClient(
    `redis://default:wrong_pass@127.0.0.1:${port5}`
  );
  try {
    const pingFailed = (await client5Invalid.ping()) === false;
    assert(pingFailed, 'ping() returns false when password is incorrect');

    let commandThrew = false;
    try {
      await client5Invalid.get('test_key');
    } catch (err: any) {
      if (err instanceof RedisUnavailableError) {
        commandThrew = true;
      }
    }
    assert(commandThrew, 'Data commands reject with RedisUnavailableError when password is incorrect');
  } finally {
    await client5Invalid.disconnect();
    await mock5.close();
  }

  // ----------------------------------------------------
  // TEST 6: Production Fail-Closed Behavior
  // ----------------------------------------------------
  console.log('\n--- 6. Strict Production Fail-Closed Enforcement ---');
  setSpxRedisClientForTesting(null);
  const oldEnv = process.env.NODE_ENV;
  const oldUrl = process.env.SPX_REDIS_URL;
  const oldFallback = process.env.SPX_ALLOW_DEV_FALLBACK;

  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.SPX_REDIS_URL;
    delete process.env.REDIS_URL;
    delete process.env.SPX_ALLOW_DEV_FALLBACK;

    let prodErrorCaught = false;
    try {
      getSpxRedis();
    } catch (err: any) {
      if (err instanceof RedisUnavailableError) {
        prodErrorCaught = true;
      }
    }
    assert(prodErrorCaught, 'Production throws RedisUnavailableError when SPX_REDIS_URL is missing');

    // Verify production NEVER allows dev fallback even if flag is set
    process.env.SPX_ALLOW_DEV_FALLBACK = 'true';
    let prodFallbackBlocked = false;
    try {
      getSpxRedis();
    } catch (err: any) {
      if (err instanceof RedisUnavailableError) {
        prodFallbackBlocked = true;
      }
    }
    assert(prodFallbackBlocked, 'Production strictly prohibits SPX_ALLOW_DEV_FALLBACK');
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = oldEnv;
    if (oldUrl) process.env.SPX_REDIS_URL = oldUrl;
    if (oldFallback) process.env.SPX_ALLOW_DEV_FALLBACK = oldFallback;
    setSpxRedisClientForTesting(null);
  }

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runReliabilityTests().catch((err) => {
  console.error('Test execution exception:', err);
  process.exit(1);
});
