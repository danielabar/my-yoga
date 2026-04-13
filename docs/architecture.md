# Architecture

How the app works — project structure, views, session lifecycle, modules, and the wake-lock design.

## Project structure

- `index.html` — app shell (header, nav, empty `<main id="content">`). All page content is loaded dynamically by the router.
- `js/` — ES modules. `app.js` is the entry point, loaded as `<script type="module">`.
- `js/ui/` — DOM mutator modules (template-loader, breath-circle, pose-card, progress).
- `views/` — one directory per page (`practice/`, `about/`), each with `template.html` + `script.js`.
- `config/sequences/` — pose sequence JSON files. See [sequence-format.md](sequence-format.md).
- `css/` — layered CSS files. See [css-architecture.md](css-architecture.md).
- `fonts/` — self-hosted Cormorant Garamond + Nunito (TTF).
- `tests/unit/` — pure-function unit tests (Playwright in Node).
- `tests/e2e/` — Gherkin features + step definitions (playwright-bdd in Chromium).

## How views work

A **view** is a page in the SPA. Each view lives in `views/<name>/` and has two files:

| File | Purpose |
|---|---|
| `template.html` | The HTML content for the page |
| `script.js` | A JS module with `init()` and `destroy()` lifecycle functions |

### Routing

The router (`js/router.js`) maps URL paths to view directories:

```js
const routes = {
  "/": "practice",
  "/about": "about",
};
```

When the user navigates:

1. The router calls `destroy()` on the current view (if any)
2. Clears `<main id="content">`
3. Fetches the new view's `template.html` (cached after first load)
4. Dynamically imports the view's `script.js` and calls `init(contentEl, html)`
5. The view inserts its content into the DOM
6. Sets `data-view` attribute on `#content` (used by e2e tests to detect navigation)

Navigation is triggered by clicking any element with a `data-route` attribute (e.g., `<a data-route="/about">`). The router intercepts clicks and uses `pushState` instead of full page loads.

### Base path

`js/base-path.js` auto-detects whether the app is served from the root (`/`) or a subdirectory (`/my-yoga/`). This makes the same code work on localhost and GitHub Pages without configuration.

### How to add a new view

1. Create `views/<name>/template.html` with the page HTML
2. Create `views/<name>/script.js` exporting `init(contentEl, html)` and `destroy()`
   - `init()` receives the content element and raw template HTML — it must insert the HTML into `contentEl` itself
3. Add the route to the `routes` object in `js/router.js`
4. Add a nav link with `data-route="/<name>"` in `index.html`

## Session lifecycle

The practice session is the core user flow. Understanding the module boundaries matters for making changes safely.

### Module roles

| Module | Responsibility | Side effects |
|---|---|---|
| `views/practice/script.js` | View lifecycle, DOM refs, wiring Begin/Stop, voice settings UI | DOM mutations, event listeners |
| `js/session.js` | Orchestrates a single practice run: acquire wake lock, speak each pose, drive breath + progress UI, release wake lock | Wake lock, speech synthesis, timers |
| `js/wake-lock.js` | Manage a single screen wake lock with intent/sentinel split | `navigator.wakeLock`, event listeners |
| `js/voice.js` | Wrap `speechSynthesis`: speak, cancel, voice enumeration | `speechSynthesis` |
| `js/settings.js` | Persist voice/rate/pitch to `localStorage` | `localStorage` |
| `js/ui/breath-circle.js` | Drive the CSS breath animation on the circle element | DOM class toggling |
| `js/ui/pose-card.js` | Render the current pose card (name, instruction, timer, up-next) | DOM mutations |
| `js/ui/progress.js` | Update the progress bar width and time display | DOM mutations |

### Flow

```
User taps Begin
    │
    ▼
practice/script.js
    ├── hides idle view, shows Stop button
    ├── builds getVoiceOpts() from current select/slider values
    └── calls startSession({ sequence, els, totalDuration, getVoiceOpts, onDone })
            │
            ▼
        session.js (inside the startSession closure)
            ├── acquireWakeLock()          ← fire-and-forget
            ├── for each pose:
            │     ├── renderPoseCard()
            │     ├── startBreathCycle()
            │     ├── await speak(text, getVoiceOpts())   ← reads LIVE settings
            │     └── hold for holdSeconds (500ms tick, updating progress)
            └── finish(completed: true)
                  ├── cancelVoice()
                  ├── stopBreathCycle()
                  ├── await releaseWakeLock()
                  └── onDone({ completed: true })
                          │
                          ▼
                    practice/script.js shows "Namaste" completed view
```

**Stopping mid-session**: the `stop()` function returned by `startSession` sets an `aborted` flag, cancels speech, stops the breath animation, releases the wake lock, and calls `onDone({ completed: false })` — which restores the idle view.

**Mid-session settings changes**: `getVoiceOpts` is a function (not a static object), so voice/rate/pitch changes made while a session is running take effect on the next pose. The settings UI stays accessible via a `<details>` disclosure during the session.

### startIndex seam

