import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("clinic_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, can optionally clear and redirect
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        // Only clear if on protected pages
        // localStorage.removeItem("clinic_token");
        // localStorage.removeItem("clinic_user");
      }
    }
    return Promise.reject(error);
  }
);

export default API;
