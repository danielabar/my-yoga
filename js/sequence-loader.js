/**
 * Sequence loader: fetches a sequence JSON file and validates its shape.
 *
 * This is the single point where the contract between `config/sequences/*.json`
 * and the session runner is enforced. The runner downstream can assume every
 * pose has the fields it expects because `parseSequence` either returns a
 * valid object or throws.
 *
 * A sequence JSON file looks like:
 *   {
 *     "title": "Evening Gentle Yoga",
 *     "subtitle": "stretching & breathing · ~16 minutes",
 *     "poses": [
 *       { "id": "...", "name": "...", "duration": 20, "breath": "slow", "speech": "..." },
 *       ...
 *     ]
 *   }
 *
 * Note on `duration` vs `holdSeconds`:
 * The migration plan §7a decides to rename `duration` → `holdSeconds` with a
 * cleaner semantic ("hold this many seconds *after* speech ends"). Phase 5a
 * keeps the old `duration` field because the existing evening.json uses it
 * and 7a is where the rename + retuning happens together. The validator here
 * intentionally accepts `duration` for now; when 7a lands, flip the required
 * field name.
 */

const VALID_BREATHS = new Set(["slow", "guided", "natural"]);

/**
 * Validate and normalize a parsed sequence object.
 *
 * @param {unknown} raw - The parsed JSON (not a string — already JSON.parse'd)
 * @returns {{title: string, subtitle: string, poses: Array<object>}}
 * @throws {Error} with a descriptive message if the shape is invalid
 */
export function parseSequence(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Sequence must be a JSON object");
  }

  const title = typeof raw.title === "string" ? raw.title : "";
  const subtitle = typeof raw.subtitle === "string" ? raw.subtitle : "";

  if (!Array.isArray(raw.poses)) {
    throw new Error("Sequence is missing 'poses' array");
  }
  if (raw.poses.length === 0) {
    throw new Error("Sequence has an empty 'poses' array");
  }

  const poses = raw.poses.map((pose, i) => validatePose(pose, i));

  return { title, subtitle, poses };
}

function validatePose(pose, index) {
  if (!pose || typeof pose !== "object") {
    throw new Error(`Pose at index ${index} is not an object`);
  }
  const required = ["id", "name", "duration", "breath", "speech"];
  for (const field of required) {
    if (!(field in pose)) {
      throw new Error(`Pose at index ${index} is missing '${field}'`);
    }
  }
  if (typeof pose.id !== "string" || pose.id.length === 0) {
    throw new Error(`Pose at index ${index} has invalid 'id'`);
  }
  if (typeof pose.name !== "string" || pose.name.length === 0) {
    throw new Error(`Pose at index ${index} (id=${pose.id}) has invalid 'name'`);
  }
  if (typeof pose.duration !== "number" || pose.duration <= 0 || !Number.isFinite(pose.duration)) {
    throw new Error(`Pose '${pose.id}' has invalid 'duration' — must be a positive number`);
  }
  if (typeof pose.breath !== "string" || !VALID_BREATHS.has(pose.breath)) {
    throw new Error(`Pose '${pose.id}' has invalid 'breath' — must be one of: ${[...VALID_BREATHS].join(", ")}`);
  }
  if (typeof pose.speech !== "string" || pose.speech.length === 0) {
    throw new Error(`Pose '${pose.id}' has invalid 'speech' — must be a non-empty string`);
  }
  return pose;
}

/**
 * Fetch a sequence JSON file from `url` and return the parsed + validated
 * sequence object. Rejects with a descriptive error on fetch failure or
 * schema violation.
 */
export async function loadSequence(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load sequence from ${url}: HTTP ${res.status}`);
  }
  const json = await res.json();
  return parseSequence(json);
}
