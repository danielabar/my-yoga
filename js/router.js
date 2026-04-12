/**
 * Minimal SPA router for two routes.
 * Uses pushState/popstate, template-loader caching, and view init/destroy lifecycle.
 * Base path is auto-detected — works on localhost, GitHub Pages, or any host.
 *
 * Adapted from charitable-tax-credit-calculator-canada/js/router.js.
 */

import { basePath } from "./base-path.js";
import { loadTemplate } from "./ui/template-loader.js";

const routes = {
  "/": "practice",
  "/about": "about",
};

let currentView = null;
let currentRoute = null;

function normalizePath(fullPath) {
  let path = fullPath.split("?")[0].split("#")[0];

  if (basePath !== "/" && path.startsWith(basePath)) {
    path = path.slice(basePath.length - 1);
  }

  if (!path.startsWith("/")) path = "/" + path;
  if (path !== "/" && path.endsWith("/")) path = path.slice(0, -1);

  return path;
}

function buildFullPath(routePath) {
  if (basePath === "/") return routePath;
  return basePath.replace(/\/$/, "") + routePath;
}

async function navigate(routePath, { pushState = true, force = false } = {}) {
  if (routePath === currentRoute && !force) return;

  const viewDir = routes[routePath];
  if (!viewDir) {
    navigate("/", { pushState });
    return;
  }

  if (pushState) {
    history.pushState({ route: routePath }, "", buildFullPath(routePath));
  }

  document.querySelectorAll("[data-route]").forEach((link) => {
    link.classList.toggle(
      "active",
      link.getAttribute("data-route") === routePath,
    );
  });

  currentRoute = routePath;

  if (currentView?.destroy) {
    await currentView.destroy();
  }
  const contentEl = document.getElementById("content");
  contentEl.innerHTML = "";

  const html = await loadTemplate(`views/${viewDir}/template.html`);
  const viewModule = await import(`../views/${viewDir}/script.js`);
  currentView = viewModule;

  if (viewModule.init) {
    await viewModule.init(contentEl, html);
  }

  contentEl.setAttribute("data-view", viewDir);
}

function start() {
  window.addEventListener("popstate", () => {
    const routePath = normalizePath(location.pathname);
    navigate(routePath, { pushState: false });
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-route]");
    if (!link) return;
    event.preventDefault();
    const route = link.getAttribute("data-route");
    navigate(route, { force: link.classList.contains("logo") });
  });

  const routePath = normalizePath(location.pathname);
  navigate(routePath, { pushState: false });

  history.replaceState({ route: routePath }, "", location.href);
}

export { start, navigate, normalizePath, buildFullPath, basePath };
