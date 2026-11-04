# AGENTS.md

OakScriptJS: Pine Script v6-compatible technical analysis and a script API (`oakscriptjs/script`) for writing
indicators and strategies in JavaScript. No runtime dependencies.

**Writing scripts with this library** (indicators, strategies, ports from Pine Script v6): read
[skills/oakscript/SKILL.md](skills/oakscript/SKILL.md). It ships in the npm package, so it matches the
installed version under `node_modules/oakscriptjs/skills/oakscript/`.

The rest of this file is for working on the library itself.

## Layout

- `src/script/index.ts`: the script API (`executeScript`, `indicator`, `strategy`, `input`, `plot`..., `eachBar`,
  `request.security`, the context-bound `ta`). `src/script/globals.ts`: the types of the script globals
  (`oakscriptjs/script/globals`, for type-checking scripts); a new value export of the script API goes there too
  (`tests/skills/typecheck.test.ts` checks it).
- `src/runtime/series.ts`: `Series` and `BarData`. `src/ta-series.ts`: Series wrappers of `src/ta/index.ts`
  (array functions, `taCore`).
- `src/<namespace>/`: `math`, `array`, `matrix`, `map`, `str`, `color`, `time`, `timeframe`, `line`, `label`,
  `box`, `linefill`, `polyline`, `table`, `chartpoint`, `compare`, `callsite`, `session`, `security`, `strategy`
  (types of the order engine interface).
- `tests/<namespace>/`: jest tests (ts-jest). `tests/skills/`: runs the guide's examples and code blocks.
- `docs/guide.md`, `docs/inventory.md`: user guide and coverage of the Pine Script v6 functions.
- `skills/oakscript/`: the agent guide (`SKILL.md`, `reference/`, `examples/`).

## Commands

```bash
npm ci
npm run build       # dist/esm + dist/cjs
npm test            # jest, all suites (includes tests/skills)
npm run lint        # eslint src
npm run typecheck   # tsc --noEmit
npm run check:package
```

CI (`.github/workflows/ci.yml`) runs build, check:package, test and typecheck on every push to main. Publishing
runs only on a `v*` tag (`.github/workflows/publish.yml`).

## Conventions

- TypeScript strict, ESM: relative imports in `src` end in `.js`.
- Names, argument order, defaults and results follow Pine Script v6; tests compare with values measured on Pine
  Script. A deliberate difference is written in the JSDoc and in `docs/guide.md`.
- A new or changed function: tests in `tests/<namespace>/`, then `docs/inventory.md`, `docs/guide.md` and, when it
  changes how scripts are written, `skills/oakscript/`.
- Examples in `skills/oakscript/` are real code: `examples/*.js` and every ```js block of the guide run in
  `tests/skills/examples.test.ts`. Keep them passing when the API changes.
- Releases: version in `package.json`, `CHANGELOG.md`, then a `v*` tag.
