import net from 'net';
import tls from 'tls';
import { URL } from 'url';

export class RedisUnavailableError extends Error {
  constructor(message: string = 'SPX shared Redis infrastructure is unavailable') {
    super(message);
    this.name = 'RedisUnavailableError';
  }
}

interface SetOptions {
  exSeconds?: number;
  nx?: boolean;
}

interface SpxRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: SetOptions): Promise<boolean>;
  del(key: string): Promise<boolean>;
  incr(key: string, exSeconds?: number): Promise<number>;
  ttl(key: string): Promise<number>;
  ping(): Promise<boolean>;
  isAvailable(): Promise<boolean>;
  disconnect(): Promise<void>;
}

// In-memory test store used ONLY in non-production environments when SPX_ALLOW_DEV_FALLBACK is true
class DevMemoryStore implements SpxRedisClient {
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

/**
 * Lightweight, zero-dependency native Node.js RESP (Redis Serialization Protocol) client.
 * Connects over TCP or TLS (redis:// and rediss://).
 */
class NativeSocketRedisClient implements SpxRedisClient {
  private url: URL;
  private prefix = 'spx:';
  private socket: net.Socket | tls.TLSSocket | null = null;
  private isConnecting = false;

  constructor(connectionUrl: string) {
    this.url = new URL(connectionUrl);
  }

  private applyPrefix(key: string): string {
    return key.startsWith(this.prefix) ? key : `${this.prefix}${key}`;
  }

  private async getSocket(): Promise<net.Socket | tls.TLSSocket> {
    if (this.socket && !this.socket.destroyed) {
      return this.socket;
    }

    if (this.isConnecting) {
      // Small sleep while waiting
      await new Promise((resolve) => setTimeout(resolve, 50));
      return this.getSocket();
    }

    this.isConnecting = true;
    try {
      const isTls = this.url.protocol === 'rediss:';
      const port = parseInt(this.url.port || '6379', 10);
      const host = this.url.hostname || 'localhost';

      const socket = await new Promise<net.Socket | tls.TLSSocket>((resolve, reject) => {
        const timeout = setTimeout(() => {
          client.destroy();
          reject(new RedisUnavailableError(`Connection timeout to Redis at ${host}:${port}`));
        }, 3000);

        let client: net.Socket | tls.TLSSocket;
        if (isTls) {
          client = tls.connect({ host, port, rejectUnauthorized: false }, () => {
            clearTimeout(timeout);
            resolve(client);
          });
        } else {
          client = net.createConnection({ host, port }, () => {
            clearTimeout(timeout);
            resolve(client);
          });
        }

        client.on('error', (err) => {
          clearTimeout(timeout);
          reject(new RedisUnavailableError(err.message));
        });
      });

      this.socket = socket;

      // Handle AUTH if password is present in URL
      if (this.url.password) {
        await this.sendCommand(['AUTH', this.url.password]);
      }

      return socket;
    } finally {
      this.isConnecting = false;
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

  private async sendCommand(args: string[]): Promise<any> {
    const socket = await this.getSocket();
    const command = this.encodeCommand(args);

    return new Promise((resolve, reject) => {
      const onData = (data: Buffer) => {
        socket.removeListener('data', onData);
        socket.removeListener('error', onError);

        const responseStr = data.toString('utf-8');
        const firstChar = responseStr[0];

        if (firstChar === '-') {
          // Redis Error
          const line = responseStr.substring(1, responseStr.indexOf('\r\n'));
          reject(new Error(line));
        } else if (firstChar === '+') {
          // Simple String (e.g. +OK\r\n)
          const line = responseStr.substring(1, responseStr.indexOf('\r\n'));
          resolve(line);
        } else if (firstChar === ':') {
          // Integer (e.g. :1\r\n)
          const line = responseStr.substring(1, responseStr.indexOf('\r\n'));
          resolve(parseInt(line, 10));
        } else if (firstChar === '$') {
          // Bulk String (e.g. $4\r\ntest\r\n or $-1\r\n)
          const firstLineEnd = responseStr.indexOf('\r\n');
          const length = parseInt(responseStr.substring(1, firstLineEnd), 10);
          if (length === -1) {
            resolve(null);
          } else {
            const content = responseStr.substring(firstLineEnd + 2, firstLineEnd + 2 + length);
            resolve(content);
          }
        } else {
          resolve(responseStr.trim());
        }
      };

      const onError = (err: Error) => {
        socket.removeListener('data', onData);
        reject(new RedisUnavailableError(err.message));
      };

      socket.once('data', onData);
      socket.once('error', onError);
      socket.write(command);
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      const prefixed = this.applyPrefix(key);
      const res = await this.sendCommand(['GET', prefixed]);
      return typeof res === 'string' ? res : null;
    } catch (err: any) {
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
      throw new RedisUnavailableError(err.message);
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const prefixed = this.applyPrefix(key);
      const res = await this.sendCommand(['DEL', prefixed]);
      return res > 0;
    } catch (err: any) {
      throw new RedisUnavailableError(err.message);
    }
  }

  async incr(key: string, exSeconds?: number): Promise<number> {
    try {
      const prefixed = this.applyPrefix(key);
      const res = await this.sendCommand(['INCR', prefixed]);
      if (exSeconds && res === 1) {
        await this.sendCommand(['EXPIRE', prefixed, exSeconds.toString()]);
      }
      return typeof res === 'number' ? res : parseInt(res, 10);
    } catch (err: any) {
      throw new RedisUnavailableError(err.message);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const prefixed = this.applyPrefix(key);
      const res = await this.sendCommand(['TTL', prefixed]);
      return typeof res === 'number' ? res : parseInt(res, 10);
    } catch (err: any) {
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
    if (this.socket && !this.socket.destroyed) {
      this.socket.destroy();
      this.socket = null;
    }
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

