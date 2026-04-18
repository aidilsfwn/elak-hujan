# ElakHujan — Feature Analysis & Enhancement Brief

> Generated: 2026-03-03
> Scope: Full codebase audit (Phases 1–5) — gap analysis and enhancement roadmap
> Purpose: Surface gaps, brainstorm improvements, prioritise next work

---

## 1. ElakHujan — Feature Inventory

ElakHujan is a **personalised commute planner** for office-day scooter commuters in Malaysia. It focuses on **planning ahead** — which days to go to the office and when to leave.

### Pages

| Page | Key Features |
|------|-------------|
| **Onboarding** | 3-step wizard: home + office location (Nominatim); commute time windows (morning/evening); office days per week + preferred days |
| **Weekly View** | Rolling 5 weekdays from today; DayCard per day (morning score, evening score, risk badge, recommended badge); WarningAlert (MET Malaysia official warnings, dismissable per session) |
| **Day Detail** | 24-hour bar chart; morning + evening windows highlighted; risk badge per window; back navigation |
| **Leave Advisor** | Real-time best-leave-time recommendation; scan window slots + rolling slots; risk-coloured card; "no dry window" alert; visible 2 h before → 1 h after evening window |
| **Settings** | Full config re-edit; rain threshold slider (10–80 %); data sources & accuracy disclaimer; danger-zone reset |

### Hooks & Services

| Category | Details |
|----------|---------|
| **Weather** | Open-Meteo 7-day hourly (60 min cache); home + office dual query |
| **Warnings** | data.gov.my active warnings (30 min cache); state-filtered |
| **Nowcast** | MET Malaysia daily forecast via Netlify Edge Function proxy (morning/afternoon/night) |
| **Geocoding** | Nominatim search + reverse geocoding for state detection |

### Algorithms

| Algorithm | Summary |
|-----------|---------|
| **Day scoring** | Average morning + evening hourly precipitation probability over commute windows |
| **Recommended days** | Top-N by combined score; preferred days fill first, non-preferred fill gaps |
| **Leave advisor** | Scan ±1–2 h around evening window; first slot < threshold = clean window; else least-bad |
| **Risk classification** | Low < threshold · Medium < 70 % · High ≥ 70 % |

---

## 2. Gap Analysis & Strengths

### What ElakHujan does well

| Strength | Feature | Why It Matters |
|----------|---------|----------------|
| **Personalisation** | Commute windows, preferred days, rain threshold slider | Tailored to each commuter's real schedule |
| **Planning ahead** | Weekly 5-day recommendation system | Helps schedule the week, not just right-now conditions |
| **Official data credibility** | MET Malaysia forecast + data.gov.my warnings | Government-sourced data builds trust for Malaysian users |
| **Algorithm transparency** | Shows all 5 days ranked, all slots in Leave Advisor | Users understand why a day/time is recommended |
| **Language** | Full BM (Bahasa Melayu) UI | Localisation for primary target audience |
| **Onboarding** | Guided setup with location search | Zero-friction first-use experience |
| **Leave Advisor auto-surface** | LeavePanel appears on Weekly during relevant time window | Proactive UX — surfaces the right view at the right time |

---

## 3. Enhancement Recommendations

Prioritised by impact vs implementation effort.

---

### TIER 1 — High Impact, Low Effort (Quick Wins)

#### 3.1 Data Freshness Indicator
**Problem:** Users have no visual signal that weather data is live or stale.
**Solution:** Add a small "Dikemaskini X minit lepas" (Updated X min ago) label + pulsing green dot to the Weekly View header and Leave Advisor card. Change to grey when data is > 30 min old.
**Implementation:** Use `dataUpdatedAt` from TanStack Query; format with `formatDistanceToNow`.
**Files:** `WeeklyView`, `LeaveAdvisor`

---

#### 3.2 "Best Slot" Visual Highlight in Day Detail Chart
**Problem:** The 24-hour chart shows all hours uniformly — users must mentally locate the recommended leave time.
**Solution:** In the Leave Advisor sub-section of the DayDetail chart, overlay a subtle green "terbaik" badge or background stripe on the recommended slot column.
**Implementation:** Pass `recommendedHour` from `getRecommendedLeaveTime()` into the chart as a prop; render a highlighted cell.
**Files:** `DayDetail.tsx`, `leaveAdvisor.ts`

---

---

### TIER 2 — High Impact, Medium Effort (Next Sprint)

#### 3.3 "Sekarang" (Right Now) Widget
**Problem:** The most common user question is "Is it raining now near me?" — ElakHujan currently only shows hourly probability for the next 7 days, not current actual conditions.
**Solution:** Add a compact "Sekarang" card at the top of Weekly View showing:
- Current precipitation probability (current hour)
- Simple verdict label: **SELAMAT KELUAR** / **BERHATI-HATI** / **TUNGGU DULU**
- "Hujan dijangka dalam ~X jam" if probability is rising

**Implementation:** Open-Meteo `current` parameter (already returned by `/v1/forecast`; just needs `current=precipitation_probability` added to request params). Derive current-hour index from `hourly.time` array.
**Files:** `openMeteo.ts`, `WeeklyView.tsx`, new `NowCard` component

---

