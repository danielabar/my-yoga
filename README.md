# My Yoga

A quiet, guided evening yoga practice — vanilla HTML, CSS, and JavaScript. No framework, no bundler, no build step.

Live at **https://danielabar.github.io/my-yoga/**

## What it is

A single guided sequence of gentle stretches and mindful breathing designed to close your day. The app speaks each pose aloud using the browser's speech synthesis, shows a breath-circle animation, and keeps the screen awake so you can set your phone down and follow along.

**Evening unwinding only.** Forward folds, supine twists, hip openers, bound angle, neck rolls, Cat-Cow, Child's Pose, body scan. No standing poses, no Warriors, no core work, no Sun Salutations — anything that elevates heart rate is out of scope by design. There are a thousand apps for that; this one is for people who already train and want yoga purely for stretching, mindfulness, and relaxation.

## Running locally

```bash
npm install
npm run dev
```

Opens a local server at `http://localhost:3000`.

The screen-wake feature requires a **secure context** (HTTPS or `localhost`). It won't work over `file://` or plain HTTP.

## Testing

[Playwright](https://playwright.dev/) is the single test runner for both unit and e2e tests.

```bash
npm test              # unit + e2e (the CI command)
npm run test:unit     # unit tests only
npm run test:e2e      # e2e tests only (Gherkin/BDD via playwright-bdd)
```

Unit tests (`tests/unit/`) run in Node — pure function imports, no browser. E2E tests (`tests/e2e/`) use playwright-bdd with Gherkin features against `http://localhost:3000` (Playwright's `webServer` config starts the server automatically).

## Deploying

Deployment is automated via GitHub Actions:

- **CI** (`.github/workflows/ci.yml`) — runs all tests on pull requests to `main`.
- **CD** (`.github/workflows/cd.yml`) — runs all tests, then deploys to GitHub Pages on push to `main`.

The deploy uses `actions/deploy-pages` (not a `gh-pages` branch). GitHub Pages must be configured with **Source: GitHub Actions** in the repo settings.

No build step — the repo root is deployed as-is.

## Project structure

```
index.html                        app shell (<header>, <nav>, <main>)
js/
  app.js                          entry point (boots wake-lock + router)
  router.js                       pushState SPA router (/ → practice, /about → about)
  session.js                      session orchestrator (wake-lock, voice, UI)
  wake-lock.js                    screen wake lock manager
  voice.js                        speechSynthesis wrapper
  settings.js                     persisted user settings (voice, rate, pitch)
  format-time.js                  M:SS time formatter
  sequence-loader.js              fetch + validate sequence JSON
  base-path.js                    auto-detect GitHub Pages subpath
  ui/
    template-loader.js            fetch + cache view templates
    breath-circle.js              breath animation driver
    pose-card.js                  current-pose card renderer
    progress.js                   progress bar + time display
views/
  practice/                       main yoga session screen
    template.html
    script.js
  about/                          about page
    template.html
    script.js
css/
  index.css                       import manifest (load order)
  global.css                      layer declaration + design tokens
  colors.css                      OKLCH color primitives + semantic tokens
  reset.css, base.css             browser reset + base element styles
  layout.css, nav.css             page layout + navigation
  buttons.css, breath-circle.css  component styles
  pose-card.css, progress.css
  practice.css, about.css
  settings.css, utilities.css
config/
  sequences/evening.json          the 27-pose evening sequence
fonts/                            self-hosted Cormorant Garamond + Nunito
tests/
  unit/                           pure-function unit tests
  e2e/                            Gherkin features + step definitions
docs/                             architecture, CSS, sequence format
```

## Documentation

- [Architecture](docs/architecture.md) — views, session lifecycle, modules, wake-lock design
- [CSS architecture](docs/css-architecture.md) — layers, color system, design tokens
- [Sequence format](docs/sequence-format.md) — JSON schema for pose sequences

## License

MIT — see [`LICENSE.txt`](./LICENSE.txt).
