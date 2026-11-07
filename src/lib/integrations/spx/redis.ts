import net from 'net';
import tls from 'tls';
import { URL } from 'url';

export class RedisUnavailableError extends Error {
  constructor(message: string = 'SPX shared Redis infrastructure is unavailable') {
    super(message);
    this.name = 'RedisUnavailableError';
  }
}

export interface SetOptions {
  exSeconds?: number;
  nx?: boolean;
}

export interface SpxRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: SetOptions): Promise<boolean>;
  del(key: string): Promise<boolean>;
  incr(key: string, exSeconds?: number): Promise<number>;
  ttl(key: string): Promise<number>;
  ping(): Promise<boolean>;
  isAvailable(): Promise<boolean>;
  disconnect(): Promise<void>;
}

export interface NativeRedisOptions {
  commandTimeoutMs?: number;
  connectTimeoutMs?: number;
  prefix?: string;
}

// In-memory test store used ONLY in non-production environments when SPX_ALLOW_DEV_FALLBACK is true
export class DevMemoryStore implements SpxRedisClient {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  private cleanExpired(key: string): boolean {
    const item = this.store.get(key);
    if (!item) return false;
    if (item.expiresAt !== null && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async get(key: string): Promise<string | null> {
    if (!this.cleanExpired(key)) return null;
    return this.store.get(key)?.value ?? null;
  }

  async set(key: string, value: string, options?: SetOptions): Promise<boolean> {
    if (options?.nx && this.cleanExpired(key)) {
      return false;
    }
    const expiresAt = options?.exSeconds ? Date.now() + options.exSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
    return true;
  }

  async del(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async incr(key: string, exSeconds?: number): Promise<number> {
    const existing = await this.get(key);
    const num = existing ? parseInt(existing, 10) || 0 : 0;
    const next = num + 1;
    await this.set(key, next.toString(), { exSeconds });
    return next;
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item || !this.cleanExpired(key)) return -2;
    if (item.expiresAt === null) return -1;
    const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async ping(): Promise<boolean> {
    return true;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async disconnect(): Promise<void> {
    this.store.clear();
  }
}

interface QueuedCommand {
  args: string[];
  resolve: (value: any) => void;
  reject: (err: any) => void;
  timeoutMs: number;
}

interface ActiveCommandState {
  args: string[];
  resolve: (value: any) => void;
  reject: (err: any) => void;
  timer: NodeJS.Timeout;
  settled: boolean;
}

interface ParseResult {
  complete: boolean;
  value?: any;
  isError?: boolean;
  remaining: Buffer;
}

/**
 * Production-reliable, zero-dependency native Node.js RESP (Redis Serialization Protocol) client.
 * Features:
 * - Serialized command queue: guarantees zero response cross-talk under high concurrency.
 * - Configurable per-command timeout (default 2000ms): prevents serverless function hangs.
 * - Chunk-buffered RESP stream parser: immune to split TCP packets.
 * - Stale connection detection & auto-reconnect with password re-authentication.
 * - Preserves redis:// and rediss:// (TLS) support.
 */
export class NativeSocketRedisClient implements SpxRedisClient {
  private url: URL;
  private prefix: string;
  private commandTimeoutMs: number;
  private connectTimeoutMs: number;

  private socket: net.Socket | tls.TLSSocket | null = null;
  private connectPromise: Promise<net.Socket | tls.TLSSocket> | null = null;

  private queue: QueuedCommand[] = [];
  private activeCommand: ActiveCommandState | null = null;
  private buffer: Buffer = Buffer.alloc(0);
  private isProcessingQueue: boolean = false;

  constructor(connectionUrl: string, options?: NativeRedisOptions) {
    this.url = new URL(connectionUrl);
    this.prefix = options?.prefix ?? 'spx:';

    const envCmdTimeout = process.env.SPX_REDIS_COMMAND_TIMEOUT_MS
      ? parseInt(process.env.SPX_REDIS_COMMAND_TIMEOUT_MS, 10)
      : undefined;
    this.commandTimeoutMs = options?.commandTimeoutMs ?? (envCmdTimeout && !isNaN(envCmdTimeout) ? envCmdTimeout : 2000);

    const envConnectTimeout = process.env.SPX_REDIS_CONNECT_TIMEOUT_MS
      ? parseInt(process.env.SPX_REDIS_CONNECT_TIMEOUT_MS, 10)
      : undefined;
    this.connectTimeoutMs = options?.connectTimeoutMs ?? (envConnectTimeout && !isNaN(envConnectTimeout) ? envConnectTimeout : 3000);
  }

  private applyPrefix(key: string): string {
    return key.startsWith(this.prefix) ? key : `${this.prefix}${key}`;
  }

  /**
   * Returns a valid, authenticated, connected socket or creates a new one.
   */
  private async getSocket(): Promise<net.Socket | tls.TLSSocket> {
    if (this.socket && !this.socket.destroyed && this.socket.writable) {
      return this.socket;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = (async () => {
      try {
        this.cleanupSocket();

        const isTls = this.url.protocol === 'rediss:';
        const port = parseInt(this.url.port || '6379', 10);
        const host = this.url.hostname || 'localhost';

        const socket = await new Promise<net.Socket | tls.TLSSocket>((resolve, reject) => {
          let settled = false;
          const timer = setTimeout(() => {
            if (!settled) {
              settled = true;
              client.destroy();
              reject(new RedisUnavailableError(`Connection timeout to Redis at ${host}:${port} (${this.connectTimeoutMs}ms)`));
            }
          }, this.connectTimeoutMs);

          let client: net.Socket | tls.TLSSocket;
          const onConnect = () => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              resolve(client);
            }
          };

          if (isTls) {
            client = tls.connect({ host, port, rejectUnauthorized: false }, onConnect);
          } else {
            client = net.createConnection({ host, port }, onConnect);
          }

          client.once('error', (err) => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              reject(new RedisUnavailableError(`Redis socket connection error: ${err.message}`));
            }
          });
        });

        // If password is present in URL, authenticate before handling user commands
        if (this.url.password) {
          await this.executeAuthDirect(socket, this.url.password);
        }

        // Attach permanent lifecycle event listeners
        socket.on('data', (chunk) => this.onSocketData(chunk));
        socket.on('error', (err) => this.onSocketError(err));
        socket.on('close', () => this.onSocketClose());
        socket.on('end', () => this.onSocketClose());

        this.socket = socket;
        return socket;
      } finally {
        this.connectPromise = null;
      }
    })();

    return this.connectPromise;
  }

