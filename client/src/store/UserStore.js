import { makeAutoObservable } from 'mobx';
import { clearAllStoryCaches } from '../utils/cache/clearAllStoryCaches';

export default class UserStore {
  constructor() { this._isAuth = false; this._user = {}; makeAutoObservable(this); }

  setIsAuth(bool) { this._isAuth = bool; }
  setUser(user)   { this._user = user; }

  get isAuth() { return this._isAuth; }
  get user()   { return this._user; }

  logout() {
    localStorage.removeItem('token');
    clearAllStoryCaches();   
    this.setUser({});
    this.setIsAuth(false);
  }
}
