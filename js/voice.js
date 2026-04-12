/**
 * Voice module — wraps the Web Speech API.
 *
 * Exports:
 *   loadVoices()           → populate internal voice list
 *   getVoices()            → return filtered English voices
 *   pickDefaultVoice(list) → heuristic: prefer known calm female voices
 *   speak(text, opts)      → Promise<void> that resolves when utterance ends
 *   cancel()               → cancel any in-flight utterance
 */

const synth = typeof speechSynthesis !== "undefined" ? speechSynthesis : null;
let voices = [];

/**
 * Populate the internal voice list from the platform. Call once at boot and
 * again on synth.onvoiceschanged (voices load asynchronously on some browsers).
 * Returns the filtered English-language list for convenience.
 */
export function loadVoices() {
  if (!synth) return [];
  voices = synth.getVoices();
  return getVoices();
}

/**
 * Return all available English voices (or all voices if no English ones exist).
 */
export function getVoices() {
  const eng = voices.filter((v) => v.lang.startsWith("en"));
  return eng.length > 0 ? eng : voices;
}

/**
 * Return the platform's full voice list (all languages, unfiltered).
 */
export function getAllVoices() {
  return voices;
}

/**
 * Pick a default voice from the given list. Prefers known calm voices
 * (Samantha, Karen, Fiona, Daniel) that sound good for guided narration.
 * Falls back to the first voice in the list.
 */
export function pickDefaultVoice(list) {
  if (!list || list.length === 0) return null;
  const preferred = ["samantha", "karen", "fiona", "female"];
  for (const keyword of preferred) {
    const match = list.find((v) => v.name.toLowerCase().includes(keyword));
    if (match) return match;
  }
  return list[0];
}

/**
 * Speak the given text. Returns a Promise that resolves when the utterance
 * ends (or errors). Cancels any in-flight utterance first.
 *
 * @param {string} text
 * @param {{voice?: SpeechSynthesisVoice, rate?: number, pitch?: number}} opts
 */
export function speak(text, { voice = null, rate = 0.85, pitch = 1.0 } = {}) {
  return new Promise((resolve) => {
    if (!synth) {
      resolve();
      return;
    }
    synth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    if (voice) utt.voice = voice;
    utt.rate = rate;
    utt.pitch = pitch;
    utt.onend = resolve;
    utt.onerror = resolve;
    synth.speak(utt);
  });
}

/**
 * Cancel any in-flight speech.
 */
export function cancel() {
  if (synth) synth.cancel();
}

/**
 * Register the voiceschanged callback. Call once at boot.
 * @param {function} onChange — called with the updated English voice list
 */
export function onVoicesChanged(onChange) {
  if (!synth) return;
  synth.onvoiceschanged = () => {
    loadVoices();
    if (onChange) onChange(getVoices());
  };
}
