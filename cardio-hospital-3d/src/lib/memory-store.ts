/**
 * Key/value store for application data.
 * Persists to localStorage so rotation progress, action logs, pager state, and
 * mastery survive page reloads. Falls back to an in-memory Map when storage is
 * unavailable (e.g. private browsing).
 */

export type MemoryValue = unknown;

interface MemoryStoreApiBase {
  put<T = MemoryValue>(key: string, value: T): void;
  get<T = MemoryValue>(key: string): T | undefined;
  remove(key: string): void;
  clear(): void;
  snapshot(): Record<string, MemoryValue>;
}

export interface MemoryStoreApi extends MemoryStoreApiBase {
  ensure<T>(key: string, init: () => T): T;
}

const STORAGE_PREFIX = "cardio_hospital:v1:";
const backing = new Map<string, MemoryValue>();

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function storageKey(key: string): string {
  return STORAGE_PREFIX + key;
}

function readFromStorage<T>(key: string): T | undefined {
  if (!hasStorage()) return undefined;
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (raw == null) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function writeToStorage(key: string, value: MemoryValue) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch {
    // Ignore quota / serialization errors — session continues in memory.
  }
}

function removeFromStorage(key: string) {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(storageKey(key));
  } catch {
    // ignore
  }
}

function clearAllStorage() {
  if (!hasStorage()) return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

const core: MemoryStoreApiBase = {
  put(key, value) {
    backing.set(key, value);
    writeToStorage(key, value);
  },
  get<T = MemoryValue>(key: string) {
    if (backing.has(key)) return backing.get(key) as T;
    const persisted = readFromStorage<T>(key);
    if (persisted !== undefined) {
      backing.set(key, persisted);
      return persisted;
    }
    return undefined;
  },
  remove(key) {
    backing.delete(key);
    removeFromStorage(key);
  },
  clear() {
    backing.clear();
    clearAllStorage();
  },
  snapshot() {
    return Object.fromEntries(backing.entries());
  },
};

export const memory: MemoryStoreApi = Object.assign(core, {
  ensure<T>(key: string, init: () => T): T {
    const existing = core.get<T>(key);
    if (existing !== undefined) return existing;
    const value = init();
    core.put(key, value);
    return value;
  },
});

export const KEYS = {};
