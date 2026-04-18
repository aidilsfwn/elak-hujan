# Remove Komuniti Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely remove the Komuniti (Community) feature — all code, packages, env vars, and docs — leaving no trace in the app.

**Architecture:** Delete 14 community-only files, partially edit 4 shared files, uninstall 3 packages, strip env vars from both .env files, and clean all doc references. No new code is written; this is a pure deletion/cleanup.

**Tech Stack:** React 19 + TypeScript, Vite, Zustand, TanStack Query, Supabase (to be removed), Leaflet (to be removed)

**External service to take down:** Supabase project at `https://supabase.com` — project URL `https://aqkgbdlzhlmvojabzrhj.supabase.co`. Delete (or pause) the project once code is removed.

---

### Task 1: Edit shared files (App.tsx, BottomNav, copy.ts, index.css)

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/BottomNav.tsx`
- Modify: `src/constants/copy.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Remove Community route from App.tsx**

Remove the import and the `/komuniti` route:

```tsx
// DELETE this import:
import { Community } from '@/pages/Community';

// DELETE this route:
<Route path="/komuniti" element={<Community />} />
```

- [ ] **Step 2: Strip Komuniti from BottomNav.tsx**

Remove the `useCommunityCount` import, the nav item, and the badge rendering logic. The nav items array should only contain the three remaining items (Weekly, Leave, Settings). Remove the `{ Users }` icon import from lucide-react if it is no longer used elsewhere in the file.

- [ ] **Step 3: Remove community copy from copy.ts**

Remove:
- `community: "Komuniti"` from the `nav` object
- The entire `community:` top-level key (all sub-keys: reportSheet, feed, filterBar, map, errors, emptyState, etc.)

- [ ] **Step 4: Remove leaflet CSS import from index.css**

Delete: `@import "leaflet/dist/leaflet.css";`

- [ ] **Step 5: Build to confirm no compile errors**

```bash
cd /c/elak-hujan && npm run build
```

Expected: Build succeeds with no TypeScript or import errors.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/BottomNav.tsx src/constants/copy.ts src/index.css
git commit -m "feat: remove Komuniti feature - shared file cleanup"
```

---

### Task 2: Delete community-only files

**Files to delete entirely:**
- `src/pages/Community/` (entire directory)
- `src/types/community.ts`
- `src/services/communityReports.ts`
- `src/services/supabase.ts`
- `src/hooks/useReports.ts`
- `src/hooks/useSubmitReport.ts`
- `src/hooks/useConfirmReport.ts`
- `src/hooks/useCommunityCount.ts`
- `src/constants/communityConfig.ts`
- `src/components/ui/sheet.tsx`

- [ ] **Step 1: Delete community pages directory**

```bash
rm -rf /c/elak-hujan/src/pages/Community
```

- [ ] **Step 2: Delete community-only source files**

```bash
rm /c/elak-hujan/src/types/community.ts \
   /c/elak-hujan/src/services/communityReports.ts \
   /c/elak-hujan/src/services/supabase.ts \
   /c/elak-hujan/src/hooks/useReports.ts \
   /c/elak-hujan/src/hooks/useSubmitReport.ts \
   /c/elak-hujan/src/hooks/useConfirmReport.ts \
   /c/elak-hujan/src/hooks/useCommunityCount.ts \
   /c/elak-hujan/src/constants/communityConfig.ts \
   /c/elak-hujan/src/components/ui/sheet.tsx
```

- [ ] **Step 3: Build to confirm clean**

```bash
cd /c/elak-hujan && npm run build
```

Expected: Build succeeds. No dangling imports.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: remove Komuniti feature - delete community-only files"
```

---

### Task 3: Uninstall packages and remove env vars

**Files:**
- Modify: `package.json` (via npm uninstall)
- Modify: `.env.local`
- Modify: `.env.example`

- [ ] **Step 1: Uninstall Supabase and Leaflet packages**

```bash
cd /c/elak-hujan && npm uninstall @supabase/supabase-js leaflet @types/leaflet
```

