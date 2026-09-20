import { defineConfig } from "vite";
import { resolve } from "node:path";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import poseCatalog from "./movement/pose-catalog.json" with {type:"json"};
import {poseSlug} from "./movement/pose-routes.js";
import {bridgeRouteEntries} from "./movement/bridge-variations.js";

function movementRedirect(server) {
  server.middlewares.use((req, res, next) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/movement/poses/")) {
      req.url=`/movement/${url.search}`;
      return next();
    }
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
    async closeBundle() {
      const movementHtml=await readFile(resolve(import.meta.dirname,"dist/movement/index.html"),"utf8");
      const routeEntries=[...poseCatalog.filter(pose=>pose.key!=="Bridge"),...bridgeRouteEntries];
      await Promise.all(routeEntries.map(async pose=>{
        const directory=resolve(import.meta.dirname,"dist/movement/poses",poseSlug({name:pose.name,source:pose.source||`/${pose.key}`}));
        await mkdir(directory,{recursive:true});
        await writeFile(resolve(directory,"index.html"),movementHtml);
      }));
    },
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
