# Implementation Plan – ElakHujan
**Version:** 0.1 (Draft)
**Last Updated:** February 2026

---

## Overview

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Project setup, onboarding wizard, localStorage config | ✅ Complete |
| 2 | Weather integration + weekly planning view | ✅ Complete |
| 3 | Day detail view + leave time advisor | ✅ Complete |
| 4 | MET Malaysia warning banner | ✅ Complete |
| 5 | Polish, testing, PWA manifest & deployment | ✅ Complete (service worker + icon sizes deferred) |
| 6 | Komuniti — community rain/hazard reporting feed | ⏳ Next |
| — | Telegram bot + notifications | 🔄 Deferred (post-v1) |

---

## Phase 1 — Project Setup, Onboarding & Config

### Goals
- Runnable project scaffold
- User can complete onboarding and have their config saved to localStorage
- App correctly gates access until onboarding is complete

### Tasks

**1.1 Project scaffold**
- Initialise Vite + React + TypeScript project
- Install and configure Tailwind CSS v4
- Install and configure shadcn/ui
- Install dependencies: `react-router-dom`, `zustand`, `@tanstack/react-query`
- Set up folder structure as per architecture doc
- Create `.env.example`

**1.2 Config foundation**
- Define `UserConfig` TypeScript interface (`src/types/config.ts`)
- Build typed localStorage helpers (`src/lib/localStorage.ts`)
  - `getConfig()` — returns `UserConfig | null`
  - `setConfig(config: UserConfig)` — saves to localStorage
  - `updateConfig(partial: Partial<UserConfig>)` — merges partial update
- Build `useConfig` hook (`src/hooks/useConfig.ts`)

**1.3 Routing & auth guard**
- Set up React Router with all routes
- Build `OnboardingGuard` — redirects to `/onboarding` if `onboardingComplete === false`
- Build `BottomNav` component (hidden during onboarding)

**1.4 Onboarding wizard**
- Wizard controller with step state management (`src/pages/Onboarding/index.tsx`)
- Step 1 — `StepLocation.tsx`
  - Two search fields: Rumah & Pejabat
  - Nominatim geocoding service (`src/services/nominatim.ts`)
  - Debounced search with dropdown results
  - State dropdown (16 Malaysian states + 3 Federal Territories) per location — used for MET warning filtering
  - Save `homeLocation` + `officeLocation` (including `state`) to config
- Step 2 — `StepCommute.tsx`
  - Time pickers for morning and evening commute windows
  - Defaults: 08:00–09:00 and 17:00–18:00
  - Save `morningWindow` + `eveningWindow` to config
- Step 3 — `StepDays.tsx`
  - Number selector for `officeDaysPerWeek` (default: 3)
  - Day toggles for `preferredDays` (Mon–Fri)
- Step 4 — `StepTelegram.tsx`
  - Optional step — can be skipped
  - Instructions: how to find your Telegram Chat ID
  - Input for `chatId`
  - Toggle for morning/evening notifications
  - `morningNotificationTime` time picker (default: 07:30) — shown when morning notification is enabled
  - Disclaimer: *"Notifikasi hanya dihantar apabila aplikasi dibuka"* (notifications only fire when app is open)
- Completion — set `onboardingComplete: true`, redirect to `/`

**1.5 Settings page**
- Mirror all onboarding fields in an editable form (`src/pages/Settings.tsx`)
- Add `rainThreshold` slider (10%–80%, default 40%)
- Add `morningNotificationTime` picker
- "Reset semua data" button (clears localStorage, redirects to onboarding)

### Deliverable
A working onboarding flow that saves config and unlocks the main app.

---

## Phase 2 — Weather Integration & Weekly View

### Goals
- Fetch and display real hourly weather data from Open-Meteo
- Weekly view shows all 5 weekdays with morning + evening rain risk
- Algorithm recommends the best N days and highlights them

### Tasks

**2.1 Open-Meteo service**
- Build `openMeteo.ts` service (`src/services/openMeteo.ts`)
  - `fetchHourlyForecast(lat, lon)` — returns 7-day hourly precipitation probability array
- Build `useWeather` hook (`src/hooks/useWeather.ts`)
  - Calls `fetchHourlyForecast` for both home and office locations in parallel
  - TanStack Query with 60-minute stale time
  - Returns `{ homeWeather, officeWeather, isLoading, isError }`

