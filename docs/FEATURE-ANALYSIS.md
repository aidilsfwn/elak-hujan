# ElakHujan × Ridercast — Feature Analysis & Enhancement Brief

> Generated: 2026-03-03
> Scope: Full codebase audit (Phases 1–6) vs Ridercast reference app
> Purpose: Surface gaps, brainstorm improvements, prioritise next work

---

## 1. Ridercast — Feature Inventory

Ridercast is a community-driven, live weather radar for Malaysian riders (GrabFood, Foodpanda, motorcycle commuters). It focuses on **right-now** ride conditions.

| Area | Features |
|------|----------|
| **Current weather** | Temperature (°C), feels-like temp, cloud cover %, humidity %, visibility (km), weather condition label (CLOUDY / SUNNY / RAINY / STORMY) |
| **Rideability** | 0–100 numeric Rideability Index; quality label (EXCELLENT, GOOD, …) |
| **Gear advice** | Contextual gear-check tips generated from current conditions (e.g. "wear rain jacket", "check tyre pressure") |
| **6-hour forecast** | Short-horizon forecast for upcoming ride planning |
| **Community map** | Interactive Leaflet map; 5 km radius circle; live location pin with pulsing animation |
| **Map markers** | ☀️ Dry/Clear (green) · ☁️ Cloudy (grey) · 🌧️ Rain (blue) · ⛈️ Storm (red) · 🌬️ High Wind (orange) · 🟡 Wet/Slippery (yellow) |
| **Report feed** | Scrollable list: emoji, reporter name, distance, time-ago |
| **Report action** | FAB "+ Report" button |
| **Social proof** | "Active riders" count displayed |
| **Live status** | Pulsing green dot + WiFi icon + last-updated timestamp |
| **Map UX** | Expand/collapse toggle; locate-me button; zoom controls; legend panel |
| **Location** | Prominent area name display; change-location flow |
| **Data source** | Open-Meteo (weather); community rider reports (ground truth) |
| **Theme** | Dark (slate-950 background), mobile-first, smooth animations |

---

## 2. ElakHujan — Feature Inventory

ElakHujan is a **personalised commute planner** for office-day scooter commuters in Malaysia. It focuses on **planning ahead** — which days to go to the office and when to leave.

### Pages

| Page | Key Features |
|------|-------------|
| **Onboarding** | 3-step wizard: home + office location (Nominatim); commute time windows (morning/evening); office days per week + preferred days |
| **Weekly View** | Rolling 5 weekdays from today; DayCard per day (morning score, evening score, risk badge, recommended badge); WarningAlert (MET Malaysia official warnings, dismissable per session) |
| **Day Detail** | 24-hour bar chart; morning + evening windows highlighted; risk badge per window; back navigation |
| **Leave Advisor** | Real-time best-leave-time recommendation; scan window slots + rolling slots; risk-coloured card; "no dry window" alert; visible 2 h before → 1 h after evening window |
| **Community (Komuniti)** | Leaflet map (emoji markers, pulsing pins for recent reports, 10 km radius circle); feed list; 3-axis filter bar (type / time / location); 3-step report sheet (FAB); confirmation/voting system; anonymous device hash; rate limiting |
| **Settings** | Full config re-edit; rain threshold slider (10–80 %); data sources & accuracy disclaimer; danger-zone reset |

### Hooks & Services

| Category | Details |
|----------|---------|
| **Weather** | Open-Meteo 7-day hourly (60 min cache); home + office dual query |
| **Warnings** | data.gov.my active warnings (30 min cache); state-filtered |
| **Nowcast** | MET Malaysia daily forecast via Netlify Edge Function proxy (morning/afternoon/night) |
| **Community** | Supabase (public view); reports with auto-expiry (2 h light / 6 h hazard); confirm/vote mutations; 2-min polling |
| **Geocoding** | Nominatim search + reverse geocoding for state detection |

### Algorithms

| Algorithm | Summary |
|-----------|---------|
| **Day scoring** | Average morning + evening hourly precipitation probability over commute windows |
| **Recommended days** | Top-N by combined score; preferred days fill first, non-preferred fill gaps |
| **Leave advisor** | Scan ±1–2 h around evening window; first slot < threshold = clean window; else least-bad |
| **Risk classification** | Low < threshold · Medium < 70 % · High ≥ 70 % |
| **Report expiry** | Light: 2 h; hazard: 6 h; rate-limit enforced per device hash |

