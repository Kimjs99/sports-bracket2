# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite, http://localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run lint       # ESLint check
```

No test suite exists in this project.

## Architecture

**Stack:** React 19 + Vite 8 + Tailwind CSS v4. No routing library — screens are rendered conditionally by a single `currentScreen` string in global state.

### State management

Two separate React contexts:

1. **`AppContext`** (`src/App.jsx`) — wraps `useReducer(reducer, initialState)`. All tournament data, screen navigation, and UI state live here. Consumed via `useContext(AppContext)` → `{ state, dispatch, importedLevel }`. `importedLevel` is set transiently (4 s) when a share-link tournament is imported on mount.

2. **`AdminContext`** (`src/contexts/AdminContext.jsx`) — auth-only state (isLoggedIn, username, modal open/close, pending action queue). Consumed via `useAdmin()` hook. Sits outside `AppContext` and wraps the whole app.

### Screen navigation

`state.currentScreen` is one of `SCREENS.*` (`home | setup | draw | matchplay | dashboard`). `App.jsx` renders the matching component with `{screen === SCREENS.X && <X />}`. Navigate by dispatching `SET_SCREEN` or `BACK_TO_HOME`.

`BACK_TO_HOME` clears `state.tournament`, reloads `tournamentList` from localStorage, and goes to `SCREENS.HOME`.

`SELECT_TOURNAMENT` loads a full tournament from localStorage into `state.tournament` and navigates to a target screen. Pass `targetScreen` in the payload to override auto-detection.

### Storage layer (`src/utils/storage.js`)

Multi-tournament localStorage structure:
- `tournament_ids_v2` — JSON array of tournament ID strings
- `tournament_data_{id}` — full tournament object per tournament

Key functions: `saveTournament`, `loadTournament(id)`, `loadAllTournaments()`, `deleteTournament(id)`, `migrateFromLegacy()` (runs once on mount to migrate old single-tournament format).

**Important:** `Home.jsx`'s `LevelPanel` loads tournaments **directly from localStorage** via `loadTournament(id)` — it does NOT use `state.tournament`. Screens like `Draw`, `MatchPlay`, and `Dashboard` DO use `state.tournament`. This is intentional: Home is a multi-tournament view.

As a consequence, notice add/delete operations in `Home.jsx` are handled locally (direct `saveTournament` + local state update), bypassing the reducer.

### Admin auth (`src/utils/adminStorage.js`)

Credentials stored in `localStorage` key `tournament_admin_v1` as `{ username, password }`. Single admin account only. `AdminContext` `isLoggedIn` state is **in-memory** — credentials persist across page reloads but the session does not (user must log in again after refresh).

**`requireAdmin(action)`** pattern: if already logged in → executes `action()` immediately; if not → stores it as `pending`, opens modal → `onSuccess()` closes modal and runs the stored action.

### Bracket generation (`src/utils/tournament.js`)

- Bracket size = next power of 2 ≥ team count
- Byes distributed with `distributeByes()` (interleaved even positions first)
- `generateBracket(teams, seed)` → `{ rounds, bracketSize, byeCount }` — uses `fisherYatesShuffle(teams, seed)` for reproducible randomness
- `submitMatchResult(rounds, matchId, homeScore, awayScore)` → new rounds array with winner propagated to the next round's slot (`Math.floor(matchIdx / 2)`, `home` if even, `away` if odd)

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

### Dark mode

Tailwind v4 class-based dark mode via `@custom-variant dark (&:where(.dark, .dark *))` in `index.css`. The `.dark` class is toggled on `<html>` by `App.jsx` based on `theme` state (`'light' | 'dark' | 'auto'`). Always use `dark:` Tailwind variants — never `@media (prefers-color-scheme)` directly.

### Bracket download (`src/components/ui/DownloadMenu.jsx`)

`dom-to-image-more` + jsPDF are **dynamically imported** (lazy-loaded) on first use. `captureBlob(element, type, quality)` uses `scale: 2` for retina quality and hardcodes `bgcolor` per theme (`#1e293b` dark / `#ffffff` light). Targets `.bracket-container` inside the ref, falling back to the ref itself.

### Share links (`src/utils/shareUtils.js`)

`buildShareUrl(tournament)` LZString-compresses the full tournament object into a `?t=` query param. On mount, `App.jsx` calls `readShareParam()` — if found, it saves the decoded tournament via `saveTournament` and removes the param from the URL with `clearShareParam()`, then shows a banner via `importedLevel` state for 4 s.

### Key files at a glance

| File | Role |
|---|---|
| `src/store/reducer.js` | All state transitions; `buildTournament()`, `makeSummary()` helpers |
| `src/store/actions.js` | Action type constants |
| `src/constants/index.js` | `SCREENS`, `MATCH_STATUS`, limits, sport name |
| `src/components/Home.jsx` | Main dashboard — level tabs + full sub-tabs (현황/학교조회/대진표/결과피드/공지) |
| `src/components/Draw.jsx` | Bracket view + schedule input + download |
| `src/components/MatchPlay.jsx` | Admin-only match result entry |
| `src/components/Dashboard.jsx` | Legacy per-tournament detailed view (still reachable via reducer auto-detection) |
| `src/components/ui/BracketTree.jsx` | Pure bracket SVG/CSS rendering; uses `.bracket-*` CSS classes from `index.css` |
| `src/components/GlobalBar.jsx` | Fixed bottom-right floating bar: theme toggle + admin status |