**2.2 Rain scoring algorithm**
- Build `rainScoring.ts` (`src/lib/rainScoring.ts`)
  - `getRollingWeekdays(today: Date): Date[]` — returns next 5 weekdays from today (inclusive)
  - `extractWindowAverage(hourlyData, date, startTime, endTime)` — returns average probability for a given time window
  - `scoreDays(homeWeather, officeWeather, config)` — returns array of scored weekdays for the rolling window
  - `getRecommendedDays(scoredDays, count, preferredDays)` — fills top-N from preferred days first; falls back to non-preferred only if preferred count < N

**2.3 Weekly view**
- Build `Weekly.tsx` page (`src/pages/Weekly.tsx`)
  - Fetch weather via `useWeather`
  - Run scoring via `useDayRecommendation` hook
  - Render the next 5 weekdays from today (rolling window, not fixed Mon–Fri)
  - Show loading skeleton while fetching
  - Show error state if fetch fails
- Build `DayCard.tsx` component
  - Shows: day name, date, morning rain %, evening rain %, `RiskBadge`
  - "Disyorkan" highlight badge for recommended days (preferred days first; non-preferred only if gap to fill)
  - "Hari Pejabat" indicator for confirmed office days
  - **Single tap** on the card body → toggle `confirmedOfficeDays` in config
  - **Chevron button** (right edge) → navigate to `/day/:date`
- Build `RiskBadge.tsx` component
  - Rendah (< 40%) — green
  - Sederhana (40–70%) — amber
  - Tinggi (> 70%) — red
- Build `RainBar.tsx` component
  - Horizontal bar showing rain probability with colour gradient

**2.4 Day confirmation**
- Single tap on `DayCard` body → toggle `confirmedOfficeDays[date]` in config
- Confirmed days get a distinct visual indicator (e.g. filled background, checkmark)
- Prune `confirmedOfficeDays` entries older than 30 days on app load (in `useConfig` init)

### Deliverable
A working weekly view with real weather data, scoring, and recommended days highlighted.

---

## Phase 3 — Day Detail View & Leave Time Advisor

### Goals
- Tapping a day card shows full hourly breakdown
- Leave advisor shows best time to leave and auto-surfaces contextually

### Tasks

**3.1 Day detail view**
- Build `DayDetail.tsx` page (`src/pages/DayDetail.tsx`)
  - Accepts `date` param from route
  - Shows full 24-hour `RainBar` chart for the selected day
  - Highlights morning and evening commute windows as coloured bands
  - Shows morning + evening risk summary at the top

**3.2 Leave advisor logic**
- Build `leaveAdvisor.ts` (`src/lib/leaveAdvisor.ts`)
  - `getRecommendedLeaveTime(officeWeather, date, eveningWindow, rainThreshold)`
  - Scans hourly slots from `eveningWindow.start - 1hr` to `eveningWindow.end + 2hr`
  - Returns: `{ recommendedTime, probability, hasCleanWindow }`

**3.3 Leave advisor page**
- Build `LeaveAdvisor.tsx` page (`src/pages/LeaveAdvisor.tsx`)
  - Shows rolling 3-hour forecast from current time
  - Highlights recommended leave slot
  - Shows "Tiada tetingkap kering" warning if no dry slot found
  - Manual refresh button

**3.4 Auto-surface on Weekly view**
- Build `LeavePanel.tsx` component
  - Compact version of the leave recommendation
  - Shows as a sticky banner at the top of `Weekly.tsx`
- Build `useLeaveAdvisorVisible` hook
  - Returns `true` if current time is within 2 hours before `eveningWindow.start`
  - Checked every minute via `setInterval`
- Conditionally render `LeavePanel` on `Weekly.tsx`

### Deliverable
Full day detail view and a working leave time advisor with contextual auto-surface.

---

## Phase 4 — MET Malaysia Warning Banner

### Goals
- Active MET Malaysia weather warnings are surfaced as a dismissible banner

### Tasks

**4.1 data.gov.my service**
- Build `dataGovMy.ts` service (`src/services/dataGovMy.ts`)
  - `fetchActiveWarnings()` — fetches latest warnings, returns English text
