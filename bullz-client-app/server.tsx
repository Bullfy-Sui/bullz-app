import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

import { readFile } from "node:fs/promises";

const isProd = process.env.NODE_ENV === "production";
const app = new Hono();

// --- Serve static assets ---
// In development, assets are served by Vite's dev server, so you typically don't need static middleware.
// In production, serve from the build output.
if (isProd) {
  app.use("/assets/*", serveStatic({ root: "./build" }));
  app.use("/images/*", serveStatic({ root: "./build" }));
  // Add more static folders if needed
} else {
  // Optionally, you could proxy to Vite dev server for assets if needed
  // But usually, Vite handles static files in dev automatically
}

// --- API routes ---
app.get("/api", (c) => c.json({ message: "Hello from bullz" }));

// --- Catch-all for client-side routes (React Router) ---
app.use("*", async (c, next) => {
  if (c.req.path.startsWith("/api")) return next();

  let html: string;

  if (isProd) {
    // Serve the built HTML in production
    html = await readFile("./build/index.html", "utf8");
  } else {
    // In dev, serve the source HTML and inject Vite client for HMR
    html = await readFile("./index.html", "utf8");
    // Optionally, inject Vite HMR client if not already present
    if (!html.includes("@vite/client")) {
      html = html.replace(
        "<head>",
        `<head>\n    <script type="module" src="/@vite/client"></script>`,
      );
    }
  }

  return c.html(html);
});

export default app;

// --- Start the server if running directly ---
if (isProd) {
  import("@hono/node-server").then(({ serve }) => {
    serve({ fetch: app.fetch, port: 3000 }, (info) => {
      console.log(`Listening on http://localhost:${info.port}`);
    });
  });
}