---

## 3. Side-by-Side Gap Analysis

### 3a. What Ridercast has that ElakHujan lacks

| Gap | Ridercast Feature | Impact on ElakHujan if Added |
|-----|-------------------|------------------------------|
| **Current conditions** | Temperature, feels-like, humidity, cloud cover, visibility right now | Users can assess if it's safe to leave *immediately* — most common single question |
| **Rideability Index** | 0–100 numeric score + label (EXCELLENT / GOOD / …) | More nuanced than binary Low/Medium/High; easier for at-a-glance decisions |
| **Gear check tips** | Contextual "bring umbrella", "wear rain jacket" prompts | Directly actionable; reduces cognitive load for user |
| **Short-horizon forecast** | 6-hour window (distinct from 7-day daily) | Complements Leave Advisor with "what happens in the next few hours" |
| **Live status indicator** | Pulsing green dot + last-updated timestamp | Builds trust; users know data is fresh |
| **Community activity count** | "X active riders nearby" count | Social proof; signals network health |
| **Wet/Slippery report type** | Yellow category for road surface hazard | Relevant for Malaysian roads post-rain |
| **High Wind report type** | Orange category | Real hazard for scooter riders; missing from ElakHujan's sub-types |
| **Dark theme** | Slate-950 background | Better outdoor readability in bright Malaysian sun; battery-friendly on OLED screens |

### 3b. What ElakHujan does better than Ridercast

| Strength | ElakHujan Feature | Why It Matters |
|----------|-------------------|----------------|
| **Personalisation** | Commute windows, preferred days, rain threshold slider | Tailored to each commuter's real schedule |
| **Planning ahead** | Weekly 5-day recommendation system | Ridercast is live-only; ElakHujan helps schedule the week |
| **Official data credibility** | MET Malaysia forecast + data.gov.my warnings | Government-sourced data builds trust for Malaysian users |
| **Algorithm transparency** | Shows all 5 days ranked, all slots in Leave Advisor | Users understand why a day/time is recommended |
| **Community quality** | Persistent storage (Supabase), voting, multi-step form, rate limiting | More robust than ephemeral anonymous reports |
| **Language** | Full BM (Bahasa Melayu) UI | Localisation for primary target audience |
| **Onboarding** | Guided setup with location search | Zero-friction first-use experience |
| **Leave Advisor auto-surface** | LeavePanel appears on Weekly during relevant time window | Proactive UX — surfaces the right view at the right time |

---

## 4. Enhancement Recommendations

Prioritised by impact vs implementation effort.

---

### TIER 1 — High Impact, Low Effort (Quick Wins)

#### 4.1 Data Freshness Indicator
**Problem:** Users have no visual signal that weather data is live or stale.
**Solution:** Add a small "Dikemaskini X minit lepas" (Updated X min ago) label + pulsing green dot to the Weekly View header and Leave Advisor card. Change to grey when data is > 30 min old.
**Implementation:** Use `dataUpdatedAt` from TanStack Query; format with `formatDistanceToNow`.
**Files:** `WeeklyView`, `LeaveAdvisor`

---

#### 4.2 "Best Slot" Visual Highlight in Day Detail Chart
**Problem:** The 24-hour chart shows all hours uniformly — users must mentally locate the recommended leave time.
**Solution:** In the Leave Advisor sub-section of the DayDetail chart, overlay a subtle green "terbaik" badge or background stripe on the recommended slot column.
**Implementation:** Pass `recommendedHour` from `getRecommendedLeaveTime()` into the chart as a prop; render a highlighted cell.
**Files:** `DayDetail.tsx`, `leaveAdvisor.ts`

---

#### 4.3 Wet/Slippery + High Wind Report Sub-types
**Problem:** ElakHujan's hazard sub-types miss two common Malaysian road hazards: post-rain slippery surfaces and gusty winds.
**Solution:** Add "Jalan Licin 🟡" (Wet/Slippery) and "Angin Kuat 💨" to the hazard sub-type selection in the report sheet.
**Implementation:** Extend `REPORT_SUB_TYPES` in `copy.ts`; update `CommunityReport` sub_type enum; map to appropriate emoji marker colour (yellow / orange) on the Leaflet map.
**Files:** `src/constants/copy.ts`, `src/types/`, community map marker logic

