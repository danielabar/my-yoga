/**
 * Auto-detect the base path from this module's actual URL.
 * Works because this file always lives at <base>/js/base-path.js
 *
 * Local dev:     http://localhost:3000/js/base-path.js      → basePath = /
 * GitHub Pages:  https://x.github.io/my-yoga/js/base-path.js → basePath = /my-yoga/
 * Custom domain: https://example.com/js/base-path.js        → basePath = /
 *
 * Copied verbatim from charitable-tax-credit-calculator-canada/js/base-path.js
 * per scratch/refactor-plan/05-migration-plan.md §5a.
 */
const moduleDir = new URL(".", import.meta.url).pathname;
export const basePath = moduleDir.replace(/js\/$/, "");
