# Dev Page

This is my Personal Site.

Live URL: https://dev-page-40f42aj2e-ryan-bahadoris-projects.vercel.app

## Hosting on Vercel

Vercel serves this site as **static files** (recommended). The included `vercel.json` applies **security headers**, **redirects**, and **cache headers** at the edge.

Note: the optional Fastify server in `backend/` is for non-Vercel hosting (a traditional server/container). Vercel won’t run it as a long-lived process.

## Optional backend (protection + smoother delivery)

This repo can be served as-is (static hosting), or you can run the included Fastify server which adds:

- **Security headers** (CSP, clickjacking protection, etc.)
- **Compression** (Brotli / gzip)
- **Rate limiting** (basic abuse protection)
- **Cache headers** (better repeat load performance)

### Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

### Environment variables

- **PORT**: default `3000`
- **HOST**: default `0.0.0.0`
- **TRUST_PROXY**: default `true` (set to `false` if running directly on the internet without a proxy/CDN)
- **RATE_LIMIT_MAX**: default `300`
- **RATE_LIMIT_WINDOW**: default `1 minute`

### Docker (deploy anywhere)

```bash
docker build -t dev-page .
docker run --rm -p 3000:3000 dev-page
```
