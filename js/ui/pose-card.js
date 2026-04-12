/**
 * Pose card DOM updater.
 */

/**
 * Render a pose into the card elements.
 *
 * @param {object} els — element refs { card, label, name, instruction, timer, upNext, upNextName }
 * @param {object} pose — the current pose object
 * @param {number} step — zero-based step index
 * @param {number} total — total number of poses in the sequence
 * @param {object|null} nextPose — the next pose, or null if this is the last
 */
export function renderPoseCard(els, pose, step, total, nextPose) {
  els.card.style.display = "";
  els.label.textContent = `${step + 1} of ${total}`;
  els.name.textContent = pose.name;
  els.instruction.textContent = "";
  els.timer.textContent =
    pose.duration >= 60
      ? `${Math.round(pose.duration / 60)} min`
      : `${pose.duration} sec`;

  if (nextPose) {
    els.upNext.style.display = "";
    els.upNextName.textContent = nextPose.name;
  } else {
    els.upNext.style.display = "none";
  }
}

/**
 * Hide the pose card and up-next bar.
 */
export function clearPoseCard(els) {
  els.card.style.display = "none";
  els.upNext.style.display = "none";
}
