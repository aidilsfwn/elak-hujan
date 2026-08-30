# ElakHujan — Design System ("Ride Verdict")

A direct, decision-first design system for a rain-risk commute advisor. The job of this UI is to answer "should I ride now, or wait?" in under two seconds — every choice below serves that, borrowing frosted-glass polish, blunt typographic honesty, and risk-color-coding from the references while staying restrained enough for daily glanceable use.

## Core Principle

The screen's #1 element is always the **verdict**, not the data. Data (percentages, times, hourly breakdown) supports the verdict but never competes with it for attention.

## Color Palette — Risk-Coded

Background and accent color shift based on the current/selected day's rain risk — same principle as the UV-index reference, applied to rain risk instead:

| Risk level | Background gradient | Accent |
|---|---|---|
| Low / clear | `#DCEEF2` → `#EAF7E8` (soft sky-to-mint) | `#2E9E6B` (deep green) |
| Moderate | `#FDF1D8` → `#FBE3C6` (soft amber) | `#D98A2B` (amber) |
| High | `#F7DCD8` → `#F2C6C0` (soft coral) | `#C4453A` (rust red) |
| Severe / warning active | `#E7D8F2` → `#D8C0E8` (deep dusk purple, more saturated) | `#7A3FA0` (deep purple) |

Gradients are soft, full-bleed on the primary verdict screen only (mirrors the typographic reference) — secondary screens (weekly view, settings) use a plain neutral background (`#F7F7F5` light / `#15151A` dark) with the risk color used only as small accents, tags, and icon fills, to avoid visual fatigue.

**Dark mode:** invert to deep navy/charcoal bases (`#12141C` low, shifting slightly warmer per risk level) with the same accent hues at higher saturation, echoing the frosted dark iOS reference — this app will often be checked at night before a morning commute, so dark mode is a first-class mode, not an afterthought.

## Typography

- Font family: a clean geometric/grotesque sans for headline verdicts (e.g. Inter, General Sans), paired with a monospace or tabular-figure font for all numeric readouts (times, percentages, temperatures) — the monospace choice nods to the retro dot-matrix reference and gives weather data a precise, instrument-like feel without going full retro pastiche
- Verdict headline: large, bold, blunt, plain-language — 32–40px, tight line-height. Written as a direct statement, not a label: **"Clear ride this morning"** / **"Rain likely by 5:30 PM — leave before 4"**, not "Rain Probability: 62%"
- Supporting numerals (%, times, temps): 20–28px, monospace, tabular-nums
- Body/detail text: 14–16px, regular weight, the geometric sans

## Spacing

4px base unit: `4 / 8 / 12 / 16 / 24 / 32 / 48`. The verdict screen should feel uncluttered — generous top padding around the headline, details in a single frosted card below rather than several competing widgets.

## Components

### Verdict card (home screen, top of view)
- Full-bleed risk-gradient background for the screen (or top ~60%)
- Large plain-language verdict headline
- One key monospace numeral supporting it (e.g. rain probability % or recommended departure time)
- Small subtext line with the MET Malaysia official term (Pagi/Petang/Malam) for credibility

### Frosted detail cards (below the verdict)
- **Default (performance-safe):** semi-transparent solid surface — no blur — `rgba(255,255,255,0.85)` light / `rgba(20,20,26,0.85)` dark, with a subtle 1px border at ~10% opacity. This is the baseline for all builds and should look correct on its own.
- **Optional enhancement:** where `backdrop-filter` is supported and cheap to render, layer in a light blur (`blur(8–12px)`, not the 20px+ "heavy glass" look) as a progressive enhancement on top of the solid surface — never the only way the card looks correct. Feature-detect (`@supports (backdrop-filter: blur(1px))`) rather than assuming support, and keep blur off scrollable lists (Weekly View, hourly breakdown) where repeated blurred elements compound cost — reserve it for the single verdict-screen card at most, if used at all
- Used for: hourly breakdown, weekly view rows, MET official forecast panel
- Each row: rounded pill or small circular icon (weather condition), monospace time, monospace %, minimal chrome

### Weekly View rows
- 5 rows (working days), each a frosted card
- Small colored dot or edge-accent (not full background) indicating that day's risk level per the palette table
- Morning and evening commute windows shown as two compact inline stats per row, not two full sub-cards

### Warning banner (MET Malaysia warnings)
- Full-width banner, `severe` risk color background, bold short text, dismiss (×) button
- Dismissible per session only — should reappear next session if warning still active (functional note, not visual, but relevant to how it's built)

### Navigation
- Bottom tab bar, solid surface background (matching the frosted card's performance-safe default, blur only as optional enhancement per above), 3–4 items max (Home/Verdict, Weekly, Settings) — simple icon + label, similar restraint to the dark iOS reference's bottom bar

## Motion

Calm and quick — this is a glance-and-go utility, not a delight-focused app. No confetti, no bounce.

- Risk-gradient background: smooth 400ms crossfade when switching days/risk levels (never an abrupt cut)
- Verdict headline: gentle fade + 4px upward slide on load, ~200ms
- Numeral changes (e.g. countdown to rain, live-updating %): use a spring-based counter, but subtle — fast settle, minimal overshoot
- Warning banner: slides down on appear, slides up + fades on dismiss, ~200ms
- Pull-to-refresh (if used): simple spinner or a small animated raindrop icon, nothing elaborate

```jsx
// Example: risk-level background crossfade
import { motion, AnimatePresence } from "motion/react";

function VerdictBackground({ riskLevel, gradient }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={riskLevel}
        className="verdict-bg"
        style={{ background: gradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
    </AnimatePresence>
  );
}
```

```jsx
// Example: frosted glass card
<div className="rounded-2xl border border-white/10 bg-white/75 dark:bg-black/40 backdrop-blur-xl p-4">
  {/* card content */}
</div>
```

## Avoid List

- Cluttered dashboards with many competing stat widgets — one verdict, then supporting detail, in that order
- Cutesy weather iconography (fat 3D clouds, smiling suns) — keep icons simple/geometric, this is a practical tool, not a lifestyle app
- Full retro dot-matrix pastiche across the whole UI — the monospace numeral treatment is enough of a nod; don't recreate an LED-panel look wholesale
- Saturated, jarring risk colors — keep gradients soft/muted even for "severe," so the app is glanceable without feeling alarming at 6am
- Long-winded copy — verdict text stays to one short sentence; anything more belongs in the detail card below, not the headline
- Heavy `backdrop-filter` blur as a load-bearing default — see Frosted detail cards for the performance-safe approach; never ship a card that looks broken/transparent-and-illegible when blur isn't rendered
