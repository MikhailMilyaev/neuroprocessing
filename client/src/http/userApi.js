import { $host, $authHost } from './index';
import { jwtDecode } from 'jwt-decode';
import { clearAllStoryCaches } from '../utils/cache/clearAllStoryCaches';

export const registration = async (name, email, password) => {
  const { data } = await $host.post('api/user/registration', {
    name,
    email,
    password,
    role: 'USER',
  });
  return data;
};

export const login = async (email, password, userStore) => {
  const { data } = await $host.post('api/user/login', { email, password });
  localStorage.setItem('token', data.token);
  const decoded = jwtDecode(data.token);
  if (userStore) {
    userStore.setUser({ name: decoded.name, email: decoded.email });
    userStore.setIsAuth(true);
  }
  clearAllStoryCaches();
  return decoded;
};

export const check = async (userStore) => {
  const { data } = await $authHost.get('api/user/check');
  localStorage.setItem('token', data.token);
  const decoded = jwtDecode(data.token);
  if (userStore) {
    userStore.setUser({ name: decoded.name, email: decoded.email });
    userStore.setIsAuth(true);
  }
  clearAllStoryCaches();
  return decoded;
};

// ───────── verify
export const resendVerification = async (email) => {
  return $host.post('api/user/resend-verification', { email });
};
export const getVerifyStatus = async (email) => {
  return $host.get('api/user/verify-status', { params: { email } });
};
export const activationLandingGate = async (lt) => {
  return $host.get('api/user/activation-landing', { params: { lt } });
};

// ───────── recovery (не forgot)
export const recoveryRequest = async (email) => {
  // backend: POST /api/user/password/forgot
  return $host.post('api/user/password/reset', { email });
};
export const resetSentGate = async (rst) => {
  return $host.get('api/user/password/reset/sent-gate', { params: { rst } });
};
export const resetPasswordGate = async (pr) => {
  return $host.get('api/user/password/reset/gate', { params: { pr } });
};
export const resetPasswordConfirm = async ({ pr, newPassword }) => {
  return $host.post('api/user/password/reset/confirm', { pr, newPassword });
};
export const resetSuccessGate = async (ps) => {
  return $host.get('api/user/password/reset/success-gate', { params: { ps } });
};
