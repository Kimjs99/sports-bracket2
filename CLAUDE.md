# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite, http://localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run lint       # ESLint check
```

No test suite exists in this project. Deployment: push to `master` → GitHub Actions builds → GitHub Pages.

## Architecture

**Stack:** React 19 + Vite 8 + Tailwind CSS v4. No routing library — screens are rendered conditionally by a single `currentScreen` string in global state.

### State management

Two separate React contexts:

1. **`AppContext`** (`src/App.jsx`) — wraps `useReducer(reducer, initialState)`. All tournament data, screen navigation, and UI state live here. Consumed via `useContext(AppContext)` → `{ state, dispatch, asyncDispatch, importedLevel }`. `importedLevel` is set transiently (4 s) when a share-link tournament is imported on mount.

2. **`AdminContext`** (`src/contexts/AdminContext.jsx`) — auth-only state (isLoggedIn, username, modal open/close, pending action queue). Consumed via `useAdmin()` hook. Sits outside `AppContext` and wraps the whole app.

### Screen navigation

`state.currentScreen` is one of `SCREENS.*` (`home | setup | draw | matchplay | dashboard`). `App.jsx` renders the matching component with `{screen === SCREENS.X && <X />}`. Navigate by dispatching `SET_SCREEN` or `BACK_TO_HOME`.

`BACK_TO_HOME` and `SELECT_TOURNAMENT` are async — handled by `asyncDispatch` in `App.jsx`, which calls Supabase then falls back to localStorage before dispatching to the reducer.

### Storage layer (`src/utils/storage.js`)

**Dual storage:** localStorage is primary (always works), Supabase is secondary (best-effort cross-device sync).

- `saveTournament(data)` — saves to localStorage immediately, then fire-and-forgets to Supabase
- `loadAllTournaments()` — tries Supabase first (cross-device), falls back to localStorage
- `loadTournament(id)` — tries Supabase, falls back to localStorage

localStorage keys: `tournament_ids_v2` (ID array), `tournament_data_{id}` (full object per tournament).

**Supabase RLS on `tournaments` table:** SELECT is public (anon); INSERT/UPDATE/DELETE require an authenticated Supabase session. Unauthenticated saves silently fall back to localStorage only.

**Important:** `Home.jsx` loads tournaments directly from storage (not `state.tournament`). Screens `Draw`, `MatchPlay`, `Dashboard` use `state.tournament`. Notice add/delete in `Home.jsx` bypasses the reducer (direct `saveTournament` + local state).

### Admin auth (`src/utils/adminStorage.js`)

Uses **Supabase Auth** with a fixed synthetic email (`admin@school-bracket.app`) — **globally single admin account only** (attempting to create a second account returns `'ALREADY_EXISTS'`). Username is a display label stored in `user_metadata`.

- `hasAdmin()` — sync, checks `tournament_admin_created_v1` localStorage key
- `saveAdmin(username, password)` — `supabase.auth.signUp`; throws `'ALREADY_EXISTS'` if account exists
- `verifyAdmin(password)` — `supabase.auth.signInWithPassword`; returns boolean
- `signOutAdmin()` — `supabase.auth.signOut()` (keeps localStorage flag so `hasAdmin()` stays true)
- `subscribeAuth(callback)` — wraps `onAuthStateChange`; used in `AdminContext` to restore session on mount

**`requireAdmin(action)`** pattern: if already logged in → executes `action()` immediately; if not → stores it as `pending`, opens modal → `onSuccess()` closes modal and runs the stored action.

**`AdminLoginModal`** always defaults to the **login form** (`useState(false)`) regardless of the device's localStorage state. A toggle link at the bottom switches between login and account-creation modes. This ensures other devices (without the `tournament_admin_created_v1` localStorage key) can still log in.

**Single-tenant architecture:** The Supabase `tournaments` table has no `user_id`/`org_id` column — SELECT is public (anon) and returns all rows. All tournaments are visible to all users regardless of who created them. Multi-tenant isolation (per-organization data separation) is a planned future enhancement requiring: `org_id` column on the table, RLS policies scoped to the owner, and multi-account admin support.

### Tournament data shape

`gameFormat` is `'tournament'` | `'league'` | `'group_tournament'`. The bracket structure differs per format:

**tournament / league:**
```js
{
  meta: { id, schoolLevel, gender, sport, gameFormat, totalTeams, bracketSize, byeCount, createdAt, seed, status },
  teams: string[],
  bracket: { rounds: Round[] },
  notices: Notice[],
  history: ReshuffleEntry[],
}
```

**group_tournament** (auto-selected when league + 7+ teams):
```js
{
  meta: { ...same base fields..., groupCount, advancePerGroup, knockoutSize, phase: 'group'|'knockout' },
  teams: string[],   // original unshuffled order
  bracket: {
    groups: [{ id, name, teams: string[], rounds: Round[] }],
    knockout: null | { rounds: Round[] },
  },
  notices: Notice[],
  history: ReshuffleEntry[],
}
```

`Round: { roundNum, name, matches: Match[] }`
`Match: { id, home, away, homeScore, awayScore, winner, isBye, date, time, venue, status, completedAt }`

Match ID conventions: group matches = `gA_r1m1`, knockout matches = `kr1m1`.

### Game format logic

**tournament:** `submitMatchResult` propagates winner to the next round slot (`Math.floor(matchIdx / 2)`, home if even / away if odd).

**league (≤ 6 teams):** `submitLeagueResult` updates the match only (no propagation); draws allowed (`winner = null`). `calcLeagueStandings(teams, rounds)` sorts by pts → goal diff → goals for.

**group_tournament (≥ 7 teams, auto-upgraded from league):**
- `calcGroupConfig(teamCount)` — `advancing = nextPowerOfTwo(max(4, ceil(n/3)))`, `groupCount = advancing / 2`. Example: 15 teams → 4 groups → 8강.
- `generateGroupTournament(teams)` — uses `Math.random()` shuffle (not seeded) so each generation is truly random.
- `isGroupStageComplete(groups)` — all non-bye matches done.
- `buildKnockoutFromGroups(groups, advancePerGroup)` — cross-seeds advancing teams: `[A1, B2, C1, D2, B1, A2, D1, C2]` so same-group teams can only meet in the final.
- `submitGroupTournamentResult` — auto-calls `buildKnockoutFromGroups` after the last group match; editing any group match nulls out the entire knockout (standings may have changed).

Draw.jsx tab sets per format:
- tournament: `[대진표, 일정입력]`
- league: `[순위표, 경기일정, 일정입력]`
- group_tournament: `[조별 순위, 조별 경기, N강 대진(disabled until complete), 일정입력]`

MatchPlay.jsx:
- group_tournament: section tabs per group (draws allowed) + knockout section (draws forbidden), knockout auto-appears when group stage completes.
- tournament / league: round tabs.

Home.jsx (public dashboard) bracket tab:
- group_tournament → `GroupDashboardView`: standings + results per group card, knockout BracketTree when available.
- tournament / league → `BracketTree`.

`SELECT_TOURNAMENT` in reducer maps `group_tournament` back to `'league'` in `setupMeta` so the Setup UI shows the correct game format when editing.

### Constants (`src/constants/index.js`)

- `SCHOOL_LEVELS = ['초등', '중등', '고등']`
- `GENDER_TYPES = ['남성', '여성', '혼성']`
- `SPORTS` — 22 items including special sports (보치아, 슐런)
- `GAME_FORMATS` — `tournament`, `league`, `link` (link = disabled/준비 중)
- `MATCH_STATUS` — `scheduled`, `bye`, `done`

### Dark mode

Tailwind v4 class-based dark mode via `@custom-variant dark (&:where(.dark, .dark *))` in `index.css`. The `.dark` class is toggled on `<html>` by `App.jsx`. Always use `dark:` Tailwind variants — never `@media (prefers-color-scheme)` directly.

### Bracket download (`src/components/ui/DownloadMenu.jsx`)

`dom-to-image-more` + jsPDF are **dynamically imported** (lazy-loaded) on first use. `captureBlob(element, type, quality)` uses `scale: 2` and hardcodes `bgcolor` per theme (`#1e293b` dark / `#ffffff` light).