---

#### 4.4 Community Report Count Badge on Bottom Nav
**Problem:** Users don't know if there's community activity relevant to them without tapping the Komuniti tab.
**Solution:** Show a small numeric badge on the Komuniti nav icon with the count of nearby (within 50 km) unexpired reports.
**Implementation:** Derive count from `useReports` (already fetched); render badge in `BottomNav`.
**Files:** `BottomNav.tsx`, `useReports.ts`

---

### TIER 2 — High Impact, Medium Effort (Next Sprint)

#### 4.5 "Sekarang" (Right Now) Widget
**Problem:** The most common user question is "Is it raining now near me?" — ElakHujan currently only shows hourly probability for the next 7 days, not current actual conditions.
**Solution:** Add a compact "Sekarang" card at the top of Weekly View showing:
- Current precipitation probability (current hour)
- Simple verdict label: **SELAMAT KELUAR** / **BERHATI-HATI** / **TUNGGU DULU**
- "Hujan dijangka dalam ~X jam" if probability is rising

**Implementation:** Open-Meteo `current` parameter (already returned by `/v1/forecast`; just needs `current=precipitation_probability` added to request params). Derive current-hour index from `hourly.time` array.
**Files:** `openMeteo.ts`, `WeeklyView.tsx`, new `NowCard` component

---

#### 4.6 Rideability Score (Replace/Augment Risk Badge)
**Problem:** Low / Medium / High risk labels are functional but lack nuance and don't communicate degree within a band.
**Solution:** Compute a 0–100 Rideability Index from rain probability; map to Malay labels:
- 80–100: **SELAMAT** (green)
- 60–79: **BAIK** (teal)
- 40–59: **BERHATI-HATI** (amber)
- 20–39: **BERISIKO** (orange)
- 0–19: **BAHAYA** (red)

Show the score prominently in Leave Advisor card; optionally surface in DayCard tooltip/detail.
**Implementation:** `rideability = 100 - rainProbability` for the commute window average; map to label via lookup table. Extend `RiskBadge` or create `RideabilityBadge`.
**Files:** `rainScoring.ts`, `RiskBadge.tsx` or new `RideabilityBadge.tsx`, `LeaveAdvisor.tsx`

---

#### 4.7 Gear Check Panel
**Problem:** Knowing it will rain is half the battle; users also need to know what to do about it.
**Solution:** Contextual gear tips in Leave Advisor and/or DayDetail, derived from risk level:
- HIGH risk: "Pakai jas hujan, periksa kasut kalis air, kurangkan laju"
- MEDIUM: "Sediakan jas hujan, berhati-hati di selekoh basah"
- LOW: "Cuaca baik — nikmati perjalanan anda!"

Show as a collapsible "Tips Perjalanan" section.
**Implementation:** Static tip mapping from risk level + MET condition string. No new API required.
**Files:** New `GearCheckPanel.tsx`; consumed in `LeaveAdvisor.tsx` and `DayDetail.tsx`

---

#### 4.8 Current Temperature Display
**Problem:** ElakHujan shows no current weather metrics — users must rely purely on probability numbers.
**Solution:** In the Leave Advisor header (and optionally NowCard), show current temperature + humidity from Open-Meteo `current` API params.
**Implementation:** Add `current=temperature_2m,relative_humidity_2m,apparent_temperature` to Open-Meteo request; surface in Leave Advisor header.
**Files:** `openMeteo.ts`, `LeaveAdvisor.tsx`

---

### TIER 3 — Medium Impact (Planned Enhancements)

#### 4.9 Community Heatmap Overlay
**Problem:** Individual pins on the map become hard to read when many reports cluster in an area.
**Solution:** Add an optional heatmap layer (Leaflet.heat plugin) showing density of rain reports in the last 2 hours. Toggle with a map control button.
**Implementation:** Install `leaflet.heat`; aggregate `lat/lng` from active reports; render as heatmap overlay toggled by button on map.
**Files:** `CommunityMap` component

---