- Build `useWarnings` hook (`src/hooks/useWarnings.ts`)
  - TanStack Query with 30-minute stale time
  - Returns `{ warnings, isLoading }`

**4.2 Warning banner**
- Build `WarningAlert.tsx` component
  - Dismissible banner (dismissed state stored in sessionStorage — reappears next session)
  - Shows warning title + text in English (data.gov.my provides `title_en`, `text_en`)
  - Only renders if active warnings exist
- Mount `WarningAlert` at the top of `Weekly.tsx` and `LeaveAdvisor.tsx`

### Deliverable
Active MET Malaysia warnings appear prominently and can be dismissed.

---

## Phase 5 — Polish, Testing & Deployment ✅

### Goals
- App is production-ready, deployed, and shareable via URL

### Tasks

**5.1 UI polish**
- Consistent spacing, typography, and colour usage across all pages
- Empty states (no confirmed office days, no weather data yet)
- All copy reviewed and finalised in BM (`src/constants/copy.ts`)
- App icon and title in `index.html`

**5.2 Error handling**
- Graceful error states for failed API calls
- Fallback to cached data where available
- Friendly BM error messages

**5.3 Performance**
- Verify TanStack Query caching is working correctly
- Ensure no redundant API calls on re-renders
- Lighthouse mobile score check

**5.4 PWA manifest**
- `manifest.json` with correct icons, theme colour, `display: standalone`
- Service worker / Vite PWA plugin for offline shell

**5.5 Testing**
- Manual end-to-end walkthrough: fresh install → onboarding → weekly view → day detail → leave advisor
- Test on real mobile device (not just browser DevTools)

**5.6 Deployment**
- Push to GitHub repository
- Deploy on Netlify (already configured via `netlify.toml`)
- Share URL with at least one friend for real-world test

### Deliverable
Production-deployed at elak-hujan.aidilsfwn.dev ✅

> **Deferred (post-Phase 6):** Service worker / offline shell (vite-plugin-pwa), separate icon files per size.

---

## Phase 6 — Komuniti (Community Rain & Hazard Feed)

### Goals
- Users can anonymously report rain or road hazards at their current location
- Reports are visible on a map and as a filterable feed
- Community can confirm others' reports
- Zero additional infrastructure cost (Supabase free tier)

### Background decisions
- **Anonymous** — no registration required; rate-limited by device fingerprint hash
- **Backend** — Supabase free tier (PostgreSQL + PostGIS for geospatial queries + RPC for rate limiting)
- **Map** — Leaflet.js + OpenStreetMap, CartoDB Positron tiles (all free, no API keys)
- **Report categories** — Hujan (rain, pick intensity) or Bahaya (hazard, pick type)
- **Confirms** — "Saya pun!" button bumps a `confirms` count via server-side RPC (atomic)
- **Expiry** — Hujan auto-expires after 2 hours; Bahaya after 6 hours

### Report data model

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `geom` | GEOGRAPHY(Point) | PostGIS point for radius queries |
| `lat` / `lng` | DOUBLE PRECISION | Stored alongside geom for easy access |
| `state` | TEXT | Malaysian state (matches MALAYSIAN_STATES) |
| `category` | TEXT | `'hujan'` or `'bahaya'` |
| `sub_type` | TEXT | `'renyai'`/`'sederhana'`/`'lebat'` or `'banjir_kilat'`/`'jalan_banjir'`/`'pokok_tumbang'`/`'lain'` |
| `reported_at` | TIMESTAMPTZ | Auto-set on insert |
| `expires_at` | TIMESTAMPTZ | `+2h` for hujan, `+6h` for bahaya |
| `device_hash` | TEXT | SHA-256 of browser fingerprint — for rate limiting only, never exposed to client |
| `confirms` | INTEGER | Community confirmations count |

### Tasks

