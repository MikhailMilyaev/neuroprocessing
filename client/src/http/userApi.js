import { $host, $authHost, ACCESS_KEY } from './index';
import { jwtDecode } from 'jwt-decode';
import { clearAllStoryCaches } from '../utils/cache/clearAllStoryCaches';
import { getDeviceId } from './deviceId';

export const registration = async (name, email, password) => {
  const { data } = await $host.post('api/user/registration', { name, email, password, role: 'USER' });
  return data;
};

export const login = async (email, password, userStore) => {
  const deviceId = getDeviceId();
  const { data } = await $host.post('api/user/login', { email, password, deviceId });
  localStorage.setItem(ACCESS_KEY, data.access);

  const decoded = jwtDecode(data.access);
  if (userStore) {
    userStore.setUser({ name: decoded.name, email: decoded.email });
    userStore.setIsAuth(true);
  }
  clearAllStoryCaches();
  return decoded;
};

export const check = async (userStore) => {
  const { data } = await $authHost.get('api/user/check');
  localStorage.setItem(ACCESS_KEY, data.access);
  const decoded = jwtDecode(data.access);
  if (userStore) {
    userStore.setUser({ name: decoded.name, email: decoded.email });
    userStore.setIsAuth(true);
  }
  clearAllStoryCaches();
  return decoded;
};

export const refreshTokens = async () => {
  const deviceId = getDeviceId();  
  const { data } = await $host.post('api/user/token/refresh', { deviceId });
  localStorage.setItem(ACCESS_KEY, data.access);
  return data;
};

export const logout = async () => {
  try { await $host.post('api/user/logout'); } catch {}
  localStorage.removeItem(ACCESS_KEY);
  clearAllStoryCaches();
  return { ok: true };
};

export const logoutAll = async () => {
  try { await $authHost.post('api/user/logout-all'); } catch {}
  localStorage.removeItem(ACCESS_KEY);
  clearAllStoryCaches();
  return { ok: true };
};

export const resendVerification  = (email) => $host.post('api/user/resend-verification', { email });
export const getVerifyStatus     = (email) => $host.get('api/user/verify-status', { params: { email } });
export const activationLandingGate = (lt) => $host.get('api/user/activation-landing', { params: { lt } });

export const recoveryRequest     = (email) => $host.post('api/user/password/reset', { email });
export const resetSentGate       = (rst) => $host.get('api/user/password/reset/sent-gate', { params: { rst } });
export const resetPasswordGate   = (pr)  => $host.get('api/user/password/reset/gate', { params: { pr } });
export const resetPasswordConfirm= (p)   => $host.post('api/user/password/reset/confirm', p);
export const resetSuccessGate    = (ps)  => $host.get('api/user/password/reset/success-gate', { params: { ps } });