#### 3.4 Rideability Score (Replace/Augment Risk Badge)
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

#### 3.5 Gear Check Panel
**Problem:** Knowing it will rain is half the battle; users also need to know what to do about it.
**Solution:** Contextual gear tips in Leave Advisor and/or DayDetail, derived from risk level:
- HIGH risk: "Pakai jas hujan, periksa kasut kalis air, kurangkan laju"
- MEDIUM: "Sediakan jas hujan, berhati-hati di selekoh basah"
- LOW: "Cuaca baik — nikmati perjalanan anda!"

Show as a collapsible "Tips Perjalanan" section.
**Implementation:** Static tip mapping from risk level + MET condition string. No new API required.
**Files:** New `GearCheckPanel.tsx`; consumed in `LeaveAdvisor.tsx` and `DayDetail.tsx`

---

#### 3.6 Current Temperature Display
**Problem:** ElakHujan shows no current weather metrics — users must rely purely on probability numbers.
**Solution:** In the Leave Advisor header (and optionally NowCard), show current temperature + humidity from Open-Meteo `current` API params.
**Implementation:** Add `current=temperature_2m,relative_humidity_2m,apparent_temperature` to Open-Meteo request; surface in Leave Advisor header.
**Files:** `openMeteo.ts`, `LeaveAdvisor.tsx`

---

### TIER 3 — Medium Impact (Planned Enhancements)

#### 3.7 Rain Trend Indicator on DayCard
**Problem:** DayCard shows absolute probability but not whether it's improving or worsening vs previous forecast.
**Solution:** Show a small ↑↓ trend arrow on each DayCard, derived by comparing today's forecast for that day against yesterday's cached forecast (or the change in the current model run).
**Implementation:** Cache forecast snapshots in localStorage (keyed by date); compare 24 h later. If delta > 10 pp, show trend.
**Files:** `localStorage.ts`, `DayCard.tsx`, new helper in `rainScoring.ts`

---

#### 3.8 Smart Re-surface Banner
**Problem:** Leave Advisor auto-surfaces during the departure window, but users may be on another page or have the app backgrounded.
**Solution:** When the user returns to the app (via `visibilitychange` event) during their evening commute window and rain probability > threshold, show a sticky in-app banner: "⚠️ Waktu pulang menghampiri — semak Leave Advisor sekarang"
**Implementation:** Listen for `document.visibilitychange`; check time + rain threshold; render dismissable sticky banner.
**Files:** `App.tsx`, new `CommuteBanner` component

---

#### 3.9 Dark / Night Mode
**Problem:** ElakHujan has no dark theme. Many users prefer dark mode at night or indoors.
**Solution:** Implement CSS `prefers-color-scheme` media query support with manual toggle in Settings. Use Tailwind v4 dark mode classes.
**Implementation:** Add `dark` class toggle to `<html>`; store preference in localStorage; update all Tailwind utility classes with `dark:` variants.
**Files:** `App.tsx`, `Settings.tsx`, all UI components

---

### TIER 4 — Lower Priority / Future

| # | Idea | Notes |
|---|------|-------|
| 3.10 | **Quick Share Card** — Generate a shareable image ("Hari Selasa selamat — 15% hujan 🌤️") for WhatsApp/Telegram sharing | PWA screenshot API or canvas rendering |
| 3.11 | **Forecast Accuracy History** — Log user's confirmed office days vs actual rain; show "accuracy report" after 30 days | Motivational gamification; needs localStorage schema extension |
| 3.12 | **Offline Indicator** — Explicit "Tiada Sambungan Internet" banner using `navigator.onLine` + `offline` event | Prevents confusion when stale data shows |
| 3.13 | **Commute Calendar Export** — Export recommended office days as `.ics` calendar entries | Advanced productivity feature for office planners |
| 3.14 | **Telegram Alerts** (deferred) | Already in backlog; activate when bot token infrastructure is ready |

---

## 4. Prioritised Roadmap Suggestion

```
Phase 7A — Quick Wins (1–2 days)
├── 3.1  Data freshness indicator (green dot + timestamp)
└── 3.2  Best slot highlight in 24h chart

Phase 7B — Core Enhancements (3–5 days)
├── 3.3  "Sekarang" right-now widget on Weekly View
├── 3.4  Rideability score (0–100 + Malay labels)
├── 3.5  Gear check / "Tips Perjalanan" panel
└── 3.6  Current temperature + humidity in Leave Advisor

Phase 7C — Polish & Depth (1 week)
├── 3.7   Rain trend indicator on DayCard
├── 3.8   Smart re-surface banner on app return
└── 3.9   Dark mode support

Phase 8+ — Future
└── 3.10–3.14 as capacity allows
```

---

## 5. Key Design Principles to Preserve

1. **BM-first language** — All new copy must go into `src/constants/copy.ts`, never hardcoded
2. **No new dependencies unless justified** — Prefer solving problems with existing Open-Meteo params, Tailwind utils, and Lucide icons before adding packages
3. **Offline-resilient** — New features should degrade gracefully when data is stale or API unavailable
4. **Mobile-first layout** — All new components designed at 390 px width first
5. **Anonymous by default** — The app must never require registration or expose PII

---

*End of report.*
