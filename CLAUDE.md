# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite, http://localhost:5173/sports-bracket2/)
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run lint       # ESLint check
npm test           # Vitest (src/utils/tournament.test.js — bracket logic)
```

## Environment variables

Requires `.env.local` (not committed):
```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

GitHub Pages production build gets these from repository secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) injected via `.github/workflows/deploy.yml`.

## Supabase setup

Two tables required (run in Supabase SQL Editor):

```sql
create table tournaments (
  id text primary key,
  school_level text not null,
  data jsonb not null,
  created_at timestamptz default now()
);
alter table tournaments enable row level security;
create policy "anyone can read" on tournaments for select using (true);
create policy "authenticated insert" on tournaments for insert with check (auth.role() = 'authenticated');
create policy "authenticated update" on tournaments for update using (auth.role() = 'authenticated');
create policy "authenticated delete" on tournaments for delete using (auth.role() = 'authenticated');

create table app_config (
  key text primary key,
  value text not null
);
alter table app_config enable row level security;
create policy "anyone can read config" on app_config for select using (true);
create policy "authenticated write config" on app_config for all using (auth.role() = 'authenticated');
```

`app_config` stores `{ key: 'admin_created', value: 'true' }` after the first admin signup.

## Architecture

**Stack:** React 19 + Vite + Tailwind CSS v4. No routing library — screens are rendered conditionally by `state.currentScreen`.

### State management

Two React contexts:

1. **`AppContext`** (`src/App.jsx`) — `useReducer` for all tournament/screen/UI state. Exposes `{ state, dispatch, asyncDispatch, importedLevel }`.

2. **`AdminContext`** (`src/contexts/AdminContext.jsx`) — Supabase Auth session state (`isLoggedIn`, `username`). Restores session on mount via `onAuthStateChange`. Wraps the whole app outside `AppContext`.

### dispatch vs asyncDispatch

**`dispatch`** — synchronous reducer actions only (SET_SCREEN, SET_META, ADD_TEAM, etc.).

**`asyncDispatch`** (defined in `App.jsx`, passed through `AppContext`) — must be used for actions that touch Supabase. Wrapped in try/catch; errors are logged but do not propagate to callers. **The reducer only receives a dispatch call after the DB operation succeeds** — if the DB call throws, dispatch is never called.

Actions handled by asyncDispatch:
- `LOAD_TOURNAMENT_LIST` — fetches from DB, dispatches with `payload.list`
- `BACK_TO_HOME` — fetches list from DB, dispatches with `payload.list`
- `SELECT_TOURNAMENT` — loads full tournament from DB, dispatches with `payload.data`
- `DELETE_TOURNAMENT` — deletes from DB (throws on error), then dispatches
- `RESET_ALL_TOURNAMENTS` — clears DB (throws on error), then dispatches

**Rule:** The reducer is a pure function with no storage calls. It receives data in the action payload; it never fetches.

### Storage layer (`src/utils/storage.js`)

All functions are **async** (Supabase DB). Error handling contract:
- `saveTournament(data)` — upsert by `data.meta.id`; logs error but does **not** throw (auto-save must not crash the app)
- `loadTournament(id)` → full tournament object or `null` (returns null on error or not found)
- `loadAllTournaments()` → array sorted by `created_at DESC` (returns `[]` on error)
- `deleteTournament(id)` — **throws** on error (so asyncDispatch does not dispatch if DB failed)
- `clearAllTournaments()` — **throws** on error (same reason)

### Admin auth (`src/utils/adminStorage.js`)

Supabase Auth (email + password). Single admin account.
- `hasAdmin()` → uses `.maybeSingle()` (no error if row not found); **throws** on actual DB errors
- `saveAdmin(email, password)` → `signUp` + sets `admin_created` flag; **throws** on either step failing
- `verifyAdmin(email, password)` → returns `true/false` (does not throw)
- `signOutAdmin()` → `supabase.auth.signOut()`

**`requireAdmin(action)`** pattern (in `AdminContext`): if already logged in → executes `action()` immediately; if not → queues it as `pending`, opens modal → `onSuccess()` closes modal and runs the queued action.

### Auto-save pattern

