import { jwtDecode } from 'jwt-decode';
import { ACCESS_KEY } from '../http';

export function currentUserId() {
  try {
    const t = localStorage.getItem(ACCESS_KEY);
    if (!t) return 'anon';
    const decoded = jwtDecode(t);
    return decoded?.id ?? 'anon';
  } catch {
    return 'anon';
  }
}

export const ns = (key) => `u:${currentUserId()}:${key}`;
