// Единый источник правды для базовых URL.
const api = import.meta.env.VITE_API_URL ?? "/api";

export const API_BASE_URL = api;
export const STATIC_BASE_URL = api.replace(/\/api$/, "");
export const BASE_URL = import.meta.env.BASE_URL ?? "/";

// Собирает полный URL картинки из пути, который лежит в БД.
export const imageUrl = (path) => {
  if (!path || typeof path !== "string") return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `${STATIC_BASE_URL}${path}`;
};
