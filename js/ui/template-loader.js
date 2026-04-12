/**
 * Generic template fetch + cache utility.
 * Copied from charitable-tax-credit-calculator-canada/js/ui/template-loader.js
 */

const cache = new Map();

/**
 * Fetch an HTML template file and cache it.
 * @param {string} path - Path to HTML file relative to site root
 * @returns {Promise<string>} HTML string
 */
export async function loadTemplate(path) {
  if (cache.has(path)) return cache.get(path);

  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load template: ${path}`);
  const html = await res.text();
  cache.set(path, html);
  return html;
}
