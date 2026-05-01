// Jest mock for react-native-mmkv — in-memory storage backend.
function createMMKV() {
  const store = new Map();
  return {
    getString: (key) => store.get(key) ?? undefined,
    set: (key, value) => store.set(key, value),
    delete: (key) => store.delete(key),
    remove: (key) => store.delete(key),
    contains: (key) => store.has(key),
    getAllKeys: () => Array.from(store.keys()),
  };
}

module.exports = { createMMKV };
