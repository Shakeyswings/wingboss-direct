# Frontend Deployment Guide

## Option A — Cloudflare Pages

1. Push Phase 4 frontend project to GitHub.
2. Open Cloudflare Pages.
3. Create new Pages project.
4. Connect GitHub repo.
5. Build settings:

```text
Framework preset: Vite
Build command: npm run build
Output directory: dist
Root directory: apps/miniapp
```

6. Deploy.
7. Copy final HTTPS URL.
8. Use this URL as `MINI_APP_URL`.

## Option B — GitHub Pages

From frontend folder:

```bash
npm install
npm run build
```

Then deploy `dist/` using your preferred GitHub Pages method.

If app loads blank, check `vite.config.ts` `base` path.

## Option C — Netlify

Build settings:

```text
Base directory: apps/miniapp
Build command: npm run build
Publish directory: apps/miniapp/dist
```

## Option D — Vercel

Project root can be `apps/miniapp`.

Build command:

```bash
npm run build
```

Output:

```text
dist
```

## Frontend post-deploy checklist

- URL uses HTTPS.
- App opens on mobile.
- App opens inside Telegram.
- Data files load.
- Staff Academy page opens.
- Order builder reaches review screen.
- Outside-Telegram fallback shows copyable payload.
