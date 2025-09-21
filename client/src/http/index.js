import axios from 'axios';

export const ACCESS_KEY = 'access';

const baseURL = process.env.REACT_APP_API_URL;

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

async function runRefresh() {
  const { data } = await $host.post('/api/user/token/refresh', {});
  localStorage.setItem(ACCESS_KEY, data.access);
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
          try { localStorage.removeItem(ACCESS_KEY); } catch {}
          queue.forEach(({ reject }) => reject(err));
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
