import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { THEME } from '../content/v0';

/**
 * "Margot & Tom" — a fixed ~20-second animated short. No interaction during
 * playback; a Replay button appears at the end. Pure choreography on emoji
 * actors so it works without any image assets, matching v0's placeholder
 * aesthetic. English narration via expo-speech doubles as listening practice.
 */
export default function StoryRoute() {
  return (
    <SafeAreaProvider>
      <Story />
    </SafeAreaProvider>
  );
}

function Story() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const [playKey, setPlayKey] = useState(0);
  const [showReplay, setShowReplay] = useState(false);

  // ─── Layout (recomputed on rotation; story restarts via playKey if needed) ───
  const characterSize = Math.min(160, height * 0.22);
  const mouseSize = characterSize * 0.55;
  const floorY = height * 0.62;

  const cheeseSize = characterSize * 0.42;
  const cheeseX = width * 0.5 - cheeseSize / 2;
  const cheeseY = floorY - cheeseSize * 0.85;

  const tomStartX = width + mouseSize;            // off-screen right
  const tomTargetX = width * 0.5 + cheeseSize * 0.7;
  const margotStartX = -characterSize * 1.4;       // off-screen left
  const margotCrouchX = width * 0.18;
  const margotPounceX = width * 0.5 - characterSize * 0.25;

  const margotTopBase = floorY - characterSize * 0.95;
  const tomTopBase = floorY - mouseSize * 0.95;

  // ─── Shared values ───
  const sceneOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const endOpacity = useSharedValue(0);
  const replayOpacity = useSharedValue(0);

  const tomX = useSharedValue(tomStartX);
  const tomY = useSharedValue(0);
  const tomOpacity = useSharedValue(1);

  const margotX = useSharedValue(margotStartX);
  const margotY = useSharedValue(0);
  const margotScaleY = useSharedValue(1);
  const margotTilt = useSharedValue(0);

  const squeakOpacity = useSharedValue(0);
  const gotchaOpacity = useSharedValue(0);

  // Speech is fire-and-forget but we must cancel pending lines on unmount/replay.
  const speechTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setShowReplay(false);

    // Reset every shared value so a Replay restarts cleanly.
    sceneOpacity.value = 0;
    titleOpacity.value = 0;
    endOpacity.value = 0;
    replayOpacity.value = 0;
    tomX.value = tomStartX;
    tomY.value = 0;
    tomOpacity.value = 1;
    margotX.value = margotStartX;
    margotY.value = 0;
    margotScaleY.value = 1;
    margotTilt.value = 0;
    squeakOpacity.value = 0;
    gotchaOpacity.value = 0;

    const speakAt = (ms: number, line: string) => {
      const t = setTimeout(() => {
        Speech.stop();
        Speech.speak(line, { language: 'en-US', rate: 0.9, pitch: 1.0 });
      }, ms);
      speechTimers.current.push(t);
    };

    // ─── 0.0s — scene up ───
    sceneOpacity.value = withTiming(1, { duration: 600 });

    // ─── 0.4s — title in, 2.4s — title out ───
    titleOpacity.value = withSequence(
      withDelay(400, withTiming(1, { duration: 500 })),
      withDelay(1500, withTiming(0, { duration: 500 })),
    );

    // ─── 3.0s — Tom scurries in from the right (1.5s), little bobbing run ───
    tomX.value = withDelay(
      3000,
      withTiming(tomTargetX, { duration: 1500, easing: Easing.out(Easing.quad) }),
    );
    tomY.value = withDelay(
      3000,
      withSequence(
        withTiming(-6, { duration: 180 }),
        withTiming(0,  { duration: 180 }),
        withTiming(-6, { duration: 180 }),
        withTiming(0,  { duration: 180 }),
        withTiming(-5, { duration: 180 }),
        withTiming(0,  { duration: 180 }),
      ),
    );
    speakAt(5000, 'Here is Tom the mouse.');

    // ─── 7.0s — Margot sneaks in from the left (1.5s) ───
    margotX.value = withDelay(
      7000,
      withTiming(margotCrouchX, { duration: 1500, easing: Easing.out(Easing.quad) }),
    );
    speakAt(8800, 'And here is Margot the cat.');

    // ─── 9.5s — Margot crouches & body wiggles (tail-swish stand-in) ───
    margotScaleY.value = withDelay(
      9500,
      withSequence(
        withTiming(0.85, { duration: 350 }),
        withTiming(0.92, { duration: 350 }),
        withTiming(0.85, { duration: 350 }),
        withTiming(0.95, { duration: 350 }),
      ),
    );
    margotTilt.value = withDelay(
      9500,
      withSequence(
        withTiming(-3, { duration: 220 }),
        withTiming( 3, { duration: 220 }),
        withTiming(-3, { duration: 220 }),
        withTiming( 3, { duration: 220 }),
        withTiming( 0, { duration: 200 }),
      ),
    );

    // ─── 11.5s — Tom spots her: startle hop + "Squeak!" ───
    tomY.value = withDelay(
      11500,
      withSequence(
        withTiming(-14, { duration: 140 }),
        withTiming(0,   { duration: 200 }),
      ),
    );
    squeakOpacity.value = withDelay(
      11500,
      withSequence(
        withTiming(1, { duration: 220 }),
        withDelay(900, withTiming(0, { duration: 300 })),
      ),
    );

    // ─── 12.7s — narration just before the pounce ───
    speakAt(12700, 'Margot pounces!');

    // ─── 13.0s — pounce: leap right + arc up then down (800ms) ───
    margotScaleY.value = withDelay(
      13000,
      withSequence(
        withTiming(1.1, { duration: 180 }),
        withTiming(1,   { duration: 600 }),
      ),
    );
    margotX.value = withDelay(
      13000,
      withTiming(margotPounceX, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
    margotY.value = withDelay(
      13000,
      withSequence(
        withTiming(-90, { duration: 350, easing: Easing.out(Easing.quad) }),
        withTiming(0,   { duration: 450, easing: Easing.in(Easing.quad) }),
      ),
    );

    // ─── 13.85s — Tom is caught (fades under Margot's paw) ───
    tomOpacity.value = withDelay(13850, withTiming(0, { duration: 200 }));

    // ─── 14.2s — "Got you!" bubble ───
    gotchaOpacity.value = withDelay(
      14200,
      withSequence(
        withTiming(1, { duration: 280 }),
        withDelay(2400, withTiming(0, { duration: 400 })),
      ),
    );
    speakAt(14700, 'Got you, Tom!');

    // ─── 17.5s — The End ───
    endOpacity.value = withDelay(17500, withTiming(1, { duration: 700 }));

    // ─── 19.5s — Replay button reveals ───
    replayOpacity.value = withDelay(19500, withTiming(1, { duration: 400 }));
    const replayShowTimer = setTimeout(() => setShowReplay(true), 19500);
    speechTimers.current.push(replayShowTimer);

    return () => {
      Speech.stop();
      speechTimers.current.forEach(clearTimeout);
      speechTimers.current = [];
      cancelAnimation(sceneOpacity);
      cancelAnimation(titleOpacity);
      cancelAnimation(endOpacity);
      cancelAnimation(replayOpacity);
      cancelAnimation(tomX);
      cancelAnimation(tomY);
      cancelAnimation(tomOpacity);
      cancelAnimation(margotX);
      cancelAnimation(margotY);
      cancelAnimation(margotScaleY);
      cancelAnimation(margotTilt);
      cancelAnimation(squeakOpacity);
      cancelAnimation(gotchaOpacity);
    };
    // Layout values are derived from window dims; restart on resize too.
  }, [
    playKey, tomStartX, tomTargetX, margotStartX, margotCrouchX, margotPounceX,
    sceneOpacity, titleOpacity, endOpacity, replayOpacity,
    tomX, tomY, tomOpacity, margotX, margotY, margotScaleY, margotTilt,
    squeakOpacity, gotchaOpacity,
  ]);

  // ─── Animated styles ───
  const sceneStyle = useAnimatedStyle(() => ({ opacity: sceneOpacity.value }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const endStyle   = useAnimatedStyle(() => ({ opacity: endOpacity.value }));
  const replayStyle = useAnimatedStyle(() => ({ opacity: replayOpacity.value }));

  const margotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: margotX.value },
      { translateY: margotY.value },
      { scaleY: margotScaleY.value },
      { rotate: `${margotTilt.value}deg` },
    ],
  }));
  const tomStyle = useAnimatedStyle(() => ({
    opacity: tomOpacity.value,
    transform: [
      { translateX: tomX.value },
      { translateY: tomY.value },
    ],
  }));
  const squeakStyle = useAnimatedStyle(() => ({
    opacity: squeakOpacity.value,
    transform: [{ translateX: tomX.value - 30 }, { translateY: tomY.value }],
  }));
  const gotchaStyle = useAnimatedStyle(() => ({
    opacity: gotchaOpacity.value,
    transform: [{ translateX: margotX.value }, { translateY: margotY.value }],
  }));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View style={[StyleSheet.absoluteFill, sceneStyle]} pointerEvents="none">
        {/* Wall + floor */}
        <View style={[styles.wall, { height: floorY }]} />
        <View style={[styles.floor, { top: floorY }]} />
        {/* Sun in the window */}
        <View style={[styles.window, { top: floorY * 0.18, left: width * 0.78 }]}>
          <Text style={styles.windowSun}>☀️</Text>
        </View>
        {/* Cheese on the floor */}
        <Text style={[styles.cheese, { left: cheeseX, top: cheeseY, fontSize: cheeseSize }]}>🧀</Text>

        {/* Margot the cat */}
        <Animated.View
          style={[
            styles.actor,
            { top: margotTopBase, width: characterSize, height: characterSize },
            margotStyle,
          ]}
        >
          <Text
            style={[
              styles.actorEmoji,
              { fontSize: characterSize * 0.85, lineHeight: characterSize * 0.95 },
            ]}
          >
            🐱
          </Text>
          <Text style={[styles.nameTag, { top: characterSize * 0.92 }]}>Margot</Text>
        </Animated.View>

        {/* Tom the mouse */}
        <Animated.View
          style={[
            styles.actor,
            { top: tomTopBase, width: mouseSize, height: mouseSize },
            tomStyle,
          ]}
        >
          <Text
            style={[
              styles.actorEmoji,
              { fontSize: mouseSize * 0.9, lineHeight: mouseSize * 0.95 },
            ]}
          >
            🐭
          </Text>
          <Text style={[styles.nameTag, { top: mouseSize * 0.94, fontSize: 14 }]}>Tom</Text>
        </Animated.View>

        {/* Speech bubbles — translate with their character */}
        <Animated.View
          style={[styles.bubbleAnchor, { top: tomTopBase - 56 }, squeakStyle]}
          pointerEvents="none"
        >
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>Squeak!</Text>
          </View>
        </Animated.View>
        <Animated.View
          style={[styles.bubbleAnchor, { top: margotTopBase - 60 }, gotchaStyle]}
          pointerEvents="none"
        >
          <View style={[styles.bubble, styles.bubbleAccent]}>
            <Text style={[styles.bubbleText, styles.bubbleTextLight]}>Got you, Tom!</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Title overlay */}
      <Animated.View style={[styles.titleWrap, titleStyle]} pointerEvents="none">
        <Text style={styles.title}>Margot &amp; Tom</Text>
        <Text style={styles.subtitle}>A very short story</Text>
      </Animated.View>

      {/* The End overlay */}
      <Animated.View style={[styles.endWrap, endStyle]} pointerEvents="none">
        <Text style={styles.endText}>The End</Text>
      </Animated.View>

      {/* Back button (always available) */}
      <Pressable
        style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
        onPress={() => router.back()}
        hitSlop={12}
      >
        <Text style={styles.backLabel}>← Back</Text>
      </Pressable>

      {/* Replay (revealed at the end) */}
      {showReplay && (
        <Animated.View style={[styles.replayWrap, replayStyle]}>
          <Pressable
            style={({ pressed }) => [styles.replayBtn, pressed && { transform: [{ scale: 0.97 }] }]}
            onPress={() => setPlayKey(k => k + 1)}
          >
            <Text style={styles.replayLabel}>↻ Watch again</Text>
          </Pressable>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F2D9B1',
  },
  wall: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: '#F7E6C7',
  },
  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#C99863',
    borderTopWidth: 3,
    borderTopColor: '#8E6535',
  },
  window: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: '#BFE2F2',
    borderWidth: 4,
    borderColor: '#8E6535',
    alignItems: 'center',
    justifyContent: 'center',
  },
  windowSun: { fontSize: 46, lineHeight: 50 },
  cheese: {
    position: 'absolute',
    textShadowColor: 'rgba(60,40,10,0.25)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 5,
  },
  actor: {
    position: 'absolute',
    left: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  actorEmoji: { textAlign: 'center' },
  nameTag: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  bubbleAnchor: {
    position: 'absolute',
    left: 0,
    alignItems: 'flex-start',
  },
  bubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: THEME.colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  bubbleAccent: {
    backgroundColor: THEME.colors.accent,
    borderColor: THEME.colors.accent,
  },
  bubbleText: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.text,
    letterSpacing: -0.3,
  },
  bubbleTextLight: { color: '#FFFFFF' },

  titleWrap: {
    position: 'absolute',
    top: '14%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 64,
    fontWeight: '800',
    color: THEME.colors.text,
    letterSpacing: -1,
    backgroundColor: 'rgba(255,255,255,0.78)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '500',
    fontStyle: 'italic',
    color: THEME.colors.text,
    backgroundColor: 'rgba(255,255,255,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },

  endWrap: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  endText: {
    fontSize: 72,
    fontWeight: '800',
    color: THEME.colors.text,
    letterSpacing: -1.5,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },

  backBtn: {
    position: 'absolute',
    top: 18,
    left: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: THEME.colors.cardBorder,
  },
  backLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
  },

  replayWrap: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  replayBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: THEME.colors.accent,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 8,
  },
  replayLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
