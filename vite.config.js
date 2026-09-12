import { defineConfig } from "vite";
import { resolve } from "node:path";

function movementRedirect(server) {
  server.middlewares.use((req, res, next) => {
    const url = new URL(req.url, "http://localhost");
    if (!["/movement", "/movement/pole"].includes(url.pathname)) return next();
    res.writeHead(302, { Location: `${url.pathname}/${url.search}` });
    res.end();
  });
}

export default defineConfig({
  base: "/",
  plugins: [{
    name: "movement-directory-redirect",
    configureServer: movementRedirect,
    configurePreviewServer: movementRedirect,
  }],
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, "index.html"),
        intro: resolve(import.meta.dirname, "intro.html"),
        window: resolve(import.meta.dirname, "window.html"),
        movement: resolve(import.meta.dirname, "movement/index.html"),
        pole: resolve(import.meta.dirname, "movement/pole/index.html"),
      },
    },
  },
});
