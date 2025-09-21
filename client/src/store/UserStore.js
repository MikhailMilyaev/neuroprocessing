import { makeAutoObservable } from 'mobx';
import { clearAllStoryCaches } from '../utils/cache/clearAllStoryCaches';
import { logout as apiLogout } from '../http/userApi';
import { ACCESS_KEY } from '../http';

export default class UserStore {
  constructor() { this._isAuth = false; this._user = {}; makeAutoObservable(this); }

  setIsAuth(v) { this._isAuth = v; }
  setUser(u)   { this._user = u; }

  get isAuth() { return this._isAuth; }
  get user()   { return this._user; }

  async logout() {
    try { await apiLogout(); } catch {}
    localStorage.removeItem(ACCESS_KEY);
    clearAllStoryCaches();
    this.setUser({});
    this.setIsAuth(false);
  }
}
