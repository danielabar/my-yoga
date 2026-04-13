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
 *       { "id": "...", "name": "...", "holdSeconds": 15, "breath": "slow", "speech": "..." },
 *       ...
 *     ]
 *   }
 *
 * `holdSeconds` is the number of seconds to hold the pose *after* speech ends.
 * The old `duration` field is no longer accepted — see docs/sequence-format.md.
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
  if (pose && typeof pose === "object" && "duration" in pose) {
    throw new Error(
      `Pose at index ${index} uses the old 'duration' field — rename it to 'holdSeconds' (seconds to hold after speech ends)`,
    );
  }
  const required = ["id", "name", "holdSeconds", "breath", "speech"];
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
  if (typeof pose.holdSeconds !== "number" || pose.holdSeconds <= 0 || !Number.isFinite(pose.holdSeconds)) {
    throw new Error(`Pose '${pose.id}' has invalid 'holdSeconds' — must be a positive number`);
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