**6.0 Supabase setup (one-time, manual)**
- Create free project at supabase.com
- Enable PostGIS and pg_cron extensions
- Run schema SQL (table + indexes + RLS + pg_cron cleanup job + 2 RPC functions + public view)
- Add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` to `.env`

Schema highlights:
- RLS: anyone can SELECT non-expired rows; INSERT only via `create_community_report` RPC (enforces rate limit server-side)
- `create_community_report` RPC: checks device_hash — max 1 report per device per 30min within 5km radius; returns new `id`
- `confirm_community_report` RPC: atomic `UPDATE confirms = confirms + 1`
- `community_reports_public` view: excludes `device_hash` column — always query this, never the raw table
- pg_cron job: `DELETE FROM community_reports WHERE expires_at < NOW()` every 15 minutes

**6.1 npm packages**
```bash
npm install @supabase/supabase-js leaflet @types/leaflet
npx shadcn add sheet
```

**6.2 New types** — `src/types/community.ts`
- `ReportCategory`, `HujanSubType`, `BahayaSubType`, `ReportSubType`
- `CommunityReport` interface (matches public view columns)
- `ReportFilters` interface (`jenis`, `masa`, `lokasi`)

**6.3 Supabase client** — `src/services/supabase.ts`
- `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`

**6.4 Community reports service** — `src/services/communityReports.ts`
- `fetchReports(filters, userLat?, userLng?)` — queries `community_reports_public` view; filters by state OR `ST_DWithin` 25km for "berhampiran" mode
- `submitReport(data)` — calls `create_community_report` RPC; handles `rate_limited` exception
- `confirmReport(reportId)` — calls `confirm_community_report` RPC

**6.5 Device hash hook** — `src/hooks/useDeviceHash.ts`
- Hash `userAgent + screenWidth + screenHeight + timezone` via `crypto.subtle.digest('SHA-256')`
- Persist in localStorage as `elakhujan_device_id` for stability across sessions
- Returns stable hex string

**6.6 TanStack Query hooks**
- `src/hooks/useReports.ts` — `staleTime: 2min`, `refetchInterval: 2min`, `refetchIntervalInBackground: false`
- `src/hooks/useSubmitReport.ts` — mutation → `invalidateQueries(['community_reports'])` on success
- `src/hooks/useConfirmReport.ts` — mutation → `invalidateQueries(['community_reports'])` on success

**6.7 BM copy** — add `community` section to `src/constants/copy.ts`
- Tab label, sub-nav labels, all filter labels, category/sub-type labels, sheet copy, toast messages

**6.8 Leaflet CSS** — add to `src/index.css`
- `@import "leaflet/dist/leaflet.css";` at top, before `@import "tailwindcss"`

**6.9 Community page components** — all in `src/pages/Community/`

| File | Responsibility |
|------|---------------|
| `FilterBar.tsx` | Jenis / Masa / Lokasi filter chips |
| `FeedCard.tsx` | Report row: icon, sub_type label, state, time ago, confirms, "Saya pun!" button |
| `CommunityFeed.tsx` | FilterBar + scrollable FeedCard list |
| `CommunityMap.tsx` | Leaflet map, CartoDB Positron tiles, `L.divIcon()` markers coloured by category/intensity |
| `ReportSheet.tsx` | shadcn Sheet (side="bottom"), 3-step: category → sub_type → location confirm → submit |
| `index.tsx` | Sub-nav Peta/Suapan, user geolocation state, floating "Laporkan" FAB, wires ReportSheet |

**6.10 Routing + nav updates**
- `src/components/BottomNav.tsx` — add `{ to: '/komuniti', Icon: Users, label: copy.community.tabLabel }` to `NAV_ITEMS`
- `src/App.tsx` — add `<Route path="/komuniti" element={<Community />} />`

### Implementation order
```
6.0 Supabase setup (manual)
  ↓
6.1 npm install
  ↓
6.2 types/community.ts
  ↓
6.3 services/supabase.ts
  ↓
6.4 services/communityReports.ts
  ↓
6.5 hooks/useDeviceHash.ts
6.6 hooks/useReports.ts + useSubmitReport.ts + useConfirmReport.ts
  ↓
6.7 copy.ts additions
6.8 index.css Leaflet import
  ↓
6.9 Community page components (FilterBar → FeedCard → CommunityFeed → CommunityMap → ReportSheet → index)
  ↓
