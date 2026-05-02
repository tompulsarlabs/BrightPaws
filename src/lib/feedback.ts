import * as Haptics from 'expo-haptics';

/**
 * Touch feedback. Haptics-only for v0 — no recorded SFX yet. The brief
 * called for a "+1 coin sound" but rather than fudge it with TTS we use
 * Success haptic + the coin-pop animation; once a 0.3s mp3 is dropped
 * into assets/sounds/coin.mp3, swap this module to expo-av.
 */

export function feedbackCorrect(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function feedbackWrong(): void {
  // notificationAsync(Error) is too harsh on iOS — feels punitive. Use a
  // light selection click for the "soft buzz" mentioned in the brief.
  Haptics.selectionAsync().catch(() => {});
}

export function feedbackTap(): void {
  Haptics.selectionAsync().catch(() => {});
}
