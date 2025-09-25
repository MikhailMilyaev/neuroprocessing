import { $host, $authHost, ACCESS_KEY, scheduleAutoRefresh } from './index';
import { jwtDecode } from 'jwt-decode';
import { clearAllStoryCaches } from '../utils/cache/clearAllStoryCaches';
import { getDeviceId } from './deviceId';

export const registration = async (name, email, password) => {
  const { data } = await $host.post('/user/registration', { name, email, password, role: 'USER' });
  return data;
};

export const login = async (email, password, userStore) => {
  const deviceId = getDeviceId();
  const { data } = await $host.post('/user/login', { email, password, deviceId });
  localStorage.setItem(ACCESS_KEY, data.access);
  scheduleAutoRefresh();
  const decoded = jwtDecode(data.access);
  if (userStore) {
    userStore.setUser({ name: decoded.name, email: decoded.email });
    userStore.setIsAuth(true);
  }
  clearAllStoryCaches();
  return decoded;
};

export const check = async (userStore) => {
  const { data } = await $authHost.get('/user/check');
  localStorage.setItem(ACCESS_KEY, data.access);
  scheduleAutoRefresh();
  const decoded = jwtDecode(data.access);
  if (userStore) {
    userStore.setUser({ name: decoded.name, email: decoded.email });
    userStore.setIsAuth(true);
  }
  clearAllStoryCaches();
  return decoded;
};

export const refreshTokens = async () => {
  try {
    const deviceId = getDeviceId();
    const { data } = await $host.post('/user/token/refresh', { deviceId });
    localStorage.setItem(ACCESS_KEY, data.access);
    scheduleAutoRefresh();
    return data;
  } catch (e) {
    if (e.response?.status === 400 || e.response?.status === 401) return null;
    throw e;
  }
};

export const logout = async () => {
  try { await $host.post('/user/logout'); } catch {}
  localStorage.removeItem(ACCESS_KEY);
  clearAllStoryCaches();
  return { ok: true };
};

export const logoutAll = async () => {
  try { await $authHost.post('/user/logout-all'); } catch {}
  localStorage.removeItem(ACCESS_KEY);
  clearAllStoryCaches();
  return { ok: true };
};

export const resendVerification    = (email) => $host.post('/user/resend-verification', { email });
export const getVerifyStatus       = (email) => $host.get('/user/verify-status', { params: { email } });
export const activationLandingGate = (lt)    => $host.get('/user/activation-landing', { params: { lt } });

export const recoveryRequest       = (email) => $host.post('/user/password/reset', { email });
export const resetSentGate         = (rst)   => $host.get('/user/password/reset/sent-gate', { params: { rst } });
export const resetPasswordGate     = (pr)    => $host.get('/user/password/reset/gate', { params: { pr } });
export const resetPasswordConfirm  = (p)     => $host.post('/user/password/reset/confirm', p);
export const resetSuccessGate      = (ps)    => $host.get('/user/password/reset/success-gate', { params: { ps } });
