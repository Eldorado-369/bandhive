// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',  
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.url !== "/jwt-login/") {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Request URL:", `${config.baseURL}${config.url}`);
      console.log("Sending token:", token);
    } else if (!token) {
      console.warn("No access token found in localStorage");
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor unchanged
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response || error.config.url === "/jwt-login/") {
      return Promise.reject(error);
    }
    if (error.response.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const response = await api.post("/token/refresh/", { refresh: refreshToken });
          const newAccessToken = response.data.access;
          localStorage.setItem("accessToken", newAccessToken);
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return api.request(error.config);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          window.location.href = "/login";
        }
      } else {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;