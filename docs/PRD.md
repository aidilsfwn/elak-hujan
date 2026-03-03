# PRD – ElakHujan
### Perancang Hujan untuk Rider
**Version:** 0.7
**Author:** Aidil Safwan
**Last Updated:** March 2026

---

## 1. Overview

ElakHujan is a mobile-first React PWA that helps scooter commuters in Malaysia plan their office days and commute timing around rain. It combines a weekly planning view, a daily leave-time advisor, and a live community hazard feed — all personalised through a local configuration setup. User preferences are stored in the browser's localStorage. A Netlify Edge Function proxy forwards MET Malaysia API requests server-side (to avoid CORS and keep the API token out of the browser). Community reports are stored in a Supabase free-tier Postgres database; no user accounts or login are required.

---

## 2. Problem Statement

Malaysian tropical weather is unpredictable and makes scooter commuting uncomfortable or dangerous. Commuters who have flexible work arrangements (e.g. 3 office days per week) currently have no easy way to:
1. Pick the best days of the week to go to the office based on rain probability during their commute windows.
2. Decide what time to leave the office in the evening to avoid getting caught in the rain.
3. Know in real-time whether it is raining or hazardous near them right now — something no weather model can capture for hyperlocal convective storms.

---

## 3. Goals

| # | Goal |
|---|------|
| G1 | Help users pick the best office days each week based on rain forecast during commute windows |
| G2 | Help users decide when to leave the office in the evening |
| G3 | Be fully configurable per user with no backend or login required |
| G4 | Be shareable — any friend can open the app and set it up for their own commute |
| G5 | All UI copy and labels in Bahasa Melayu as the primary language |
| G6 | Surface real-time hazard reports from the community to complement NWP forecast data |
| G7 | Translate rain probability into actionable signals: rideability score, gear tips, temperature context |

---

## 4. Non-Goals

- No user accounts or cloud sync (see Section 15 for future plans)
- No Android/iOS native app
- No paid weather API integrations (MET Malaysia API is free with registration)
- No traffic or route planning
- No push notifications (Telegram integration deferred — see Section 15)

---

## 5. Users

**Primary user:** Aidil — Senior Software Engineer, rides a scooter, flexible 3-days-in-office arrangement, commutes in KL, checks his phone in the morning and evening.

**Secondary users:** Friends with similar flexible office arrangements and scooter/motorcycle commutes, primarily in Malaysia.

---

## 6. User Stories

### 6.1 Weekly Planning
> *"As a user, I want to open the app on Sunday night and see which 3 days next week are best for commuting to the office by scooter, so I can plan my week in advance."*

- Show the next 5 weekdays from today (rolling window, not fixed Mon–Fri calendar week) — this aligns exactly with Open-Meteo's 7-day forecast window
- For each day, display rain probability during the configured morning commute window and evening commute window
- Highlight the recommended N days (default: 3) with the lowest combined rain risk, drawn **only from the user's `preferredDays`** — non-preferred days are shown but never highlighted as recommended unless there are fewer than N preferred days available in the window
- Tapping anywhere on a day card navigates to the Day Detail view
- A **"Sekarang" NowWidget** shows the current hour's rain probability for the home location with a colour-coded verdict (Selamat Keluar / Berhati-hati / Tunggu Dahulu)
- A **data freshness indicator** (green pulsing dot when fresh, grey when stale) shows how recently weather data was fetched

### 6.2 Daily Evening Check-in
> *"As a user, on each evening before an office day, I want to quickly verify whether tomorrow's forecast has changed."*

- Accessible from the weekly view — tapping a day drills into a day detail view
- Show hourly rain probability for the full day with commute windows clearly marked
- A **best leave slot dot** is rendered above the recommended evening departure column in the 24-hour bar chart

### 6.3 Leave Time Advisor
> *"As a user, when I'm at the office and it's approaching the end of the day, I want to know the best time to leave to avoid rain during my ride home."*

