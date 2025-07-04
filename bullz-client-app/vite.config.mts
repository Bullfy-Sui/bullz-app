import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import { reactRouter } from "@react-router/dev/vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import devServer from "@hono/vite-dev-server";

// https://vitejs.dev/config/
export default defineConfig({
  // plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    // proxy: {
    //   "/api": {
    //     target: "https://bullfy-api.onrender.com",
    //     changeOrigin: true,
    //     secure: true,
    //   },
    // },
  },
  build: {
    outDir: "build",
  },
  plugins: [
    // react(),
    tailwindcss(),
    devServer({
      entry: "server.tsx",
      exclude: [
        /.*\.tsx?($|\?)/,
        /.*\.(s?css|less)($|\?)/,
        /.*\.(svg|png)($|\?)/,
        /^\/@.+$/,
        /^\/favicon\.ico$/,
        /^\/(public|assets|static)\/.+/,
        /^\/node_modules\/.*/,
      ],
      injectClientScript: true,
      // handleHotUpdate: ({ server, modules }) => {
      //   const isSSR = modules.some((mod) => mod._ssrModule);
      //   if (isSSR) {
      //     server.hot.send({ type: "full-reload" });
      //     return [];
      //   }
      // },
    }),
  ],
  ssr: {
    external: ["react", "react-dom"],
  },
});