#### 4.10 Rain Trend Indicator on DayCard
**Problem:** DayCard shows absolute probability but not whether it's improving or worsening vs previous forecast.
**Solution:** Show a small ↑↓ trend arrow on each DayCard, derived by comparing today's forecast for that day against yesterday's cached forecast (or the change in the current model run).
**Implementation:** Cache forecast snapshots in localStorage (keyed by date); compare 24 h later. If delta > 10 pp, show trend.
**Files:** `localStorage.ts`, `DayCard.tsx`, new helper in `rainScoring.ts`

---

#### 4.11 Smart Re-surface Banner
**Problem:** Leave Advisor auto-surfaces during the departure window, but users may be on another page or have the app backgrounded.
**Solution:** When the user returns to the app (via `visibilitychange` event) during their evening commute window and rain probability > threshold, show a sticky in-app banner: "⚠️ Waktu pulang menghampiri — semak Leave Advisor sekarang"
**Implementation:** Listen for `document.visibilitychange`; check time + rain threshold; render dismissable sticky banner.
**Files:** `App.tsx`, new `CommuteBanner` component

---

#### 4.12 Dark / Night Mode
**Problem:** ElakHujan has no dark theme. Using a phone outdoors in bright Malaysian sun, dark UIs (like Ridercast) are actually *less* readable, but many users prefer dark mode at night or indoors.
**Solution:** Implement CSS `prefers-color-scheme` media query support with manual toggle in Settings. Use Tailwind v4 dark mode classes.
**Implementation:** Add `dark` class toggle to `<html>`; store preference in localStorage; update all Tailwind utility classes with `dark:` variants.
**Files:** `App.tsx`, `Settings.tsx`, all UI components

---

### TIER 4 — Lower Priority / Future

| # | Idea | Notes |
|---|------|-------|
| 4.13 | **Quick Share Card** — Generate a shareable image ("Hari Selasa selamat — 15% hujan 🌤️") for WhatsApp/Telegram sharing | PWA screenshot API or canvas rendering |
| 4.14 | **Forecast Accuracy History** — Log user's confirmed office days vs actual rain; show "accuracy report" after 30 days | Motivational gamification; needs localStorage schema extension |
| 4.15 | **Map Clustering** — Cluster overlapping map pins with count badge on Community map | Improve map readability at high report density; Leaflet.markercluster plugin |
| 4.16 | **Area Name on Community** — Show user's current barangay/kampung name instead of coordinates in report confirmation step | More relatable to local users |
| 4.17 | **Offline Indicator** — Explicit "Tiada Sambungan Internet" banner using `navigator.onLine` + `offline` event | Prevents confusion when stale data shows |
| 4.18 | **Report Photo Attachment** — Allow attaching a photo to community hazard reports (Supabase Storage) | Stronger evidence for road hazards; higher effort |
| 4.19 | **Commute Calendar Export** — Export recommended office days as `.ics` calendar entries | Advanced productivity feature for office planners |
| 4.20 | **Telegram Alerts** (deferred) | Already in backlog; activate when bot token infrastructure is ready |

---

## 5. Prioritised Roadmap Suggestion

```
Phase 7A — Quick Wins (1–2 days)
├── 4.1  Data freshness indicator (green dot + timestamp)
├── 4.2  Best slot highlight in 24h chart
├── 4.3  Wet/Slippery + High Wind report sub-types
└── 4.4  Community badge on BottomNav

Phase 7B — Core Enhancements (3–5 days)
├── 4.5  "Sekarang" right-now widget on Weekly View
├── 4.6  Rideability score (0–100 + Malay labels)
├── 4.7  Gear check / "Tips Perjalanan" panel
└── 4.8  Current temperature + humidity in Leave Advisor

Phase 7C — Polish & Depth (1 week)
├── 4.9   Community heatmap overlay
├── 4.10  Rain trend indicator on DayCard
├── 4.11  Smart re-surface banner on app return
└── 4.12  Dark mode support

Phase 8+ — Future
└── 4.13–4.20 as capacity allows
```

---

## 6. Key Design Principles to Preserve

1. **BM-first language** — All new copy must go into `src/constants/copy.ts`, never hardcoded
2. **No new dependencies unless justified** — Prefer solving problems with existing Open-Meteo params, Tailwind utils, and Lucide icons before adding packages
3. **Offline-resilient** — New features should degrade gracefully when data is stale or API unavailable
4. **Mobile-first layout** — All new components designed at 390 px width first
5. **Anonymous by default** — Community features must never require registration or expose PII

---

*End of report.*