- Triggered contextually when the current time is within 2 hours before the user's configured evening commute window
- Shows a rolling hourly rain forecast from the current time through the next 3 hours
- Highlights the recommended leave window (lowest rain probability slot)
- Displays a **Rideability Score** (0–100, labelled SELAMAT → BAHAYA) computed as `100 − probability` so users have an at-a-glance quality signal
- Displays the **current temperature** (°C) fetched from Open-Meteo's `temperature_2m` field as a context chip in the header
- Shows a **data freshness chip** indicating when the weather data was last fetched
- Includes a collapsible **"Tips Perjalanan"** gear check panel with contextual BM tips appropriate to the rain risk level
- Uses the **office location** as the weather reference point
- Displays a **MET Malaysia official daily forecast** section (Pagi / Petang / Malam) sourced from the `FORECAST/GENERAL` dataset (`FGM`/`FGA`/`FGN` datatypes), showing today's qualitative weather conditions per period as published by MET Malaysia — supplementary to the Open-Meteo hourly probability forecast

### 6.4 Community Hazard Reports
> *"As a user, I want to see what other riders are reporting near me right now — rain, flooding, fallen trees, slippery roads — because model forecasts miss hyperlocal events."*

- Any user can submit an anonymous rain or hazard report pinned to their GPS location
- Reports expire after 2 hours; users can confirm a report ("Saya pun!") to keep it relevant
- Reports are displayed on a Leaflet map with colour-coded pins and in a scrollable feed
- **Report categories:** Hujan (Renyai, Sederhana, Lebat) and Bahaya (Banjir Kilat, Jalan Banjir, Pokok Tumbang, Jalan Licin, Angin Kuat, Lain-lain)
- The **BottomNav Komuniti tab** shows a live count badge for reports in the user's home state
- The feed shows a live timestamp ("Langsung · dikemas kini X min lalu")
- Filter by jenis, masa, and lokasi (berhampiran / negeri); a **Reset** chip appears when filters differ from defaults
- When GPS is unavailable the report falls back to the user's home location with a visible note ("Lokasi anggaran (berdasarkan lokasi rumah)")

### 6.5 Onboarding & Settings
> *"As a new user, I want a guided setup so I can configure my commute details before using the app."*

- First-launch onboarding wizard with the following steps:
  1. Set home location (address search via Nominatim)
  2. Set office location (address search via Nominatim)
  3. Set morning commute window (e.g. 8:00am – 9:00am)
  4. Set evening commute window (e.g. 5:00pm – 6:00pm)
  5. Set number of office days per week (default: 3)
  6. Set preferred days of the week (e.g. Mon, Tue, Wed — flexible)
- All settings editable post-onboarding from a Settings page

---

## 7. Key Screens

| Screen | Description |
|--------|-------------|
| **Weekly View** | Rolling 5-weekday cards showing morning + evening rain risk. Recommended days highlighted. NowWidget shows current-hour probability. Data freshness indicator in header. Tapping a card navigates to Day Detail. |
| **Day Detail View** | Hourly rain forecast for a selected day. Commute windows highlighted as bands. Primary dot marks the best evening departure slot. |
| **Leave Now Advisor** | Contextual panel showing rolling forecast, recommended leave time, Rideability Score, current temperature chip, data freshness chip, collapsible gear tips, and MET official daily forecast. Visible within 2 hours before evening commute window; also accessible from BottomNav. |
| **Community** | Leaflet map with colour-coded hazard pins + live scrollable feed. FAB for submitting a new report. Filter bar with type/time/location controls and a reset chip. BottomNav badge shows report count. |
| **Onboarding Wizard** | Step-by-step first-launch setup flow. |
| **Settings Page** | Full config editor — locations, commute windows, office day preferences, rain threshold. |

---

