import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite-плагин: отдаёт моковые данные для /api/* запросов.
 * Включается только когда VITE_USE_MOCKS=true.
 * Когда бэкенд оживёт — просто поставьте VITE_USE_MOCKS=false в .env.local,
 * и запросы пойдут через прокси на настоящий бэкенд. Код менять не нужно.
 */
function mockApiPlugin() {
  const mocksDir = path.resolve(__dirname, "src/mocks");

  return {
    name: "mock-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();

        const url = new URL(req.url, "http://localhost");
        const pathname = url.pathname;
        const segments = pathname.replace(/^\/api\//, "").split("/");
        const resource = segments[0];
        const id = segments[1];

        const readFile = (name) =>
          JSON.parse(fs.readFileSync(path.join(mocksDir, name), "utf-8"));

        let data = null;
        let status = 200;

        try {
          if (resource === "events") {
            const events = readFile("events.json");
            if (id === "my") {
              const user = readFile("user.json");
              data = events.filter((e) => user.registeredEvents.includes(e.id));
            } else if (id) {
              const numericId = parseInt(id, 10);
              data = events.find((e) => e.id === numericId);
              if (!data) status = 404;
            } else {
              data = events;
            }
          } else if (resource === "user" && segments[1] === "me") {
            data = readFile("user.json");
          } else if (resource === "auth") {
            // Mock-ответы для auth-эндпоинтов, чтобы UI не падал
            if (segments[1] === "login") {
              data = { user: readFile("user.json"), token: "mock-jwt-token" };
            } else if (segments[1] === "logout") {
              data = { ok: true };
            } else if (segments[1] === "refresh") {
              data = { token: "mock-jwt-token-refreshed" };
            } else {
              status = 404;
              data = { error: "Mock auth endpoint not found" };
            }
          } else if (resource === "users") {
            data = readFile("user.json");
          } else {
            status = 404;
            data = { error: "Mock not found", path: pathname };
          }
        } catch (err) {
          status = 500;
          data = { error: "Mock server error", message: err.message };
        }

        // Имитация сетевой задержки 200мс — похоже на реальный API
        setTimeout(() => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        }, 200);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useMocks = env.VITE_USE_MOCKS === "true";
  const backendUrl = env.VITE_API_URL ?? "http://localhost:3000";

  return {
    plugins: [react(), ...(useMocks ? [mockApiPlugin()] : [])],

    // Когда бэкенд живой — VITE_USE_MOCKS=false, прокси направляет /api на бэк.
    // Когда бэкенд мёртв — VITE_USE_MOCKS=true, моки отдаются middleware'ем.
    server: {
      port: 5173,
      host: true,
      ...(useMocks
        ? {}
        : {
            proxy: {
              "/api": {
                target: backendUrl,
                changeOrigin: true,
              },
              "/uploads": {
                target: backendUrl,
                changeOrigin: true,
              },
            },
          }),
    },

    // Совместимость со старым import-ом './App' без расширения
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    },
  };
});
