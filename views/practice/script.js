/**
 * Practice view — the main yoga session screen.
 *
 * init() mounts the template, loads the sequence, wires Begin/Stop.
 * destroy() tears down any running session cleanly.
 */

import { basePath } from "../../js/base-path.js";
import { loadSequence } from "../../js/sequence-loader.js";
import { startSession } from "../../js/session.js";
import { formatTime } from "../../js/format-time.js";
import {
  loadVoices,
  getVoices,
  getAllVoices,
  pickDefaultVoice,
  onVoicesChanged,
  cancel as cancelVoice,
} from "../../js/voice.js";
import {
  get as getSetting,
  set as setSetting,
  reset as resetSettings,
} from "../../js/settings.js";

let activeSession = null;

/**
 * Build the idle-view sequence list from the poses array.
 */
function buildPreview(container, poses) {
  let html = "<h3>Sequence</h3>";
  for (const p of poses) {
    const mins = p.holdSeconds >= 60 ? `${Math.floor(p.holdSeconds / 60)}m` : "";
    const secs = p.holdSeconds % 60 > 0 ? `${p.holdSeconds % 60}s` : "";
    html += `<div class="pose-list-item"><span class="pose-list-item__name">${p.name}</span><span class="pose-list-item__dur">${mins}${mins && secs ? " " : ""}${secs}</span></div>`;
  }
  container.innerHTML = html;
}

/**
 * Populate the voice <select> with the available English voices,
 * then restore the persisted voice (if it still exists on this device).
 */
function populateVoiceSelect(selectEl, voiceList) {
  selectEl.innerHTML = "";
  const allVoices = getAllVoices();
  for (const v of voiceList) {
    const opt = document.createElement("option");
    opt.value = allVoices.indexOf(v);
    opt.textContent = `${v.name} (${v.lang})`;
    selectEl.appendChild(opt);
  }

  const savedURI = getSetting("voiceURI");
  const savedVoice = savedURI
    ? allVoices.find((v) => v.voiceURI === savedURI)
    : null;

  if (savedVoice) {
    selectEl.value = String(allVoices.indexOf(savedVoice));
  } else {
    const preferred = pickDefaultVoice(voiceList);
    if (preferred) {
      selectEl.value = String(allVoices.indexOf(preferred));
    }
    if (savedURI) setSetting("voiceURI", null);
  }
}

export async function init(contentEl, html) {
  contentEl.innerHTML = html;

  // Gather element refs
  const btnStart = document.getElementById("btnStart");
  const btnStop = document.getElementById("btnStop");
  const voiceSelect = document.getElementById("voiceSelect");
  const rateSlider = document.getElementById("rateSlider");
  const pitchSlider = document.getElementById("pitchSlider");

  const els = {
    breathCircle: document.getElementById("breathCircle"),
    poseCard: {
      card: document.getElementById("poseCard"),
      label: document.getElementById("poseLabel"),
      name: document.getElementById("poseName"),
      instruction: document.getElementById("poseInstruction"),
      timer: document.getElementById("poseTimer"),
      upNext: document.getElementById("upNext"),
      upNextName: document.getElementById("upNextName"),
    },
    progress: {
      bar: document.getElementById("progressBar"),
      time: document.getElementById("timeDisplay"),
    },
  };

  // ── Voices ──
  const initialVoices = loadVoices();
  populateVoiceSelect(voiceSelect, initialVoices);
  onVoicesChanged((updatedVoices) => populateVoiceSelect(voiceSelect, updatedVoices));

  // ── Restore persisted slider values ──
  rateSlider.value = getSetting("rate");
  pitchSlider.value = getSetting("pitch");

  // ── Persist on change ──
  voiceSelect.addEventListener("change", () => {
    const v = getAllVoices()[voiceSelect.value];
    setSetting("voiceURI", v ? v.voiceURI : null);
  });
  rateSlider.addEventListener("input", () => {
    setSetting("rate", parseFloat(rateSlider.value));
  });
  pitchSlider.addEventListener("input", () => {
    setSetting("pitch", parseFloat(pitchSlider.value));
  });

  // ── Reset to defaults ──
  const resetBtn = document.getElementById("settingsReset");
  resetBtn.addEventListener("click", (e) => {
    e.preventDefault();
    resetSettings();
    rateSlider.value = getSetting("rate");
    pitchSlider.value = getSetting("pitch");
    populateVoiceSelect(voiceSelect, getVoices());
  });

  // ── Load sequence ──
  btnStart.disabled = true;
  const name = new URLSearchParams(location.search).get("sequence") || "evening";

  let sequence, totalDuration;
  try {
    const data = await loadSequence(`${basePath}config/sequences/${name}.json`);
    sequence = data.poses;
    totalDuration = sequence.reduce((s, p) => s + p.holdSeconds, 0);
    buildPreview(document.getElementById("poseListPreview"), sequence);
    els.progress.time.textContent = `${formatTime(0)} / ${formatTime(totalDuration)}`;
    btnStart.disabled = false;
  } catch (err) {
    console.error("Failed to load sequence:", err);
    document.getElementById("poseListPreview").textContent =
      "Failed to load sequence. Check the browser console.";
    return;
  }

  // ── Begin ──
  btnStart.addEventListener("click", () => {
    if (activeSession) return;

    document.getElementById("idleView").style.display = "none";
    document.getElementById("completedView").style.display = "none";
    document.querySelector(".settings").open = false;
    btnStart.style.display = "none";
    btnStop.style.display = "";

    activeSession = startSession({
      sequence,
      els: { breathCircle: els.breathCircle, poseCard: els.poseCard, progress: els.progress },
      totalDuration,
      getVoiceOpts: () => {
        const allVoices = getAllVoices();
        return {
          voice: allVoices[voiceSelect.value] || null,
          rate: parseFloat(rateSlider.value),
          pitch: parseFloat(pitchSlider.value),
        };
      },
      onDone({ completed }) {
        activeSession = null;
        if (completed) {
          showCompleted(els, btnStart, btnStop);
        } else {
          showIdle(els, btnStart, btnStop, totalDuration);
        }
      },
    });
  });

  // ── Stop ──
  btnStop.addEventListener("click", async () => {
    if (activeSession) {
      await activeSession.stop();
    }
  });
}

function showCompleted(els, btnStart, btnStop) {
  els.poseCard.card.style.display = "none";
  els.poseCard.upNext.style.display = "none";
  document.getElementById("idleView").style.display = "none";
  document.getElementById("completedView").style.display = "";
  btnStart.textContent = "Restart";
  btnStart.style.display = "";
  btnStop.style.display = "none";
  els.progress.bar.style.width = "100%";
}

function showIdle(els, btnStart, btnStop, totalDuration) {
  els.poseCard.card.style.display = "none";
  els.poseCard.upNext.style.display = "none";
  document.getElementById("idleView").style.display = "";
  document.getElementById("completedView").style.display = "none";
  btnStart.textContent = "Begin";
  btnStart.style.display = "";
  btnStop.style.display = "none";
  els.progress.bar.style.width = "0%";
  els.progress.time.textContent = `${formatTime(0)} / ${formatTime(totalDuration)}`;
}

export async function destroy() {
  if (activeSession) {
    await activeSession.stop();
    activeSession = null;
  }
  cancelVoice();
}