  /**
   * Directly authenticates a new socket before exposing it to the command pipeline.
   */
  private async executeAuthDirect(socket: net.Socket | tls.TLSSocket, password: string): Promise<void> {
    const authCmd = this.encodeCommand(['AUTH', password]);

    return new Promise((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          socket.destroy();
          reject(new RedisUnavailableError('Redis AUTH command timed out'));
        }
      }, this.commandTimeoutMs);

      const onAuthData = (data: Buffer) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          socket.removeListener('data', onAuthData);
          socket.removeListener('error', onAuthErr);

          const str = data.toString('utf-8');
          if (str.startsWith('+OK') || str.startsWith('+')) {
            resolve();
          } else {
            socket.destroy();
            reject(new RedisUnavailableError(`Redis AUTH failed: ${str.trim()}`));
          }
        }
      };

      const onAuthErr = (err: Error) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          socket.removeListener('data', onAuthData);
          socket.removeListener('error', onAuthErr);
          socket.destroy();
          reject(new RedisUnavailableError(`Redis AUTH error: ${err.message}`));
        }
      };

      socket.once('data', onAuthData);
      socket.once('error', onAuthErr);
      socket.write(authCmd);
    });
  }

  /**
   * Enqueues a command and initiates serialized processing.
   */
  private sendCommand(args: string[], overrideTimeoutMs?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        args,
        resolve,
        reject,
        timeoutMs: overrideTimeoutMs || this.commandTimeoutMs,
      });
      this.processQueue();
    });
  }

  /**
   * Serialized Command Queue Worker.
   * Guarantees strictly sequential command execution over the socket.
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.activeCommand !== null || this.queue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const item = this.queue.shift()!;
    let socket: net.Socket | tls.TLSSocket;

    try {
      socket = await this.getSocket();
    } catch (err: any) {
      this.isProcessingQueue = false;
      item.reject(err instanceof RedisUnavailableError ? err : new RedisUnavailableError(err.message));
      // Trigger next item in queue
      this.processQueue();
      return;
    }

    const cmdState: ActiveCommandState = {
      args: item.args,
      resolve: item.resolve,
      reject: item.reject,
      settled: false,
      timer: (null as unknown) as NodeJS.Timeout,
    };

    cmdState.timer = setTimeout(() => {
      if (!cmdState.settled) {
        cmdState.settled = true;
        // On timeout, destroy socket because the TCP stream sequence is desynchronized
        this.cleanupSocket();
        this.activeCommand = null;
        this.buffer = Buffer.alloc(0);

        cmdState.reject(
          new RedisUnavailableError(
            `Redis command '${item.args[0]}' timed out after ${item.timeoutMs}ms`
          )
        );

        this.processQueue();
      }
    }, item.timeoutMs);

    this.activeCommand = cmdState;
    this.isProcessingQueue = false;

    // Send encoded RESP command to Redis
    const encoded = this.encodeCommand(item.args);
    socket.write(encoded);

    // If buffered data is already waiting, process immediately
    if (this.buffer.length > 0) {
      this.tryParseActiveCommand();
    }
  }

  /**
   * Data reception handler. Appends chunks to internal stream buffer and attempts parsing.
   */
  private onSocketData(chunk: Buffer): void {
    if (this.buffer.length === 0) {
      this.buffer = chunk;
    } else {
      this.buffer = Buffer.concat([this.buffer, chunk]);
    }

    this.tryParseActiveCommand();
  }

  /**
   * Attempts to parse the current active command from buffered RESP data.
   */
  private tryParseActiveCommand(): void {
    if (!this.activeCommand || this.activeCommand.settled) {
      return;
    }

    const parseResult = this.parseRespFromBuffer(this.buffer);
    if (!parseResult.complete) {
      // Message is incomplete, wait for subsequent TCP chunks
      return;
    }

    this.buffer = parseResult.remaining;
    const cmd = this.activeCommand;
    this.activeCommand = null;

    if (!cmd.settled) {
      cmd.settled = true;
      clearTimeout(cmd.timer);

      if (parseResult.isError) {
        cmd.reject(new Error(parseResult.value));
      } else {
        cmd.resolve(parseResult.value);
      }
    }

    // Process next queued command
    this.processQueue();
  }

  /**
   * Robust chunk-buffered RESP parser.
   * Handles partial TCP packets, multi-chunk bulk strings, nulls, integers, simple strings, and errors.
   */
  private parseRespFromBuffer(buf: Buffer): ParseResult {
    if (buf.length === 0) {
      return { complete: false, remaining: buf };
    }

    const typeByte = String.fromCharCode(buf[0]);

    // 1. Simple String (+OK\r\n)
    if (typeByte === '+') {
      const crlf = buf.indexOf('\r\n');
      if (crlf === -1) return { complete: false, remaining: buf };
      const value = buf.toString('utf-8', 1, crlf);
      return { complete: true, value, isError: false, remaining: buf.slice(crlf + 2) };
    }

    // 2. Error (-ERR ...\r\n)
    if (typeByte === '-') {
      const crlf = buf.indexOf('\r\n');
      if (crlf === -1) return { complete: false, remaining: buf };
      const value = buf.toString('utf-8', 1, crlf);
      return { complete: true, value, isError: true, remaining: buf.slice(crlf + 2) };
    }

    // 3. Integer (:1\r\n)
    if (typeByte === ':') {
      const crlf = buf.indexOf('\r\n');
      if (crlf === -1) return { complete: false, remaining: buf };
      const value = parseInt(buf.toString('utf-8', 1, crlf), 10);
      return { complete: true, value, isError: false, remaining: buf.slice(crlf + 2) };
    }

    // 4. Bulk String ($4\r\ntest\r\n or $-1\r\n)
    if (typeByte === '$') {
      const firstCrlf = buf.indexOf('\r\n');
      if (firstCrlf === -1) return { complete: false, remaining: buf };

      const lengthStr = buf.toString('utf-8', 1, firstCrlf);
      const length = parseInt(lengthStr, 10);

      // Null Bulk String ($-1\r\n)
      if (length === -1) {
        return { complete: true, value: null, isError: false, remaining: buf.slice(firstCrlf + 2) };
      }

      const totalExpected = firstCrlf + 2 + length + 2; // header + \r\n + payload + \r\n
      if (buf.length < totalExpected) {
        // Incomplete packet: await remaining payload bytes
        return { complete: false, remaining: buf };
      }

      const value = buf.toString('utf-8', firstCrlf + 2, firstCrlf + 2 + length);
      return { complete: true, value, isError: false, remaining: buf.slice(totalExpected) };
    }

    // 5. Fallback for unexpected line-terminated response
    const fallbackCrlf = buf.indexOf('\r\n');
    if (fallbackCrlf !== -1) {
      const value = buf.toString('utf-8', 0, fallbackCrlf).trim();
      return { complete: true, value, isError: false, remaining: buf.slice(fallbackCrlf + 2) };
    }

    return { complete: false, remaining: buf };
  }

  private onSocketError(err: Error): void {
    this.handleConnectionFailure(new RedisUnavailableError(`Redis socket error: ${err.message}`));
  }

  private onSocketClose(): void {
    this.handleConnectionFailure(new RedisUnavailableError('Redis connection closed unexpectedly'));
  }

  private handleConnectionFailure(error: RedisUnavailableError): void {
    this.cleanupSocket();
    this.buffer = Buffer.alloc(0);

    if (this.activeCommand && !this.activeCommand.settled) {
      this.activeCommand.settled = true;
      clearTimeout(this.activeCommand.timer);
      this.activeCommand.reject(error);
      this.activeCommand = null;
    }

    // Reject all waiting queued commands to prevent cascading delays
    while (this.queue.length > 0) {
      const queued = this.queue.shift()!;
      queued.reject(error);
    }

    this.isProcessingQueue = false;
  }

  private cleanupSocket(): void {
    if (this.socket) {
      this.socket.removeAllListeners('data');
      this.socket.removeAllListeners('error');
      this.socket.removeAllListeners('close');
      this.socket.removeAllListeners('end');
      if (!this.socket.destroyed) {
        this.socket.destroy();
      }
      this.socket = null;
    }
  }

  private encodeCommand(args: string[]): string {
    let resp = `*${args.length}\r\n`;
    for (const arg of args) {
      const bytes = Buffer.byteLength(arg);
      resp += `$${bytes}\r\n${arg}\r\n`;
    }
    return resp;
  }

  // --- Public API Methods ---

  async get(key: string): Promise<string | null> {
    try {
      const prefixed = this.applyPrefix(key);
      const res = await this.sendCommand(['GET', prefixed]);
      return typeof res === 'string' ? res : null;
    } catch (err: any) {
      if (err instanceof RedisUnavailableError) throw err;
      throw new RedisUnavailableError(err.message);
    }
  }

  async set(key: string, value: string, options?: SetOptions): Promise<boolean> {
    try {
      const prefixed = this.applyPrefix(key);
      const args = ['SET', prefixed, value];
      if (options?.exSeconds) {
        args.push('EX', options.exSeconds.toString());
      }
      if (options?.nx) {
        args.push('NX');
      }
      const res = await this.sendCommand(args);
      return res === 'OK';
    } catch (err: any) {
      if (err instanceof RedisUnavailableError) throw err;
      throw new RedisUnavailableError(err.message);
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const prefixed = this.applyPrefix(key);
      const res = await this.sendCommand(['DEL', prefixed]);
      return typeof res === 'number' ? res > 0 : Boolean(res);
    } catch (err: any) {
      if (err instanceof RedisUnavailableError) throw err;
      throw new RedisUnavailableError(err.message);
    }
  }

  async incr(key: string, exSeconds?: number): Promise<number> {
    try {
      const prefixed = this.applyPrefix(key);
      const res = await this.sendCommand(['INCR', prefixed]);
      const nextCount = typeof res === 'number' ? res : parseInt(res, 10);
      if (exSeconds && nextCount === 1) {
        await this.sendCommand(['EXPIRE', prefixed, exSeconds.toString()]);
      }
      return nextCount;
    } catch (err: any) {
      if (err instanceof RedisUnavailableError) throw err;
      throw new RedisUnavailableError(err.message);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const prefixed = this.applyPrefix(key);
      const res = await this.sendCommand(['TTL', prefixed]);
      return typeof res === 'number' ? res : parseInt(res, 10);
    } catch (err: any) {
      if (err instanceof RedisUnavailableError) throw err;
      throw new RedisUnavailableError(err.message);
    }
  }

  async ping(): Promise<boolean> {
    try {
      const res = await this.sendCommand(['PING']);
      return res === 'PONG';
    } catch (_) {
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.ping();
  }

  async disconnect(): Promise<void> {
    this.handleConnectionFailure(new RedisUnavailableError('Client disconnected'));
  }
}