- [ ] **Step 2: Remove Supabase env vars from .env.local**

Delete these two lines from `.env.local`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

- [ ] **Step 3: Remove Supabase env vars from .env.example**

Delete the same two keys from `.env.example`.

- [ ] **Step 4: Build to confirm clean**

```bash
cd /c/elak-hujan && npm run build
```

Expected: Build succeeds with no Supabase/Leaflet references.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "feat: remove Komuniti feature - uninstall packages and strip env vars"
```

---

### Task 4: Clean documentation

**Files:**
- Modify: `docs/PRD.md`
- Modify: `docs/FEATURE-ANALYSIS.md`
- Modify: `docs/IMPLEMENTATION_PLAN.md`
- Modify: `docs/ARCHITECTURE.md` (if it mentions community)
- Modify: `docs/DEPLOYMENT.md` (if it mentions Supabase env vars)

- [ ] **Step 1: Search for all community mentions in docs**

```bash
grep -rn -i "komuniti\|community\|supabase\|leaflet\|phase 6" /c/elak-hujan/docs/ --include="*.md"
```

- [ ] **Step 2: Edit each doc file found**

For each file with hits, remove or rewrite the relevant sections:
  - Remove Phase 6 (Community) sections from `IMPLEMENTATION_PLAN.md`
  - Remove Komuniti from `PRD.md` feature list and any requirements sections
  - Remove community analysis from `FEATURE-ANALYSIS.md`
  - Remove Supabase from `ARCHITECTURE.md` service diagram/descriptions
  - Remove `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` from `DEPLOYMENT.md`

- [ ] **Step 3: Commit**

```bash
git add docs/
git commit -m "docs: remove Komuniti feature from all documentation"
```

---

### Task 5: Update memory files

**Files:**
- Modify: `C:\Users\A.AbdullahSani\.claude\projects\C--elak-hujan\memory\MEMORY.md`
- Delete: `C:\Users\A.AbdullahSani\.claude\projects\C--elak-hujan\memory\phase6-plan.md` (if it exists)

- [ ] **Step 1: Update MEMORY.md**

Remove from MEMORY.md:
- Phase 6 entry under Phase Status
- Phase 7A community-related sub-bullets (community count badge, jalan_licin+angin_kuat Supabase migration note)
- Phase 7B community count badge on BottomNav note
- `Community Polish ✅ COMPLETE` entry
- Key file path entries for `communityConfig.ts`, `useCommunityCount.ts`
- Architecture note about Supabase (Open-Meteo called twice... section — keep, but remove any Supabase/community cache references)

- [ ] **Step 2: Delete phase6-plan.md if it exists**

```bash
rm -f "C:/Users/A.AbdullahSani/.claude/projects/C--elak-hujan/memory/phase6-plan.md"
```

- [ ] **Step 3: Verify memory is consistent**

Read MEMORY.md and confirm no community/Supabase/Leaflet references remain.

---

### Task 6: Final verification

- [ ] **Step 1: Full build**

```bash
cd /c/elak-hujan && npm run build
```

Expected: Succeeds, no warnings about missing modules.

- [ ] **Step 2: Grep for any remaining community references in src/**

```bash
grep -rn -i "komuniti\|community\|supabase\|leaflet" /c/elak-hujan/src/ --include="*.ts" --include="*.tsx" --include="*.css"
```

Expected: Zero results.

- [ ] **Step 3: Confirm BottomNav has 3 items**

Run the dev server and visually confirm the bottom nav shows only: Weekly | Leave | Settings (no Komuniti tab).

```bash
cd /c/elak-hujan && npm run dev
```

- [ ] **Step 4: Take down Supabase**

Go to https://supabase.com → your project → Settings → General → Delete project (or pause it if you want to keep data temporarily). Project URL: `https://aqkgbdlzhlmvojabzrhj.supabase.co`

- [ ] **Step 5: Final commit (if any loose changes)**

```bash
git add -A
git commit -m "chore: final cleanup after Komuniti feature removal"
```
