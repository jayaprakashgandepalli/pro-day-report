import { prisma } from '@/lib/prisma';

let cachedConfigs: any[] | null = null;
let lastConfigFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

/**
 * Returns all ConfigValue records from memory cache if fresh,
 * or queries Prisma and updates cache.
 */
export async function getAllConfigsCached() {
  const now = Date.now();
  if (cachedConfigs && (now - lastConfigFetchTime < CACHE_TTL_MS)) {
    return cachedConfigs;
  }

  try {
    cachedConfigs = await prisma.configValue.findMany({
      orderBy: { value: 'asc' }
    });
    lastConfigFetchTime = now;
    return cachedConfigs;
  } catch (error) {
    console.error('Error fetching configs from database:', error);
    // If cache exists even if expired, return it as fallback during DB hiccup
    if (cachedConfigs) return cachedConfigs;
    throw error;
  }
}

/**
 * Returns a dictionary mapping config ID -> value string.
 * Completely instantaneous lookup.
 */
export async function getConfigMapCached(): Promise<Record<string, string>> {
  const configs = await getAllConfigsCached();
  const map: Record<string, string> = {};
  for (let i = 0; i < configs.length; i++) {
    map[configs[i].id] = configs[i].value;
  }
  return map;
}

/**
 * Returns configs filtered by type from cache.
 */
export async function getConfigsByTypeCached(type: string) {
  const configs = await getAllConfigsCached();
  return configs.filter(c => c.type === type);
}

/**
 * Invalidates the in-memory config cache.
 * Call this when an admin creates, updates, or deletes a ConfigValue.
 */
export function invalidateConfigCache() {
  cachedConfigs = null;
  lastConfigFetchTime = 0;
}
