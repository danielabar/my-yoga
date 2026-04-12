export function init(contentEl, html) {
  contentEl.innerHTML = html;
}

export function destroy() {
  // Static page — no cleanup needed.
}
