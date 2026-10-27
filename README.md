# Arise

A fitness tracker that runs your training block like an RPG. You set a goal weight
and a date. Each day brings **quests** (steps, water, the day's workout). Clearing
them earns EXP, levels and ranks (E → S). Skip them and a **penalty quest** waits
for you at midnight. Weight milestones along the way are **Gates** you have to clear.

Built with Expo SDK 57, React Native, TypeScript and Expo Router, from a high-fidelity
design handoff.

## Features

- **Status:** level, rank, EXP bar, STR/AGI/VIT/END stats, and a countdown to D-Day
  with an on-pace / behind indicator computed from your weigh-ins.
- **Daily quests:** step goal synced from Apple Health, water logging, and the
  scheduled workout. A full clear earns bonus EXP. A 21:00 reminder fires while
  quests are still open.
- **Train:** a structured multi-day plan (supersets, warm-ups, stretches) with a set
  logger that pre-fills from your previous session for each exercise.
- **Calendar and streaks:** completed, missed and penalty days at a glance.
- **Weight Gates and progress:** weekly check-ins with progress photos. Crossing each
  gate step (for example every 1 kg) clears a Gate.
- **Penalty system:** unfinished days roll into a midnight penalty quest (+2,000 steps).

## Engineering notes

- **The game rules are pure functions** in [`src/game/rules.ts`](src/game/rules.ts)
  (EXP, level curve, ranks, gates, penalties, pace, streaks), unit-tested in
  `src/game/__tests__`. Screens never compute game state themselves.
- **State** lives in a single Zustand store persisted to AsyncStorage
  (`src/store/useGame.ts`), with derived selectors kept separate in `derived.ts`.
- **Step sync on iOS** reads Apple Health first (the same deduplicated iPhone + Apple
  Watch total the Health app shows) and falls back to CoreMotion, resyncing on
  foreground and on HealthKit change notifications.
- **Custom config plugins** in `plugins/`: one backports Expo SDK 58's UIScene life
  cycle to SDK 57 (iOS 27 won't launch apps without it), and one strips the push
  entitlement so the app can be signed with a free Apple ID, since it only uses local
  notifications.

## Run it

```bash
npm install
npx expo run:ios     # dev build (HealthKit needs a native build, not Expo Go)
npm start            # Expo dev server for Android/web
npm test             # game-rule unit tests
npm run typecheck
npm run lint
```

## Layout

```
src/app/            Expo Router screens: (tabs)/ Status, Quests, Train, Calendar, D-Day;
                    pushed: checkin, progress, goal; full-screen: logger, complete
src/game/           rules.ts (pure game logic) + types + tests
src/store/          Zustand store and derived selectors
src/data/           workout plan, first-launch seed, exercise thumbnail map
src/hooks/          step sync, quest notifications, clock
src/components/     UI building blocks
src/theme/tokens.ts design tokens ("Nocturne")
plugins/            Expo config plugins
```

## Notes

- Exercise thumbnails aren't included. Add your own in `src/data/exerciseImages.ts`.
  Exercises without one show a placeholder.
- Rank perks are display-only for now. The EXP bonuses and harder targets aren't
  applied yet.

## License

MIT