## 8. Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | React 19 + TypeScript | Aidil's primary stack, fast to build |
| Styling | Tailwind CSS v4 + shadcn/ui (new-york) | Clean, minimal, component-ready |
| State / Storage | Zustand (runtime) + localStorage (persistence) | No backend needed, shareable by design |
| Primary weather API | Open-Meteo (free, no key required) | Hourly precipitation probability + temperature_2m, no API key, covers Malaysia |
| Daily forecast API | MET Malaysia API — api.met.gov.my (free with registration) | Official daily forecast (`FORECAST/GENERAL`, datatypes `FGM`/`FGA`/`FGN`); proxied via Netlify Edge Function to avoid CORS and keep token server-side |
| Warnings API | data.gov.my Weather API | Official source for active weather warnings, displayed as dismissible banner |
| API proxy | Netlify Edge Function (`netlify/edge-functions/met-proxy.ts`) | Forwards MET API calls server-side; `MET_TOKEN` never reaches the browser |
| Community database | Supabase (free tier) | Postgres with row-level security; anonymous reports via device hash rate limiting |
| Map rendering | Leaflet + react-leaflet | Lightweight, works offline once tiles cached |
| Location input | Nominatim (OpenStreetMap geocoding) | Free, no API key required |
| Data fetching | TanStack Query v5 | Caching, stale-while-revalidate, `dataUpdatedAt` for freshness indicators |
| Localisation | Bahasa Melayu (primary) | Local-first product; all UI strings in `src/constants/copy.ts` |

**Note on weather data sources:** Open-Meteo is used for all multi-day planning and scoring logic (hourly precipitation probability + temperature_2m, 7-day forecast). MET Malaysia API (`FORECAST/GENERAL`) provides today's official qualitative forecast (Pagi/Petang/Malam) as a supplementary section in the Leave Advisor. The `OBSERVATION/RAINS` (radar nowcast) datatypes require elevated API access not included in the default MET Malaysia registration and are not used. data.gov.my is used exclusively to surface active MET Malaysia weather warnings as a banner/alert in the UI.

---

## 9. Weather Data Requirements

**Open-Meteo (primary):**
- Hourly `precipitation_probability` and `temperature_2m` for the next 7 days
- Two separate API calls — one for home location, one for office location
- Refresh strategy: fetch on app open, cache for 60 minutes; `dataUpdatedAt` exposed to UI for freshness indicator

**MET Malaysia API — api.met.gov.my (daily forecast):**
- Fetch `FORECAST / GENERAL` datatypes (`FGM` morning, `FGA` afternoon, `FGN` night) for the user's office state location
- Called via Netlify Edge Function proxy; token stored as server-side env var `MET_TOKEN`
- State location list (`/locations?locationcategoryid=STATE`) cached 24 hours; today's forecast cached 5 minutes
- Displayed as a supplementary "Ramalan MET Hari Ini" section in the LeaveAdvisor view
- **Note:** `OBSERVATION / RAINS` radar nowcast datatypes require elevated API access beyond default registration; not implemented

**data.gov.my (warnings only):**
- Poll `/weather/warning` on app open
- Filter for warnings relevant to user's configured district/state
- Display as a dismissible alert banner if active warnings exist

---

## 10. Recommendation Logic

**Rain risk threshold:** A commute window is considered "risky" if average precipitation probability exceeds **40%**. This is the default; user-configurable in settings.

**Day scoring:**
- For each weekday in the rolling 7-day window, fetch hourly rain probability from both home and office locations
- Morning score = average probability across the configured morning commute window (home location, outbound)
- Evening score = average probability across the configured evening commute window (office location, inbound)
- Combined day score = average of morning + evening scores
- Rank weekdays by score (lowest = best)
- **Recommended days selection:** Fill top-N slots from preferred days only, ranked by score. Non-preferred days only appear in the top-N if there are fewer than N preferred days available in the current window. Non-preferred days are always visible on the UI but never carry a "Disyorkan" badge unless filling a gap.
- N = `officeDaysPerWeek` from config

