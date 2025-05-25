// Simple in-memory token storage for tests
export const tokenStorage = {
  _store: new Map(),
  
  setToken(token) {
    this._store.set('authToken', token);
    if (global.localStorage) {
      global.localStorage.setItem('authToken', token);
    }
  },
  
  getToken() {
    return this._store.get('authToken') || null;
  },
  
  clearToken() {
    this._store.delete('authToken');
    if (global.localStorage) {
      global.localStorage.removeItem('authToken');
    }
  },
  
  clear() {
    this._store.clear();
    if (global.localStorage) {
      global.localStorage.clear();
    }
  }
};

export default tokenStorage;
