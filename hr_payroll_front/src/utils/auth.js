// src/utils/auth.js
import { axiosPublic } from "../api/axiosInstance";

export function getAccessToken() {
  return localStorage.getItem("access");
}

export function getRefreshToken() {
  return localStorage.getItem("refresh");
}

export async function refreshToken() {
  try {
    const refresh = getRefreshToken();
    const res = await axiosPublic.post("/auth/djoser/jwt/refresh/", { refresh });

    localStorage.setItem("access", res.data.access);
    return res.data.access;
  } catch (err) {
    console.log("Failed to refresh token:", err);
    return null;
  }
}
