import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  useAudioPlayer,
  useAudioRecorder,
} from 'expo-audio';
import { THEME } from '../../content/v0';
import { feedbackTap } from '../lib/feedback';
import { t } from '../lib/i18n';

type Mode = 'idle' | 'recording' | 'playing' | 'denied';

const MAX_RECORD_MS = 3000;

interface Props {
  /** Reset to idle when this changes — e.g. when the round advances. */
  resetKey: number | string;
}

/**
 * Voice option B per Tom's pick: tap to record (auto-stops at 3s), then
 * auto-plays back so she hears herself. No grading, no STT, no mic
 * permission unless she actually presses the button.
 */
export function RepeatButton({ resetKey }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const player = useAudioPlayer(recordingUri);
  const [mode, setMode] = useState<Mode>('idle');
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on round change.
  useEffect(() => {
    setMode('idle');
    setRecordingUri(null);
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
  }, [resetKey]);

  // When playback finishes, drop back to idle.
  useEffect(() => {
    if (mode !== 'playing' || !player) return;
    const id = setInterval(() => {
      // Polling player.playing is simpler than wiring the event subscription
      // for v0.2; switch to addListener('playbackStatusUpdate') if this gets noisy.
      if (player && player.playing === false) {
        setMode('idle');
        clearInterval(id);
      }
    }, 200);
    const safety = setTimeout(() => { setMode('idle'); clearInterval(id); }, MAX_RECORD_MS + 1500);
    return () => { clearInterval(id); clearTimeout(safety); };
  }, [mode, player]);

  // Pulse animation while recording.
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (mode === 'recording') {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 480 }),
          withTiming(1, { duration: 480 }),
        ),
        -1,
        true,
      );
    } else {
      pulse.value = withSpring(1, { damping: 12, stiffness: 200 });
    }
  }, [mode, pulse]);
  const aniStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  async function handlePress() {
    feedbackTap();

    if (mode === 'recording') {
      // Tap again to stop early.
      await stopAndPlay();
      return;
    }
    if (mode === 'playing') return; // ignore taps while playing back

    // Permission flow.
    let perm = await getRecordingPermissionsAsync();
    if (!perm.granted) {
      if (!perm.canAskAgain) { setMode('denied'); return; }
      perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) { setMode('denied'); return; }
    }

    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setMode('recording');
      stopTimerRef.current = setTimeout(() => { stopAndPlay().catch(() => {}); }, MAX_RECORD_MS);
    } catch (err) {
      // If anything goes sideways with the recorder, fall back gracefully.
      setMode('denied');
    }
  }

  async function stopAndPlay() {
    if (stopTimerRef.current) { clearTimeout(stopTimerRef.current); stopTimerRef.current = null; }
    try {
      await recorder.stop();
    } catch { /* fine — already stopped */ }
    const uri = recorder.uri;
    if (!uri) { setMode('idle'); return; }
    setRecordingUri(uri);
    setMode('playing');
    // Tiny delay so the player picks up the new URI before play().
    setTimeout(() => { try { player.seekTo(0); player.play(); } catch {} }, 80);
  }

  const palette = (() => {
    switch (mode) {
      case 'recording': return { bg: THEME.colors.voiceLive, icon: '⏺', caption: t('voice_button_recording') };
      case 'playing':   return { bg: THEME.colors.accent,    icon: '✨', caption: t('voice_button_playing') };
      case 'denied':    return { bg: THEME.colors.textMuted, icon: '🎙', caption: t('mic_permission_blocked') };
      default:          return { bg: THEME.colors.voice,     icon: '🎙', caption: t('voice_button_idle') };
    }
  })();

  return (
    <View style={styles.column}>
      <Animated.View style={aniStyle}>
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={palette.caption}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: palette.bg, transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.icon}>{palette.icon}</Text>
        </Pressable>
      </Animated.View>
      <Text style={styles.caption}>{palette.caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { alignItems: 'center' },
  btn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: { fontSize: 44 },
  caption: {
    marginTop: THEME.spacing.sm,
    color: THEME.colors.textMuted,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 160,
  },
});
