/**
 * Session orchestrator.
 *
 * Wires together: wake-lock, voice, breath-circle, pose-card, progress.
 * All state lives inside the startSession closure — no module-level lets.
 *
 * Usage:
 *   const { stop } = startSession({ sequence, els, totalDuration, onDone });
 *   // user taps Stop → await stop()
 *
 * Design: scratch/refactor-plan/05-migration-plan.md §5e
 * Wake-lock integration: scratch/refactor-plan/02-wake-lock-investigation.md
 */

import { acquire as acquireWakeLock, release as releaseWakeLock } from "./wake-lock.js";
import { speak, cancel as cancelVoice } from "./voice.js";
import { startBreathCycle, stopBreathCycle } from "./ui/breath-circle.js";
import { renderPoseCard, clearPoseCard } from "./ui/pose-card.js";
import { updateProgress } from "./ui/progress.js";

/**
 * Start a practice session.
 *
 * @param {object} opts
 * @param {Array} opts.sequence — the poses array
 * @param {object} opts.els — DOM element refs (see practice view for shape)
 * @param {number} opts.totalDuration — sum of all pose durations in seconds
 * @param {object} opts.voiceOpts — { voice, rate, pitch } for speech
 * @param {function} opts.onDone — called with { completed: boolean } when session ends
 * @param {number} [opts.startIndex=0] — which pose to begin at
 * @returns {{ stop: () => Promise<void> }}
 */
export function startSession({ sequence, els, totalDuration, voiceOpts, onDone, startIndex = 0 }) {
  let aborted = false;
  let stepTimer = null;
  let totalElapsed = 0;

  acquireWakeLock(); // fire-and-forget — user already tapped Begin

  async function finish(completed) {
    if (aborted) return;
    aborted = true;
    cleanup();
    await releaseWakeLock();
    onDone({ completed });
  }

  function cleanup() {
    clearInterval(stepTimer);
    stepTimer = null;
    cancelVoice();
    stopBreathCycle(els.breathCircle);
  }

  async function runStep(step) {
    if (aborted) return;
    const pose = sequence[step];
    const nextPose = step < sequence.length - 1 ? sequence[step + 1] : null;

    renderPoseCard(els.poseCard, pose, step, sequence.length, nextPose);
    startBreathCycle(els.breathCircle, pose.breath);

    await speak(pose.speech, voiceOpts);
    if (aborted) return;

    // Hold timer: wait the full duration. Speech time counts toward it, but
    // we ensure at least a few seconds of breathing after speech ends.
    let waited = 0;
    const holdTime = Math.max(pose.duration * 1000, 5000);

    await new Promise((resolve) => {
      stepTimer = setInterval(() => {
        if (aborted) {
          clearInterval(stepTimer);
          resolve();
          return;
        }
        waited += 500;
        totalElapsed += 0.5;
        updateProgress(els.progress, totalElapsed, totalDuration);
        if (waited >= holdTime) {
          clearInterval(stepTimer);
          resolve();
        }
      }, 500);
    });
  }

  async function run() {
    for (let i = startIndex; i < sequence.length; i++) {
      if (aborted) break;
      await runStep(i);
    }
    if (!aborted) {
      await finish(true);
    }
  }

  run();

  return {
    async stop() {
      if (aborted) return;
      aborted = true;
      cleanup();
      await releaseWakeLock();
      onDone({ completed: false });
    },
  };
}