### Share links (`src/utils/shareUtils.js`)

`buildShareUrl(tournament)` LZString-compresses the full tournament object into a `?t=` query param. On mount, `App.jsx` calls `readShareParam()` — if found, saves via `saveTournament`, removes the param, and sets `importedLevel` for 4 s. Share links work for all formats including group_tournament because they compress the full object, not just the seed.

### Key files at a glance

| File | Role |
|---|---|
| `src/store/reducer.js` | All state transitions; `buildTournament()`, `makeSummary()` helpers |
| `src/store/actions.js` | Action type constants |
| `src/constants/index.js` | `SCREENS`, `MATCH_STATUS`, `SCHOOL_LEVELS`, `GENDER_TYPES`, `SPORTS`, `GAME_FORMATS` |
| `src/utils/tournament.js` | Bracket/league/group-tournament generation and result submission logic |
| `src/utils/shuffle.js` | `fisherYatesShuffle(array, seed)` using mulberry32 PRNG (used for tournament/league only) |
| `src/components/Home.jsx` | Public dashboard — level tabs, sport overview cards, group standings view |
| `src/components/Setup.jsx` | Tournament creation — school level, gender, sport, game format, team input, CSV/Excel upload |
| `src/components/Draw.jsx` | Admin bracket/league/group view + schedule input + reshuffle + download |
| `src/components/MatchPlay.jsx` | Admin-only match result entry; `GroupMatchPlay` + `StandardMatchPlay` |
| `src/components/ui/BracketTree.jsx` | Pure bracket rendering; uses `.bracket-*` CSS classes from `index.css` |
| `src/components/GlobalBar.jsx` | Fixed bottom-right floating bar: theme toggle + admin status |
| `src/lib/supabase.js` | Supabase client (reads `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) |
