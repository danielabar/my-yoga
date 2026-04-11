# My Yoga

A quiet, guided evening yoga practice. A single static web app — no tracking, no accounts, no ads, no third-party requests.

> **Status**: this repository is currently being refactored from a single-file prototype into a properly modular web app. The migration plan lives in `scratch/refactor-plan/` and is being executed in phases. The proper README (screenshots, full feature list, architecture overview, deployment notes) will be written in migration phase 8. For now this is a stub.

## Running locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

The screen-wake feature requires a **secure context** (HTTPS or `localhost`). It won't work over `file://` or plain HTTP.

## License

MIT — see [`LICENSE.txt`](./LICENSE.txt).
