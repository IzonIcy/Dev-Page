import Fastify from "fastify";
import compress from "@fastify/compress";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);
const HOST = process.env.HOST ?? "0.0.0.0";
const STATIC_ROOT = path.resolve(__dirname, "..");
const TRUST_PROXY = (process.env.TRUST_PROXY ?? "true") === "true";

const app = Fastify({
  logger: true,
  trustProxy: TRUST_PROXY
});

await app.register(compress, {
  global: true,
  encodings: ["br", "gzip", "deflate"]
});

await app.register(helmet, {
  global: true,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "base-uri": ["'self'"],
      "form-action": ["'none'"],
      "frame-ancestors": ["'none'"],
      "img-src": ["'self'", "data:"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
      "style-src": ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "connect-src": ["'self'"]
    }
  },
  referrerPolicy: { policy: "no-referrer" },
  crossOriginEmbedderPolicy: false
});

await app.register(rateLimit, {
  global: true,
  max: Number.parseInt(process.env.RATE_LIMIT_MAX ?? "300", 10),
  timeWindow: process.env.RATE_LIMIT_WINDOW ?? "1 minute",
  hook: "onRequest",
  addHeaders: {
    "x-ratelimit-limit": true,
    "x-ratelimit-remaining": true,
    "x-ratelimit-reset": true
  }
});

app.addHook("onRequest", async (req, reply) => {
  const ua = req.headers["user-agent"];
  if (!ua) {
    reply.code(400);
    throw new Error("Missing user-agent");
  }

  if (ua.length > 1024) {
    reply.code(400);
    throw new Error("User-agent too long");
  }
});

await app.register(fastifyStatic, {
  root: STATIC_ROOT,
  prefix: "/",
  index: false,
  cacheControl: false,
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === ".html") {
      res.setHeader("cache-control", "no-cache");
      return;
    }

    if (ext === ".css" || ext === ".js") {
      res.setHeader("cache-control", "public, max-age=3600");
      return;
    }

    if (ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp" || ext === ".gif" || ext === ".svg") {
      res.setHeader("cache-control", "public, max-age=31536000, immutable");
      return;
    }

    res.setHeader("cache-control", "public, max-age=300");
  }
});

app.get("/", async (_req, reply) => reply.sendFile("index.html"));
app.get("/archive", async (_req, reply) => reply.redirect(302, "/archive.html"));
app.get("/lab", async (_req, reply) => reply.redirect(302, "/lab_list.html"));

app.get("/healthz", async () => ({ ok: true }));

app.setNotFoundHandler(async (req, reply) => {
  if (req.raw.method !== "GET" && req.raw.method !== "HEAD") {
    return reply.code(404).send({ error: "Not found" });
  }

  const accept = req.headers.accept ?? "";
  if (typeof accept === "string" && accept.includes("text/html")) {
    return reply.code(404).sendFile("index.html");
  }

  return reply.code(404).send({ error: "Not found" });
});

app.setErrorHandler(async (err, _req, reply) => {
  if (reply.statusCode >= 500) {
    app.log.error({ err }, "request failed");
  }
  const status = reply.statusCode && reply.statusCode >= 400 ? reply.statusCode : 500;
  return reply.code(status).send({ error: status >= 500 ? "Internal error" : err.message });
});

await app.listen({ port: PORT, host: HOST });
