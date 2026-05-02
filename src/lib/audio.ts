import * as Speech from 'expo-speech';

/**
 * v0 audio: TTS for word pronunciation. No recorded audio yet (no .mp3
 * files committed). Coin / wrong-answer SFX are intentionally deferred —
 * see haptics.ts for the v0 stand-ins. When real recordings arrive, drop
 * .mp3 into assets/sounds/ and switch this module to expo-av.
 */

let lastSpeak = 0;
const MIN_GAP_MS = 250; // crude debounce — ignore double-taps

function debounced(): boolean {
  const now = Date.now();
  if (now - lastSpeak < MIN_GAP_MS) return true;
  lastSpeak = now;
  return false;
}

export function speakEnglish(word: string): void {
  if (debounced()) return;
  Speech.stop();
  Speech.speak(word, { language: 'en-US', rate: 0.9, pitch: 1.0 });
}

export function speakGerman(word: string): void {
  if (debounced()) return;
  Speech.stop();
  Speech.speak(word, { language: 'de-DE', rate: 0.9, pitch: 1.0 });
}
