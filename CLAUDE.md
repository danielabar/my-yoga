# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`index.html` is a self-contained guided evening yoga app — a single static HTML file with inline CSS and JavaScript. There is no build system, package manager, or dependency install step.

## Running it

- Open `index.html` directly in a browser, or serve the directory with any static server (e.g. `python3 -m http.server`).
- The Wake Lock API requires **HTTPS** (or `localhost`); over `file://` or plain HTTP it silently falls back to a zero-gain Web Audio loop to keep the screen awake. Test both paths when touching wake-lock code.
- Browser `speechSynthesis` is used for narration — voices load asynchronously via `synth.onvoiceschanged`, and available voices differ per browser/OS.

## Architecture

Everything lives in `index.html`. The important structure:

1. **`sequence` array** (~line 490): the ordered list of pose objects, each `{ name, duration, speech, breath }`. `duration` is seconds; `breath` is one of `"slow" | "guided" | "natural"`. Editing the practice = editing this array. Left/right sides are **separate steps** with equal timing — keep that symmetry when adding poses.
2. **Sequence runner** (`runStep` / `runSequence`): async loop that, for each pose, shows the card, starts the breath animation, `await`s `speak(pose.speech)`, then waits out the remaining hold time. The actual hold is `Math.max(pose.duration * 1000, 5000)` — so `duration` is effectively a floor for the *entire* step including narration, not an additional hold after speech. Keep this in mind when tuning timings.
3. **Transport state**: `isRunning` / `isPaused` / `currentStep` / `stepTimer`. Pause works by gating the interval tick and calling `synth.pause()` / `synth.resume()`; the `checkDone` interval in `runStep` also honors `isPaused`.
4. **Wake Lock** (`acquireWakeLock` / `releaseWakeLock`): tries `navigator.wakeLock.request('screen')` first, falls back to a silent looping `AudioBufferSourceNode` through a zero-gain node. A `visibilitychange` listener re-acquires the lock when the tab becomes visible again mid-session.
5. **UI views**: `idleView`, `poseCard` + `upNext`, and `completedView` are toggled via inline `style.display`. `buildPreview()` populates the idle-view sequence list from the `sequence` array at load time.

## Conventions

- Single file. Do not split into separate JS/CSS files unless explicitly asked — the all-in-one layout is intentional (trivial to host, email, or open offline).
- Inline CSS uses CSS variables defined in `:root` (`--bg-deep`, `--accent-warm`, etc.). Prefer these over hard-coded colors.
- No framework, no bundler, no tests. Changes are verified by opening the file in a browser.