**Leave time recommendation:**
- Fetch hourly rain probability from the office location (Open-Meteo)
- Scan from 1 hour before evening window start through 2 hours after
- Recommend the earliest 1-hour slot where rain probability stays below threshold
- If no dry window exists, surface the least-bad slot with a warning message

**Rideability Score:**
- Computed inline as `100 − Math.round(probability)` for the recommended slot
- Mapped to five labels: SELAMAT (80–100), BAIK (60–79), BERHATI-HATI (40–59), BERISIKO (20–39), BAHAYA (0–19)
- Rendered as a colour-coded pill inside the recommendation gradient card

**Gear Tips:**
- Derived from the recommended slot's probability and the configured rain threshold
- Low (below threshold): `["Cuaca baik — selamat bertolak! 🌤️"]`
- Medium (threshold ≤ prob < 70): `["Sediakan baju hujan sebelum bertolak", "Berhati-hati di selekoh basah"]`
- High (≥ 70): `["Pakai baju hujan", "Kurangkan kelajuan", "Elak kawasan rendah & banjir"]`
- Displayed in a collapsible "Tips Perjalanan" panel below the recommendation card

**NowWidget:**
- Reads the current local hour's `precipitation_probability` from `homeWeather.hourly`
- Verdicts: green Selamat Keluar (< threshold), amber Berhati-hati (< 70), red Tunggu Dahulu (≥ 70)
- Displayed as a compact left-border card between the MET forecast section and the weekly day cards

---

## 11. Community Reports — Data Model

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | Primary key |
| `lat` / `lng` | float | Report coordinates |
| `state` | text | Malaysian state (16 states + 3 FTs) |
| `category` | enum | `hujan` \| `bahaya` |
| `sub_type` | enum | See list below |
| `reported_at` | timestamptz | Submission time |
| `expires_at` | timestamptz | `reported_at + 2 hours` |
| `confirms` | int | Peer confirmations count |
| `device_hash` | text (hashed) | Rate-limiting: max 1 report per state per 30 min per device |

**Sub-types:** `renyai`, `sederhana`, `lebat` (Hujan) · `banjir_kilat`, `jalan_banjir`, `pokok_tumbang`, `jalan_licin`, `angin_kuat`, `lain` (Bahaya)

---

## 12. Success Metrics (Personal v1)

- App is usable end-to-end within 1 weekend of development
- Aidil uses it for at least 4 consecutive weeks
- At least 1 friend sets it up successfully without guidance

---

## 13. Open Questions

| # | Question |
|---|----------|
| OQ1 | ~~Should weather be fetched for home location, office location, or both?~~ **Resolved: Both.** |
| OQ2 | ~~What rain probability threshold counts as "risky"?~~ **Resolved: 40% default, user-configurable.** |
| OQ3 | ~~Should confirmed office days sync to a calendar or remain app-only?~~ **Superseded: confirmed office day feature removed. DayCard taps now navigate directly to Day Detail.** |
| OQ4 | ~~Telegram notifications?~~ **Deferred to future work. See Section 15.** |
| OQ5 | ~~Crowdsourced rain & hazard reports?~~ **Resolved: implemented as the Komuniti feature (Phase 6–7).** |

---

## 15. Out of Scope / Future Work

- Multi-city or multi-user shared dashboard
- Historical rain pattern analysis
- Integration with Google Calendar for office day confirmation
- **Telegram notifications** — morning summary on confirmed office days (rain risk for both commute windows) and an evening nudge with the best leave time recommendation, delivered via a Netlify serverless function holding the bot token; each user stores only their own Chat ID locally
- **User accounts & cloud sync** — allow users to sign in and have their config (locations, commute windows, preferences) synced across devices, rather than being tied to a single browser's localStorage
- **Push alerts from community** — proactively notify riders in the same area when a high-severity hazard (e.g. banjir kilat, pokok tumbang) is reported nearby, without requiring the app to be open
- **Radar nowcast layer** — overlay MET Malaysia `OBSERVATION/RAINS` data on the community map once elevated API access is obtained, giving a real-time precipitation intensity layer
