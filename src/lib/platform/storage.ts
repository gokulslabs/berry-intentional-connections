/**
 * Platform-agnostic storage adapter.
 * Web: uses localStorage.
 * React Native: swap with AsyncStorage implementation.
 */

export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

/** Default web adapter — synchronous localStorage wrapper. */
const webStorage: StorageAdapter = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
};

let _adapter: StorageAdapter = webStorage;

/** Replace the storage backend (call once at app startup for RN). */
export function setStorageAdapter(adapter: StorageAdapter) {
  _adapter = adapter;
}

export function getStorageAdapter(): StorageAdapter {
  return _adapter;
}
