import axios from 'axios';
import { API_BASE_URL } from '../config/runtimeConfig';

export const BASE_URL = API_BASE_URL;

export const axiosPublic = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function createAxiosPrivate({ getAccessToken, onRefresh, onLogout }) {
  const instance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });
  instance.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error?.config;

      if (!originalRequest || originalRequest.url.includes('/auth/djoser/jwt/refresh/')) {
        return Promise.reject(error);
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return instance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        // 2. Start the refresh process
        originalRequest._retry = true;
        isRefreshing = true;

        return new Promise((resolve, reject) => {
          onRefresh()
            .then((newAccess) => {
              if (newAccess) {
                console.log('Token refreshed successfully. Retrying queued requests.');
                
                originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                
                processQueue(null, newAccess);
                resolve(instance(originalRequest));
              } else {
                throw new Error("Refresh failed: No token returned.");
              }
            })
            .catch((refreshError) => {
              processQueue(refreshError, null);
              console.error('Refresh token expired or invalid. Logging out.');
              if (typeof onLogout === 'function') onLogout();
              reject(refreshError);
            })
            .finally(() => {
              isRefreshing = false;
            });
        });
      }

      return Promise.reject(error);
    }
  );

  instance._ejectInterceptors = () => {
  };

  return instance;
}



































































































// import axios from 'axios';
// export const BASE_URL = 'http://localhost:3000/api/v1';
// // export const BASE_URL = 'http://192.168.114.173:3000/api/v1';
// //B3Library...........................
// // export const BASE_URL = 'http://172.16.0.181:3000/api/v1';
// // Alx.....................
// // export const BASE_URL = 'http://172.16.27.124:3000/api/v1';
// // export const BASE_URL = 'http://172.16.27.124:3000/api/v1';
// //ME
// // export const BASE_URL = 'http://10.198.81.173:3000/api/v1';
// // changable
// // export const BASE_URL = 'http://10.165.115.12:3000/api/v1';
// //Seud
// // export const BASE_URL = 'http://192.168.75.173:3000/api/v1';

// export const axiosPublic = axios.create({
//   baseURL: BASE_URL,
//   headers: { 'Content-Type': 'application/json' },
// });

// export function createAxiosPrivate({ getAccessToken, onRefresh, onLogout }) {
//   const instance = axios.create({
//     baseURL: BASE_URL,
//     withCredentials: true,
//     headers: { 'Content-Type': 'application/json' },
//     timeout: 10000,
//   });

//   const request = instance.interceptors.request.use(
//     (config) => {
//       const token = getAccessToken();
//       if (token) {
//         config.headers = config.headers || {};
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//       return config;
//     },
//     (error) => Promise.reject(error)
//   );
//   const response = instance.interceptors.response.use(
//     (res) => res,
//     async (error) => {
//       const originalRequest = error?.config;
//       if (!originalRequest) return Promise.reject(error);
//       if (error.response?.status === 401 && !originalRequest._retry) {
//         originalRequest._retry = true;
//         if (typeof onRefresh === 'function') {
//           try {
//             const newAccess = await onRefresh();
//             if (newAccess) {
//               console.log(
//                 'just refreshed now because the access token has expired'
//               );
//               originalRequest.headers = originalRequest.headers || {};
//               originalRequest.headers.Authorization = `Bearer ${newAccess}`;
//               return instance(originalRequest);
//             }
//           } catch (e) {
//             console.error(e);
//           }
//         }
//         if (typeof onLogout === 'function') onLogout();
//       }
//       return Promise.reject(error);
//     }
//   );

//   instance._ejectInterceptors = () => {
//     instance.interceptors.request.eject(request);
//     instance.interceptors.response.eject(response);
//   };

//   return instance;
// }
