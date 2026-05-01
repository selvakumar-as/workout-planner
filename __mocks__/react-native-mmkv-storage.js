// Jest mock for react-native-mmkv-storage — in-memory storage backend.
class MMKVInstance {
  constructor() {
    this._store = new Map();
  }
  getItem(key) { return Promise.resolve(this._store.get(key) ?? null); }
  setItem(key, value) { this._store.set(key, value); return Promise.resolve(true); }
  removeItem(key) { this._store.delete(key); return true; }
  getString(key) { return this._store.get(key) ?? null; }
  setString(key, value) { this._store.set(key, value); return true; }
  getStringAsync(key) { return Promise.resolve(this._store.get(key) ?? null); }
  setStringAsync(key, value) { this._store.set(key, value); return Promise.resolve(true); }
}

class MMKVLoader {
  withInstanceID(id) { this._id = id; return this; }
  withEncryption() { return this; }
  withServiceName() { return this; }
  withAccessGroup() { return this; }
  initialize() { return new MMKVInstance(); }
}

module.exports = { MMKVLoader, MMKVInstance };