`startSession` accepts an optional `startIndex` parameter (defaults to 0). This is the seam for a future skip-to-pose feature — the URL `/?pose=<id>` would resolve to an index and pass it through. No UI for this exists yet.

## Wake-lock design

The wake lock module (`js/wake-lock.js`) keeps the phone screen on during practice. Its design is shaped by a specific bug in a predecessor project.

### The problem it solves

A previous app (`just-breathe`) used a single boolean to track wake lock state. After a session ended and `release()` was called, the `visibilitychange` handler would re-acquire the lock when the user returned to the tab — because the intent flag was never cleared. The phone's screen would stay on indefinitely until the user killed the app.

### The fix: split intent from sentinel

`wake-lock.js` tracks two pieces of state:

| Variable | Type | Meaning |
|---|---|---|
| `wantsLock` | boolean | Does the app *want* the screen to stay awake? Set by `acquire()` / `release()`. |
| `lock` | WakeLockSentinel or null | The actual OS-level lock. Set by `tryAcquire()`, cleared on release or by the OS. |

The `visibilitychange` handler only re-acquires if `wantsLock` is true. When `release()` is called at session end, it sets `wantsLock = false` first — so the handler correctly does nothing when the user later returns to the tab.

### Browser event listeners

Registered once by `start()` at app boot (called from `app.js`):

- **`visibilitychange`** — if the tab returns to visible AND `wantsLock` is true, re-acquire. The OS auto-releases wake locks when a tab is hidden; this re-acquires when the user comes back.
- **`pagehide`** — unconditionally release if held. This is the best chance to release cleanly before the tab is buried on iOS Safari.

### Why start() is separate from module evaluation

Unit tests import `wake-lock.js` in plain Node (no DOM). If the event listeners were registered at module-level, the import would crash. `start()` lets tests exercise `acquire`/`release`/`isHeld` without needing `document` or `window`.

## No Pause button

There is deliberately no Pause button. Safari's `speechSynthesis.pause()` is unreliable (it can silently drop the utterance), and the interaction model is simpler without it: tap Stop to end, or when skip-to-pose is built, resume from any pose. This is a settled design decision, not an oversight.

## Settings persistence

User preferences (voice, speech rate, pitch) are stored in `localStorage` under the key `myYoga:settings:v1`.

- **Namespaced**: the `myYoga:` prefix prevents collisions with other GitHub Pages apps on the same origin.
- **Versioned**: the `:v1` suffix allows a clean migration path if the schema changes.
- **Validated on read**: each field is checked against a schema with type, range, and default. Missing or invalid values silently fall back to defaults.
- **Graceful degradation**: all `localStorage` access is wrapped in try/catch. If storage is unavailable (Safari private browsing, quota errors), settings work in-memory for the current session.

`js/settings.js` owns the *shape* of settings. `js/voice.js` owns the *meaning* (e.g., whether a `voiceURI` maps to a real platform voice).

## Testing

### Design philosophy

Modules that are pure functions (format-time, sequence-loader, settings, voice, wake-lock) are tested in Node without a browser. DOM-driven behavior (navigation, practice flow) is tested through full-browser e2e tests.

### Unit tests

- Location: `tests/unit/`
- Runner: Playwright's test runner in Node.js mode
- Pattern: each module has its own `.spec.js` file
- Config is loaded from JSON files or globals are stubbed

### E2E tests

- Location: `tests/e2e/`
- Framework: Playwright + playwright-bdd (Gherkin/Cucumber)
- Features: `tests/e2e/features/*.feature`
- Steps: `tests/e2e/steps/*.js`

The BDD layer compiles `.feature` files into Playwright tests via `npx playwright-bdd`. E2E tests run against `http://localhost:3000` with Playwright's `webServer` config handling startup.

### How to add a new unit test

1. Create `tests/unit/<module-name>.spec.js`
2. Import the module under test
3. Use `test()` and `expect()` from `@playwright/test`
4. Run: `npx playwright test tests/unit/<module-name>.spec.js`

### How to add a new e2e scenario

1. Add a `Scenario:` block to the appropriate `.feature` file
2. Add step definitions in `tests/e2e/steps/` if the scenario uses new phrasing
3. Compile: `npx playwright-bdd`
4. Run: `npx playwright test tests/e2e/ -g "scenario name"`

## Common tasks

### "I want to add a new pose to the evening sequence"

Edit `config/sequences/evening.json`. See [sequence-format.md](sequence-format.md) for the field schema. `holdSeconds` is the hold time *after* speech finishes.

### "I want to add a new sequence"

1. Create `config/sequences/<name>.json` following the schema in [sequence-format.md](sequence-format.md)
2. Load it via `/?sequence=<name>` in the URL

The practice view reads the `?sequence` param and defaults to `evening`. No code changes needed for a new sequence — the architecture is already plural.

### "I want to add a new UI component"

1. Create the CSS in `css/<component>.css`, wrap styles in `@layer components { }`
2. Add `@import "<component>.css";` to `css/index.css` (before `utilities.css`)
3. Create the JS module in `js/ui/<component>.js` — export pure DOM-mutating functions
4. Import and call from the view that uses it