6.10 BottomNav + App.tsx routing
```

### Gotchas

1. **Leaflet icon paths break with Vite** — use `L.divIcon()` with styled inline HTML for all markers; never use default Leaflet PNG markers
2. **Map container needs explicit height** — `h-full` won't work; use `style={{ height: 'calc(100dvh - 8rem)' }}` or equivalent
3. **shadcn Sheet uses `@radix-ui/react-dialog`** — already bundled in the `radix-ui` umbrella package; `npx shadcn add sheet` should work without extra installs
4. **State on submission** — reverse-geocode the user's current coords via Nominatim to get Malaysian state; fallback to `config.homeLocation.state`
5. **`refetchIntervalInBackground: false`** — prevents battery drain when tab is hidden
6. **pg_cron availability** — the `expires_at > NOW()` filter in the view guarantees freshness regardless of whether the cron job runs; cron is best-effort cleanup only

### Deliverable
A working Komuniti tab with map + feed views, anonymous report submission, and community confirms — all on Supabase free tier.

---

## [Deferred] Telegram Bot & Notifications

> Moved out of v1 scope. Implement post-launch if there is user demand.

### Goals
- User receives a morning Telegram message on office days
- User receives an evening nudge with leave recommendation on office days

### Tasks

**5.1 Create the bot**
- Message `@BotFather` on Telegram → `/newbot`
- Save the bot token as `TELEGRAM_BOT_TOKEN` in Vercel environment variables
- Build a `/start` command response that replies with the user's Chat ID

**5.2 Vercel Edge Function**
- Build `api/telegram.ts`
  - Accepts `POST { chatId: string, message: string }`
  - Validates input
  - Calls `https://api.telegram.org/bot{TOKEN}/sendMessage`
  - Returns success/error response
- Build `telegram.ts` service (`src/services/telegram.ts`)
  - `sendNotification(chatId, message)` — calls `/api/telegram`

**5.3 Notification messages (BM)**
- Morning message format:
  ```
  🌤️ Selamat pagi! Ramalan perjalanan hari ini:

  🏠 → 🏢 Pagi (08:00–09:00): 25% hujan — Selamat memandu!
  🏢 → 🏠 Petang (17:00–18:00): 65% hujan — Bawa baju hujan!

  Masa terbaik balik: 17:30
  ```
- Evening nudge format:
  ```
  🌧️ Peringatan petang!

  Masa terbaik untuk balik sekarang: 17:30
  Kebarangkalian hujan: 20%
  ```

**5.4 Notification scheduling**
- Since the app is fully static (no server-side cron), notifications are triggered client-side
  - On app open each morning, check if today is a confirmed office day → send morning notification if within 15 minutes of `morningNotificationTime`
  - On the Weekly view, when `LeavePanel` auto-surfaces → trigger evening nudge once (debounced, max once per day via localStorage flag)
- Note: this means the app must be opened for notifications to fire. True background push can be added in a future version via a server-side cron.

### Deliverable
Telegram notifications working end-to-end for morning and evening.

---

## Phase 6 — Polish, Testing & Deployment

### Goals
- App is production-ready, deployed, and shareable via URL

### Tasks

**6.1 UI polish**
- Consistent spacing, typography, and colour usage across all pages
- Empty states (no confirmed office days, no weather data yet)
- All copy reviewed and finalised in BM (`src/constants/copy.ts`)
- App icon and title in `index.html`

**6.2 Error handling**
- Graceful error states for failed API calls
- Fallback to cached data where available
- Friendly BM error messages

**6.3 Performance**
- Verify TanStack Query caching is working correctly
- Ensure no redundant API calls on re-renders
- Lighthouse mobile score check

**6.4 Testing**
- Manual end-to-end walkthrough:
  - Fresh install → onboarding → weekly view → day detail → leave advisor
  - Telegram notification send
  - Settings update → verify config updates correctly
- Test on real mobile device (not just browser DevTools)

**6.5 Deployment**
- Push to GitHub repository
- Connect to Vercel
- Set `TELEGRAM_BOT_TOKEN` in Vercel environment variables
- Verify Edge Function works in production
- Share URL with at least one friend for real-world config test

---

## Implementation Order Summary

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
  │           │          │          │          │          │
Config    Weather     Leave      Warnings  Polish    Komuniti
 Setup    + Weekly   Advisor     Banner    + Deploy  Community
```

Each phase produces a working, testable increment. The app is fully functional after Phase 4 — Phase 5 polishes and deploys it, Phase 6 adds the community layer.

Telegram notifications are deferred post-v1.
