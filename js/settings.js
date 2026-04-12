/**
 * Persisted settings module.
 *
 * One key in localStorage, one JSON blob, validation on every read.
 * Degrades to in-memory-only when storage is unavailable (Safari
 * private browsing, quota errors).
 *
 * Design: scratch/refactor-plan/05-migration-plan.md §7c
 */

const STORAGE_KEY = "myYoga:settings:v1";

const SCHEMA = {
  voiceURI: {
    default: null,
    validate: (v) => (typeof v === "string" && v.length > 0 ? v : undefined),
  },
  rate: {
    default: 0.85,
    validate: (v) =>
      typeof v === "number" && v >= 0.5 && v <= 1.5 ? v : undefined,
  },
  pitch: {
    default: 1.0,
    validate: (v) =>
      typeof v === "number" && v >= 0.5 && v <= 1.5 ? v : undefined,
  },
};

let cache = null;

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRaw(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // Storage unavailable — in-memory cache still works for this session.
  }
}

function hydrate() {
  const raw = readRaw();
  const out = {};
  for (const [key, spec] of Object.entries(SCHEMA)) {
    const validated = spec.validate(raw[key]);
    out[key] = validated !== undefined ? validated : spec.default;
  }
  cache = out;
}

export function get(key) {
  if (cache === null) hydrate();
  return cache[key];
}

export function getAll() {
  if (cache === null) hydrate();
  return { ...cache };
}

export function set(key, value) {
  if (cache === null) hydrate();
  if (!(key in SCHEMA)) return;
  const validated = SCHEMA[key].validate(value);
  cache[key] = validated !== undefined ? validated : SCHEMA[key].default;
  writeRaw(cache);
}

export function reset() {
  cache = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore — cache is already cleared.
  }
}
