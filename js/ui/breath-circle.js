/**
 * Breath circle animation — inhale/exhale CSS class toggle on an interval.
 */

let breathInterval = null;

/**
 * Start a breath cycle on the given element.
 *
 * @param {HTMLElement} el - The .breath-circle element
 * @param {"slow"|"guided"|"natural"} pattern
 */
export function startBreathCycle(el, pattern) {
  stopBreathCycle(el);
  if (pattern === "natural") {
    el.textContent = "breathe";
    return;
  }
  let inhaling = true;
  function cycle() {
    if (inhaling) {
      el.className = "breath-circle breath-circle--inhale";
      el.textContent = "inhale";
    } else {
      el.className = "breath-circle breath-circle--exhale";
      el.textContent = "exhale";
    }
    inhaling = !inhaling;
  }
  cycle();
  breathInterval = setInterval(cycle, 4500);
}

/**
 * Stop the breath cycle and reset the element to its resting state.
 */
export function stopBreathCycle(el) {
  clearInterval(breathInterval);
  breathInterval = null;
  if (el) {
    el.className = "breath-circle";
    el.textContent = "breathe";
  }
}
