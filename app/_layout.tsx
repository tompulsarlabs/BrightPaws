import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { setAudioModeAsync } from 'expo-audio';

export default function RootLayout() {
  // Configure audio session once: allow recording, and play TTS / playback
  // even when the iPhone/iPad silent switch is on. Without playsInSilentMode,
  // The learner would hear nothing if the iPad's hardware silent toggle is engaged.
  useEffect(() => {
    setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    }).catch(() => {});
  }, []);

  return (
    <>
      <StatusBar hidden />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
