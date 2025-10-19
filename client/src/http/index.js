import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { getDeviceId } from './deviceId';

export const ACCESS_KEY = 'access';
const baseEnv = import.meta.env.VITE_API_URL || '/api';
const baseURL = baseEnv.endsWith('/') ? baseEnv : baseEnv + '/';

const common = { baseURL, withCredentials: true };

const $host = axios.create(common);
const $authHost = axios.create(common);

$authHost.interceptors.request.use((config) => {
  const access = localStorage.getItem(ACCESS_KEY);
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

let isRefreshing = false;
let queue = [];
let softRedirectDone = false;
let refreshTimerId;

function softRedirectToLoginOnce() {
  if (softRedirectDone) return;
  softRedirectDone = true;
  try { localStorage.removeItem(ACCESS_KEY); } catch {}
  if (typeof window !== 'undefined') {
    const path = window.location?.pathname || '/';
    if (path.startsWith('/login')) return;
    const sp = new URLSearchParams({ from: path }).toString();
    window.location.replace(`/login?${sp}`);
  }
}

export function cancelAutoRefresh() {
  clearTimeout(refreshTimerId);
}

export function scheduleAutoRefresh() {
  clearTimeout(refreshTimerId);
  const access = localStorage.getItem(ACCESS_KEY);
  if (!access) return;
  try {
    const { exp } = jwtDecode(access);
    const ms = exp * 1000 - Date.now() - 60000;
    if (ms > 0) {
      refreshTimerId = setTimeout(() => {
        runRefresh().catch(() => softRedirectToLoginOnce());
      }, ms);
    }
  } catch {}
}

async function runRefresh() {
  const deviceId = getDeviceId();
  const { data } = await $host.post('/user/token/refresh', { deviceId });
  localStorage.setItem(ACCESS_KEY, data.access);
  scheduleAutoRefresh();
  return data.access;
}

$authHost.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;
    if (response?.status !== 401 || config?._retry) {
      return Promise.reject(error);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      runRefresh()
        .then((newAccess) => {
          queue.forEach(({ resolve }) => resolve(newAccess));
        })
        .catch((err) => {
          queue.forEach(({ reject }) => reject(err));
          softRedirectToLoginOnce();
        })
        .finally(() => {
          queue = [];
          isRefreshing = false;
        });
    }

    return new Promise((resolve, reject) => {
      queue.push({
        resolve: (newAccess) => {
          const retry = { ...config, _retry: true };
          retry.headers = { ...(retry.headers || {}), Authorization: `Bearer ${newAccess}` };
          resolve($authHost.request(retry));
        },
        reject,
      });
    });
  }
);

export { $host, $authHost };
