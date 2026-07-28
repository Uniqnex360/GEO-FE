// import axios from "axios";
// import { tokenStorage } from "../helpers/auth";

// export const API_V1 = "/api/v1/";

// export const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL,
// });

// // ------------------------
// // 1. REQUEST interceptor
// // ------------------------
// api.interceptors.request.use((config) => {
//   const token = tokenStorage.getAccess();

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// // ------------------------
// // 2. REFRESH logic state
// // ------------------------
// let isRefreshing = false;
// let queue: any[] = [];

// // ------------------------
// // helper to process queue
// // ------------------------
// const processQueue = (error: any, token: string | null = null) => {
//   queue.forEach((prom) => {
//     if (token) prom.resolve(token);
//     else prom.reject(error);
//   });

//   queue = [];
// };

// // ------------------------
// // 3. RESPONSE interceptor
// // ------------------------
// api.interceptors.response.use(
//   (response) => response,

//   async (error) => {
//     const originalRequest = error.config;

//     // If token expired (401)
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       // If refresh already running → queue requests
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           queue.push({ resolve, reject });
//         }).then((token) => {
//           originalRequest.headers.Authorization = `Bearer ${token}`;
//           return api(originalRequest);
//         });
//       }

//       isRefreshing = true;

//       try {
//         const refreshToken = tokenStorage.getRefresh();

//         const res = await axios.post(
//           import.meta.env.VITE_API_BASE_URL + "/api/v1/auth/refresh_token/",
//           {
//             refresh_token: refreshToken,
//           },
//         );

//         const newAccessToken = res.data.access_token;
//         const newRefreshToken = res.data.refresh_token;

//         tokenStorage.setTokens(newAccessToken, newRefreshToken);

//         api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;

//         processQueue(null, newAccessToken);

//         // retry original request
//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//         return api(originalRequest);
//       } catch (err) {
//         processQueue(err, null);

//         tokenStorage.clear();
//         window.location.href = "/login";

//         return Promise.reject(err);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(error);
//   },
// );

import axios from "axios";
import { tokenStorage } from "../helpers/auth";

export const API_V1 = "/api/v1/";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// ------------------------
// 1. REQUEST interceptor
// ------------------------
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ------------------------
// 2. REFRESH logic state
// ------------------------
let isRefreshing = false;
let queue: any[] = [];

console.log("[API INIT] Refresh system initialized");

// ------------------------
// helper to process queue
// ------------------------
const processQueue = (error: any, token: string | null = null) => {
  console.log("[QUEUE] Processing queue...");
  console.log("[QUEUE] Success token:", !!token);
  console.log("[QUEUE] Error:", error);

  queue.forEach((prom, index) => {
    console.log("[QUEUE] Resolving item:", index);

    if (token) prom.resolve(token);
    else prom.reject(error);
  });

  queue = [];
  console.log("[QUEUE] Queue cleared");
};

// ------------------------
// 3. RESPONSE interceptor
// ------------------------
api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    console.log("[API ERROR] URL:", error.config?.url);
    console.log("[API ERROR] Status:", error.response?.status);
    console.log("[API ERROR] Data:", error.response?.data);

    const originalRequest = error.config;

    // If token expired (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("[REFRESH] Triggered for:", originalRequest.url);

      originalRequest._retry = true;

      // If refresh already running → queue requests
      if (isRefreshing) {
        console.log("[REFRESH] Already running → queueing request");

        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          console.log("[QUEUE] Retrying request after refresh");

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;
      console.log("[REFRESH] Starting refresh flow");

      try {
        const refreshToken = tokenStorage.getRefresh();

        console.log("[REFRESH] Refresh token exists:", !!refreshToken);

        const res = await axios.post(
          import.meta.env.VITE_API_BASE_URL + "api/v1/auth/refresh_token/",
          {
            refresh_token: refreshToken,
          },
        );

        console.log("[REFRESH] Response received:", res.data);

        const newAccessToken = res.data.access_token;
        const newRefreshToken = res.data.refresh_token;

        console.log("[REFRESH] New access token received:", !!newAccessToken);
        console.log("[REFRESH] New refresh token received:", !!newRefreshToken);

        tokenStorage.setTokens(newAccessToken, newRefreshToken);

        api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
        console.log("[REFRESH] Axios default header updated");

        processQueue(null, newAccessToken);

        // retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        console.log(
          "[REFRESH] Retrying original request:",
          originalRequest.url,
        );

        return api(originalRequest);
      } catch (err) {
        console.log("[REFRESH ERROR]", err);

        processQueue(err, null);

        tokenStorage.clear();
        console.log("[AUTH] Tokens cleared, redirecting to login");

        window.location.href = "/login";

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
        console.log("[REFRESH] Flow ended");
      }
    }

    return Promise.reject(error);
  },
);
