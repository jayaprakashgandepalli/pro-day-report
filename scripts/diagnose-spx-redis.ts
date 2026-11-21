/**
 * SPX Redis Integration Diagnostic Tool
 * 
 * Safely probes Redis connectivity in 8 distinct stages without logging passwords,
 * tokens, full connection URLs, or sensitive data.
 * 
 * Usage:
 *   npx tsx scripts/diagnose-spx-redis.ts
 *   or:
 *   npx tsx scripts/diagnose-spx-redis.ts "rediss://default:password@host:port"
 */

import dns from 'dns';
import tls from 'tls';
import net from 'net';
import { URL } from 'url';
import { NativeSocketRedisClient } from '../src/lib/integrations/spx/redis';

// Helper to mask sensitive connection URLs
function maskUrl(urlString: string): string {
  try {
    const u = new URL(urlString);
    const pass = u.password ? '***' : '';
    const user = u.username ? `${u.username}:` : '';
    const auth = (user || pass) ? `${user}${pass}@` : '';
    return `${u.protocol}//${auth}${u.hostname}:${u.port || (u.protocol === 'rediss:' ? '6379' : '6379')}${u.pathname}`;
  } catch {
    return '[INVALID_URL_FORMAT]';
  }
}

interface DiagnosticResult {
  stage: number;
  name: string;
  success: boolean;
  code?: string;
  message: string;
  details?: Record<string, any>;
}

