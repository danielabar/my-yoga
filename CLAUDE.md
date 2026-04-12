# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A guided evening yoga web app — vanilla HTML, CSS, and JavaScript with no build system or bundler. Deployed to GitHub Pages via `actions/deploy-pages`.

## Running it

- `npm run dev` (or `npx serve . -l 3000`) to start a local server at `http://localhost:3000`.
- The Wake Lock API requires **HTTPS** (or `localhost`); over `file://` or plain HTTP it silently does nothing. See `js/wake-lock.js` and `scratch/refactor-plan/02-wake-lock-investigation.md`.
- Browser `speechSynthesis` is used for narration — voices load asynchronously via `synth.onvoiceschanged`, and available voices differ per browser/OS. See `js/voice.js`.

## Architecture

Mirrors `charitable-tax-credit-calculator-canada` (charity calc). Key directories:

- `index.html` — shell with `<header>`, `<nav>`, `<main id="content">`. All view content loaded dynamically.
- `js/` — ES modules. Entry point is `js/app.js` (loaded as `<script type="module">`).
  - `js/router.js` — pushState SPA router, two routes: `/` → practice, `/about` → about.
  - `js/session.js` — session orchestrator. `startSession()` returns `{ stop }`. All state in a closure.
  - `js/wake-lock.js` — wake lock manager with split intent (`wantsLock`) / sentinel (`lock`) state. Call `start()` once at boot to register browser listeners.
  - `js/voice.js` — speechSynthesis wrapper.
  - `js/format-time.js`, `js/sequence-loader.js`, `js/base-path.js` — pure helpers.
  - `js/ui/` — DOM mutators (template-loader, breath-circle, pose-card, progress). Not unit-tested; covered by e2e.
- `views/<name>/template.html` + `views/<name>/script.js` — view modules with `init(contentEl, html)` / `destroy()` lifecycle.
- `css/` — layered CSS (`@layer reset, base, components, utilities`). `css/index.css` is the import manifest. Colors use OKLCH primitives in `css/colors.css`.
- `config/sequences/evening.json` — the pose sequence data. Loaded via `js/sequence-loader.js`.
- `fonts/` — self-hosted Cormorant Garamond + Nunito (TTFs). Never load from Google Fonts CDN.

## Testing

- **Always run `npm test` before committing and pushing.** Tests must be green. Do not commit with failing tests.
- Test runner: Playwright, single runner, two projects (`unit` and `e2e-chromium`).
- Unit tests (`tests/unit/`): pure-Node imports, no browser. Test pure functions and API wrappers with stubbed globals.
- E2E tests (`tests/e2e/`): playwright-bdd with Gherkin features. Run against `http://localhost:3000` via `webServer` in `playwright.config.js`.
- Scripts: `npm run test:unit`, `npm run test:e2e`, `npm test` (both).

## Conventions

- Vanilla JS, no framework, no bundler.
- CSS uses `@layer` cascade and OKLCH color space. Prefer semantic tokens from `css/colors.css` over hard-coded colors.
- BEM-ish class naming (`.pose-card__label`, `.btn--primary`).
- Kebab-case file naming.
- Self-hosted fonts with `font-display: swap`.
- No Pause button (decided — see `scratch/refactor-plan/03-technical-decisions.md`).
- Wake lock is always on during sessions (no user toggle).
- Sequence loaded via `?sequence=<name>` URL param (defaults to `evening`).
