# ElakHujan

A mobile-first PWA that helps Malaysian scooter commuters pick the best office days and departure times based on rain forecasts.

## Features

- **Weekly View** — next 5 actionable working days ranked using the highest risk across five points on the commute route
- **Leave Advisor** — lowest-risk future departure time, considering rain probability, amount, thunderstorms and gusts along the route
- **MET Malaysia Context** — nearest-town official daily forecast plus route-area land warnings; unrelated and “No Advisory” records are excluded
- **PWA** — installable on any mobile home screen

## Setup

```bash
npm install
```

Copy `.env.example` to `.env.local` and fill in your MET Malaysia API token:

```bash
cp .env.example .env.local
```

## Local Development

```bash
npm run dev
```

The Vite dev server proxies `/api/met/*` to `api.met.gov.my/v2.1` using the `MET_TOKEN` from `.env.local`. No browser CORS issues.

## Production Build

```bash
npm run build
```

## Deploying to Netlify

1. Push to GitHub
2. Import the project at [app.netlify.com](https://app.netlify.com)
3. Add the environment variable `MET_TOKEN` (your api.met.gov.my token) in the Netlify site settings
4. Deploy

The `netlify/edge-functions/met-proxy.ts` Edge Function proxies all MET Malaysia API calls server-side, keeping the token out of the browser. See `docs/DEPLOYMENT.md` for the full step-by-step guide.

## Data Sources

| Source | Purpose | Cache |
|--------|---------|-------|
| [Open-Meteo](https://open-meteo.com) | Route-sampled hourly rain, weather code and gust forecasts | 10 min |
| [api.met.gov.my](https://api.met.gov.my) | Official daily forecast per state (Pagi/Petang/Malam) | 5 min |
| [api.data.gov.my](https://api.data.gov.my) | MET Malaysia weather warnings | 30 min |
| [Nominatim](https://nominatim.openstreetmap.org) | Explicit location search (no autocomplete; rate-limited) | — |

Forecast responses are intentionally not stored for offline use: expired weather must never be presented as a fresh recommendation.

## Tech Stack

- React 19 + TypeScript, Vite 7
- Tailwind CSS v4, shadcn/ui (new-york)
- Zustand (state), TanStack Query v5 (caching)
- React Router v7
- Netlify (SPA hosting + Deno Edge Function proxy for MET Malaysia API)