async function runDiagnostic() {
  console.log('======================================================');
  console.log('       SPX REDIS PRODUCTION DIAGNOSTIC TOOL           ');
  console.log('======================================================\n');

  const results: DiagnosticResult[] = [];

  // STAGE 1: Check existence of SPX_REDIS_URL
  console.log('--- STAGE 1: SPX_REDIS_URL Existence Check ---');
  const rawUrl = process.argv[2] || process.env.SPX_REDIS_URL || process.env.REDIS_URL;

  if (!rawUrl || !rawUrl.trim()) {
    const res: DiagnosticResult = {
      stage: 1,
      name: 'ENV_EXISTS',
      success: false,
      code: 'ERR_REDIS_URL_MISSING',
      message: 'SPX_REDIS_URL (or REDIS_URL) is not set in environment or arguments.',
    };
    results.push(res);
    printResult(res);
    printSummary(results, 1);
    return;
  }

  const trimmedUrl = rawUrl.trim();
  results.push({
    stage: 1,
    name: 'ENV_EXISTS',
    success: true,
    message: `URL string detected (length: ${trimmedUrl.length} characters). Value is safely masked.`,
    details: { masked: maskUrl(trimmedUrl) },
  });
  printResult(results[0]);

  // STAGE 2: Parse URL
  console.log('\n--- STAGE 2: URL Parsing ---');
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
    results.push({
      stage: 2,
      name: 'URL_PARSE',
      success: true,
      message: `Parsed successfully: host=${parsedUrl.hostname}, port=${parsedUrl.port || '6379 (default)'}`,
      details: {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || '6379',
        usernamePresent: Boolean(parsedUrl.username),
        username: parsedUrl.username ? parsedUrl.username : undefined,
        passwordPresent: Boolean(parsedUrl.password),
        pathname: parsedUrl.pathname,
      },
    });
    printResult(results[1]);
  } catch (err: any) {
    const res: DiagnosticResult = {
      stage: 2,
      name: 'URL_PARSE',
      success: false,
      code: 'ERR_INVALID_URL',
      message: `Failed to parse Redis URL: ${err.message}`,
    };
    results.push(res);
    printResult(res);
    printSummary(results, 2);
    return;
  }

  // STAGE 3: Protocol Check
  console.log('\n--- STAGE 3: Protocol Check (TLS / rediss) ---');
  const isRediss = parsedUrl.protocol === 'rediss:';
  const isRedis = parsedUrl.protocol === 'redis:';

  if (!isRediss && !isRedis) {
    const res: DiagnosticResult = {
      stage: 3,
      name: 'PROTOCOL_CHECK',
      success: false,
      code: 'ERR_UNSUPPORTED_PROTOCOL',
      message: `Unsupported protocol '${parsedUrl.protocol}'. Must be 'rediss:' (TLS) or 'redis:'.`,
    };
    results.push(res);
    printResult(res);
    printSummary(results, 3);
    return;
  }

  results.push({
    stage: 3,
    name: 'PROTOCOL_CHECK',
    success: true,
    message: `Protocol is '${parsedUrl.protocol}' (${isRediss ? 'TLS Encrypted' : 'Plain TCP'}).`,
    details: { protocol: parsedUrl.protocol, tls: isRediss },
  });
  printResult(results[2]);

  if (!isRediss) {
    console.log('  [WARNING] Production environments (like Upstash) generally require TLS ("rediss://").');
  }

  // STAGE 4: DNS Resolution
  console.log('\n--- STAGE 4: DNS Hostname Resolution ---');
  const host = parsedUrl.hostname;
  const port = parseInt(parsedUrl.port || '6379', 10);

  try {
    const addresses = await dns.promises.lookup(host, { all: true });
    results.push({
      stage: 4,
      name: 'DNS_RESOLUTION',
      success: true,
      message: `Resolved '${host}' to ${addresses.length} IP address(es).`,
      details: {
        records: addresses.map((a) => ({ family: `IPv${a.family}`, address: a.address })),
      },
    });
    printResult(results[3]);
  } catch (err: any) {
    const res: DiagnosticResult = {
      stage: 4,
      name: 'DNS_RESOLUTION',
      success: false,
      code: err.code || 'ERR_DNS_LOOKUP_FAILED',
      message: `DNS resolution failed for '${host}': ${err.message} (${err.code})`,
    };
    results.push(res);
    printResult(res);
    printSummary(results, 4);
    return;
  }

  // STAGE 5: TLS / TCP Socket Handshake
  console.log('\n--- STAGE 5: Socket & TLS Handshake Probe ---');
  try {
    const socketInfo = await probeSocket(host, port, isRediss);
    results.push({
      stage: 5,
      name: 'SOCKET_TLS_HANDSHAKE',
      success: true,
      message: `Connected successfully over ${isRediss ? 'TLS' : 'TCP'}.`,
      details: socketInfo,
    });
    printResult(results[4]);
  } catch (err: any) {
    const res: DiagnosticResult = {
      stage: 5,
      name: 'SOCKET_TLS_HANDSHAKE',
      success: false,
      code: err.code || 'ERR_CONNECTION_FAILED',
      message: `Socket connection failed to ${host}:${port}: ${err.message}`,
    };
    results.push(res);
    printResult(res);
    printSummary(results, 5);
    return;
  }

  // STAGE 6: Redis AUTH Probe
  console.log('\n--- STAGE 6: Redis AUTH Authentication Probe ---');
  try {
    const authResult = await probeAuth(host, port, isRediss, parsedUrl.username, parsedUrl.password);
    results.push({
      stage: 6,
      name: 'REDIS_AUTH',
      success: true,
      message: authResult.message,
      details: authResult.details,
    });
    printResult(results[5]);
  } catch (err: any) {
    const res: DiagnosticResult = {
      stage: 6,
      name: 'REDIS_AUTH',
      success: false,
      code: err.code || 'ERR_AUTH_FAILED',
      message: `Redis AUTH failed: ${err.message}`,
    };
    results.push(res);
    printResult(res);
    printSummary(results, 6);
    return;
  }

  // STAGE 7: Existing Client PING Probe
  console.log('\n--- STAGE 7: NativeSocketRedisClient PING Probe ---');
  const client = new NativeSocketRedisClient(trimmedUrl, {
    commandTimeoutMs: 3000,
    connectTimeoutMs: 4000,
  });

  try {
    const pingOk = await client.ping();
    if (!pingOk) {
      throw new Error('Client ping() returned false (did not receive PONG)');
    }
    results.push({
      stage: 7,
      name: 'CLIENT_PING',
      success: true,
      message: 'Client successfully sent PING and received PONG response.',
    });
    printResult(results[6]);
  } catch (err: any) {
    const res: DiagnosticResult = {
      stage: 7,
      name: 'CLIENT_PING',
      success: false,
      code: err.code || 'ERR_PING_FAILED',
      message: `PING probe failed: ${err.message}`,
    };
    results.push(res);
    printResult(res);
    await client.disconnect().catch(() => {});
    printSummary(results, 7);
    return;
  }

  // STAGE 8: SET / GET / DEL Data Operations Probe
  console.log('\n--- STAGE 8: SET, GET, DEL Functional Probe ---');
  const diagKey = `diag:${Date.now()}`;
  const diagVal = `diag_probe_${Math.random().toString(36).substring(2, 8)}`;

  try {
    // 1. SET with 60 second TTL
    const setOk = await client.set(diagKey, diagVal, { exSeconds: 60 });
    if (!setOk) {
      throw new Error(`SET ${diagKey} failed (returned false)`);
    }

    // 2. GET
    const readVal = await client.get(diagKey);
    if (readVal !== diagVal) {
      throw new Error(`GET value mismatch. Expected diagnostic token, got '${readVal}'`);
    }

    // 3. TTL
    const remainingTtl = await client.ttl(diagKey);

    // 4. DEL
    const delOk = await client.del(diagKey);
    if (!delOk) {
      throw new Error(`DEL ${diagKey} failed (returned false)`);
    }

    // 5. Verify deleted
    const verifyNull = await client.get(diagKey);
    if (verifyNull !== null) {
      throw new Error(`Key ${diagKey} still exists after DEL`);
    }

    results.push({
      stage: 8,
      name: 'DATA_OPERATIONS',
      success: true,
      message: 'Successfully executed SET (EX 60s), GET, TTL, and DEL with verified consistency.',
      details: {
        setSuccess: setOk,
        getVerified: true,
        ttlObserved: remainingTtl,
        delVerified: true,
      },
    });
    printResult(results[7]);
  } catch (err: any) {
    const res: DiagnosticResult = {
      stage: 8,
      name: 'DATA_OPERATIONS',
      success: false,
      code: err.code || 'ERR_DATA_OPS_FAILED',
      message: `Data operations failed: ${err.message}`,
    };
    results.push(res);
    printResult(res);
  } finally {
    await client.disconnect().catch(() => {});
  }

  printSummary(results, results.length === 8 && results.every((r) => r.success) ? null : results.length);
}

