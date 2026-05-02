import { Audio } from 'expo-av';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

export default function RootLayout() {
  // Margo plays in bed / on the couch with the iPhone silent switch flipped on.
  // Without this the TTS that drives every round goes inaudible and she has no
  // way to know why. iOS-only flag; harmless on Android.
  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
  }, []);

  return (
    <>
      <StatusBar hidden />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