/**
 * Singleton Redis provider for SPX Integration.
 * Enforces FAIL-CLOSED behavior in production if Redis is missing or disconnected.
 */
let redisClientInstance: SpxRedisClient | null = null;

export function getSpxRedis(): SpxRedisClient {
  if (redisClientInstance) {
    return redisClientInstance;
  }

  const redisUrl = process.env.SPX_REDIS_URL || process.env.REDIS_URL;

  if (redisUrl && redisUrl.trim()) {
    redisClientInstance = new NativeSocketRedisClient(redisUrl.trim());
    return redisClientInstance;
  }

  // Strict Production Check: NEVER fall back to in-memory in production!
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    throw new RedisUnavailableError(
      'SPX_REDIS_URL is required in production. In-memory fallback is strictly prohibited for security guarantees.'
    );
  }

  // Non-production fallback for automated unit testing only when explicitly permitted
  const allowDevFallback = process.env.SPX_ALLOW_DEV_FALLBACK === 'true';
  if (allowDevFallback) {
    redisClientInstance = new DevMemoryStore();
    return redisClientInstance;
  }

  // If unconfigured in local dev and fallback not opted-in, fail closed
  throw new RedisUnavailableError(
    'SPX Redis is not configured. Set SPX_REDIS_URL or SPX_ALLOW_DEV_FALLBACK=true for local testing.'
  );
}

/**
 * Helper to override or clear the client in automated tests.
 */
export function setSpxRedisClientForTesting(client: SpxRedisClient | null): void {
  redisClientInstance = client;
}