`App.jsx` watches `state.tournament` via `useEffect`. Whenever it changes (GENERATE_BRACKET, RESHUFFLE, SUBMIT_RESULT, EDIT_RESULT, UPDATE_SCHEDULE, RESET_BRACKET, etc.), `saveTournament()` is called automatically. No need to call `saveTournament` after dispatching these actions.

Exception: `Home.jsx`'s `LevelPanel` manages its own local `tournament` state and calls `saveTournament` directly for notice add/delete and bracket reset within the panel.

### Share URL (`src/utils/shareUtils.js`)

Tournament data is LZString-compressed and embedded in the `?t=` query parameter. On app init, `readShareParam()` checks for a shared tournament, saves it to Supabase, then clears the URL param. `buildShareUrl(tournament)` generates the share link.

### Screen navigation

`state.currentScreen` is one of `SCREENS.*` (`home | setup | draw | matchplay | dashboard`).

- Use `asyncDispatch({ type: ACTIONS.BACK_TO_HOME })` to go home (reloads list from DB).
- Use `asyncDispatch({ type: ACTIONS.SELECT_TOURNAMENT, payload: { id, targetScreen? } })` to open a tournament.
- `targetScreen` auto-detects as DRAW / MATCH_PLAY / DASHBOARD based on tournament state if omitted.

### Bracket generation (`src/utils/tournament.js`)

- Bracket size = next power of 2 ≥ team count
- `generateBracket(teams, seed)` → `{ rounds, bracketSize, byeCount }` — `fisherYatesShuffle` for reproducible randomness
- `submitMatchResult(rounds, matchId, homeScore, awayScore)` → new rounds array with winner propagated to next slot (`Math.floor(matchIdx / 2)`, home if even, away if odd)

### Tournament data shape

```js
{
  meta: { id, schoolLevel, sport, totalTeams, bracketSize, byeCount, createdAt, seed, status },
  teams: string[],
  bracket: { rounds: Round[] },
  notices: Notice[],
  history: ReshuffleEntry[],
}
Round: { roundNum, name, matches: Match[] }
Match: { id, home, away, homeScore, awayScore, winner, isBye, date, time, venue, status, completedAt }
```

`meta.id` format: `tournament_${seed}` (e.g. `tournament_1714000000000`).

`makeSummary(t)` in `reducer.js` produces a lightweight summary object used in `tournamentList` state (avoids loading full bracket data for list views).

### Constants (`src/constants/index.js`)

- `SCHOOL_LEVELS` = `['중등', '고등']`
- `SPORT_NAME` = `'농구'` (single sport; change here to support others)
- `MIN_TEAMS` = 2, `MAX_TEAMS` = 64, `MAX_TEAM_NAME_LENGTH` = 20
- `MATCH_STATUS`: `scheduled | bye | done`

### Dark mode

Tailwind v4 class-based dark mode via `@custom-variant dark (&:where(.dark, .dark *))` in `index.css`. The `.dark` class is toggled on `<html>` by `App.jsx`. Always use `dark:` Tailwind variants — never `@media (prefers-color-scheme)` directly.

### Bracket download (`src/components/ui/DownloadMenu.jsx`)

`dom-to-image-more` + jsPDF are **dynamically imported** (lazy-loaded) on first use. Note: jsPDF bundles `html2canvas` as an optional dependency (~200 kB chunk) — this is unavoidable without replacing jsPDF.

### Key files

| File | Role |
|---|---|
| `src/lib/supabase.js` | Supabase client (singleton); logs error if env vars missing |
| `src/store/reducer.js` | Pure reducer; exports `makeSummary()` |
| `src/store/actions.js` | Action type constants |
| `src/constants/index.js` | `SCREENS`, `MATCH_STATUS`, limits, sport name, school levels |
| `src/components/Home.jsx` | Main dashboard — level tabs + sub-tabs (현황/학교조회/대진표/결과피드/공지) |
| `src/components/Draw.jsx` | Bracket view + schedule input + download |
| `src/components/MatchPlay.jsx` | Admin-only match result entry |
| `src/components/Dashboard.jsx` | Final rankings and stats |
| `src/components/ui/BracketTree.jsx` | Pure bracket rendering; uses `.bracket-*` CSS classes from `index.css` |
| `src/components/GlobalBar.jsx` | Fixed bottom-right bar: theme toggle + admin status |
| `src/utils/shareUtils.js` | LZString URL encoding/decoding for share links |
