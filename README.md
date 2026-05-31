# make — personal todo app

A single-user Android todo app built with Expo (SDK 56) and Supabase. No auth —
it's built for one person. Tasks roll over day to day, recurring routines
generate automatically, and you get reminders, stats, and a kanban board.

## Features

- **Today dashboard** — today's tasks, quick-add, a daily motivational quote, and a done/total counter.
- **Recurring routines** — define daily or weekly (per-weekday) tasks that materialize automatically each day.
- **Rollover** — unfinished one-off tasks from past days bump to today on app open (and when the app returns to the foreground on a new day).
- **Kanban board** — today's tasks across To do / In progress / Done columns.
- **Reorder** — `↕` mode on Today to reorder tasks (persists `sort_order`).
- **Priority, notes, categories** — per task, with colored category tags.
- **Reminders** — local notifications at a task's reminder time (needs a native build, not Expo Go).
- **Search** — debounced search over task titles and notes across all dates.
- **Stats** — current streak, completion rate, and a 14-day completion chart.

## Tech stack

- **Expo SDK 56** + **expo-router** (file-based routing, `src/app`)
- **React Query** for data fetching/caching
- **Supabase** (Postgres) via `supabase-js` — the data layer is in `src/data` (typed repos + hooks) and `src/lib/supabase.ts`
- Plain `StyleSheet` + themed components (`src/components/themed-*`)

## Project layout

```
src/
  app/            screens (index=Today, board, routines, stats, search) + _layout
  components/     task-row, task-editor, routine-editor, themed-*, app-tabs
  data/           types, repos (Supabase queries), hooks (React Query), rollover
  lib/            supabase client, dates, quotes, stats, notifications, database.types
```

## Data model (Supabase, `public` schema)

- **categories** — `name`, `color`
- **routines** — recurring definitions: `recurrence` (`daily`/`weekly`), `weekdays[]`, `priority`, `category_id`, `reminder_time`, `active`
- **tasks** — concrete instances + ad-hoc: `title`, `notes`, `due_date`, `status` (`todo`/`doing`/`done`), `priority`, `category_id`, `routine_id`, `reminder_time`, `rolled_over_count`, `sort_order`

Two Postgres RPCs do the daily work idempotently:
- `rollover_tasks(p_today)` — bumps unfinished one-off tasks to today
- `generate_routine_tasks(p_date)` — creates today's instances for matching active routines

> RLS is **disabled** — this is a single-user app and the publishable key is
> public by design. Don't reuse this setup for a multi-user app.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` (gitignored) from the example:
   ```bash
   cp .env.example .env
   ```
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
   ```
3. Run in development (Expo Go — note: reminders won't fire in Expo Go):
   ```bash
   npm run android
   ```

## Build an APK (Expo cloud / EAS)

The build config lives in `eas.json` (the `preview` profile outputs an
installable APK; `production` outputs an AAB for the Play Store). The Supabase
env vars are baked into `eas.json`, so cloud builds don't need your local `.env`.

```bash
# one-time
npx eas-cli@latest login

# build the APK on Expo's servers (~10–20 min, prints a download link)
npx eas-cli@latest build -p android --profile preview
```

Install the resulting `.apk` on your phone (allow "install from unknown
sources"). This build includes native `expo-notifications`, so reminders work.

For a local build instead (needs Android SDK + Java):
```bash
npx eas-cli@latest build -p android --profile preview --local
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run android` | Start Metro + open on Android |
| `npm run lint` | ESLint (expo config) |
| `npx tsc --noEmit` | Type-check |

## Notes / known limitations

- **No widget yet** — the Android home-screen widget is not built (it needs `react-native-android-widget` + a dev build).
- **Reorder is tap-based (`▲▼`)**, not drag — chosen to avoid the Reanimated 4 compatibility risk on SDK 56.
- **Reminders** are local-only and require a native build (any EAS build above); they don't fire in Expo Go.
