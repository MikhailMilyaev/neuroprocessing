import { jwtDecode } from 'jwt-decode';

export function currentUserId() {
  try {
    const t = localStorage.getItem('token');
    if (!t) return 'anon';
    const decoded = jwtDecode(t);
    return decoded?.id ?? 'anon';
  } catch {
    return 'anon';
  }
}

// Префиксуем любые ключи стораджа id пользователя
export const ns = (key) => `u:${currentUserId()}:${key}`;
