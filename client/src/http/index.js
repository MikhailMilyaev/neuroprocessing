import axios from 'axios';

export const ACCESS_KEY  = 'access';
export const REFRESH_KEY = 'refresh';

const baseURL = process.env.REACT_APP_API_URL;

const $host = axios.create({ baseURL });
const $authHost = axios.create({ baseURL });

$authHost.interceptors.request.use((config) => {
  const access = localStorage.getItem(ACCESS_KEY);
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

let isRefreshing = false;
let queue = [];

async function runRefresh() {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) throw new Error('no refresh');

  const { data } = await $host.post('/api/user/token/refresh', { refresh });
  localStorage.setItem(ACCESS_KEY, data.access);
  localStorage.setItem(REFRESH_KEY, data.refresh);
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
         try {
           localStorage.removeItem(ACCESS_KEY);
           localStorage.removeItem(REFRESH_KEY);
         } catch {}
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
        reject: (err) => {
          reject(err);
        },
      });
    });
  }
);

export { $host, $authHost };