// Low-level socket & TLS probe helper
function probeSocket(host: string, port: number, isTls: boolean): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        client.destroy();
        reject({ code: 'ETIMEDOUT', message: `Connection timed out after 5000ms to ${host}:${port}` });
      }
    }, 5000);

    const onConnect = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        let info: Record<string, any> = { host, port, isTls };

        if (isTls && client instanceof tls.TLSSocket) {
          info.protocol = client.getProtocol();
          info.cipher = client.getCipher();
          info.authorized = client.authorized;
          info.authorizationError = client.authorizationError;
          info.servername = client.servername;
          const peerCert = client.getPeerCertificate();
          if (peerCert && peerCert.subject) {
            info.peerCertSubject = peerCert.subject.CN;
            info.peerCertIssuer = peerCert.issuer ? peerCert.issuer.O : undefined;
            info.peerCertValidTo = peerCert.valid_to;
          }
        }

        client.destroy();
        resolve(info);
      }
    };

    let client: net.Socket | tls.TLSSocket;
    if (isTls) {
      client = tls.connect(
        {
          host,
          port,
          servername: host, // TLS SNI extension
          rejectUnauthorized: false,
        },
        onConnect
      );
    } else {
      client = net.createConnection({ host, port }, onConnect);
    }

    client.once('error', (err: any) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
}

// Low-level AUTH probe helper
function probeAuth(
  host: string,
  port: number,
  isTls: boolean,
  username?: string,
  password?: string
): Promise<{ message: string; details: Record<string, any> }> {
  if (!password) {
    return Promise.resolve({
      message: 'No password configured in URL. Skipping AUTH.',
      details: { authenticated: false, reason: 'NO_PASSWORD_IN_URL' },
    });
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        client.destroy();
        reject({ code: 'ETIMEDOUT', message: 'AUTH command timed out after 4000ms' });
      }
    }, 4000);

    let client: net.Socket | tls.TLSSocket;

    const onData = (data: Buffer) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        const str = data.toString('utf-8');
        client.destroy();

        if (str.startsWith('+OK')) {
          resolve({
            message: 'Redis AUTH succeeded with +OK response.',
            details: { response: '+OK', mode: username ? 'ACL_OR_DEFAULT' : 'CLASSIC' },
          });
        } else {
          // Reject with sanitized error
          const sanitized = str.replace(/[\r\n]/g, ' ').trim();
          reject({
            code: 'ERR_REDIS_AUTH_REJECTED',
            message: `Redis server rejected AUTH: ${sanitized}`,
          });
        }
      }
    };

    const onConnected = () => {
      client.once('data', onData);
      // Build RESP command: either AUTH <password> or AUTH <username> <password>
      // Redis 6+ ACL supports AUTH <username> <password>. If username is "default" or empty, AUTH <password> is standard.
      const authArgs = username && username !== 'default' ? ['AUTH', username, password] : ['AUTH', password];
      let resp = `*${authArgs.length}\r\n`;
      for (const arg of authArgs) {
        resp += `$${Buffer.byteLength(arg)}\r\n${arg}\r\n`;
      }
      client.write(resp);
    };

    if (isTls) {
      client = tls.connect({ host, port, servername: host, rejectUnauthorized: false }, onConnected);
    } else {
      client = net.createConnection({ host, port }, onConnected);
    }

    client.once('error', (err: any) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(err);
      }
    });

    client.once('error', (err: any) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
}

function printResult(res: DiagnosticResult) {
  const icon = res.success ? '✓ [PASS]' : '✗ [FAIL]';
  console.log(`  ${icon} Stage ${res.stage} (${res.name}): ${res.message}`);
  if (res.details) {
    for (const [k, v] of Object.entries(res.details)) {
      if (typeof v === 'object' && v !== null) {
        console.log(`       - ${k}: ${JSON.stringify(v)}`);
      } else {
        console.log(`       - ${k}: ${v}`);
      }
    }
  }
}

function printSummary(results: DiagnosticResult[], failedStage: number | null) {
  console.log('\n======================================================');
  console.log('                 DIAGNOSTIC SUMMARY                   ');
  console.log('======================================================');
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`Total Stages Executed: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failedStage !== null) {
    const failedRes = results.find((r) => r.stage === failedStage);
    console.log(`\n>>> FAILURE DETECTED AT STAGE ${failedStage} (${failedRes?.name}) <<<`);
    console.log(`Error Code: ${failedRes?.code || 'UNKNOWN'}`);
    console.log(`Reason: ${failedRes?.message}`);
  } else {
    console.log('\n>>> ALL 8 STAGES PASSED SUCCESSFULLY! REDIS IS FULLY HEALTHY <<<');
  }
  console.log('======================================================\n');
}

runDiagnostic().catch((err) => {
  console.error('Fatal diagnostic runner error:', err);
  process.exit(1);
});
