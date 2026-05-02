import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { THEME } from '../../content/v0';

interface Props {
  total: number;
  /**
   * Increments when a coin is awarded — drives the +1 pop animation.
   * (We re-key on the value rather than passing a delta to keep the
   * parent's logic simple; the badge handles its own animation timing.)
   */
  awardKey: number;
}

export function CoinBadge({ total, awardKey }: Props) {
  const popY = useSharedValue(0);
  const popOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(1);

  useEffect(() => {
    if (awardKey === 0) return;
    popY.value = 0;
    popOpacity.value = 0;
    popOpacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 280 }),
    );
    popY.value = withTiming(-44, { duration: 1000 });
    badgeScale.value = withSequence(
      withSpring(1.18, { damping: 8, stiffness: 220 }),
      withSpring(1, { damping: 12, stiffness: 180 }),
    );
  }, [awardKey, badgeScale, popOpacity, popY]);

  const popStyle = useAnimatedStyle(() => ({
    opacity: popOpacity.value,
    transform: [{ translateY: popY.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.badge, badgeStyle]}>
        <Text style={styles.coinIcon}>🪙</Text>
        <Text style={styles.total}>{total}</Text>
      </Animated.View>
      <Animated.Text style={[styles.pop, popStyle]} pointerEvents="none">
        +1
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.coinSoft,
    borderWidth: 2,
    borderColor: THEME.colors.coin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  coinIcon: {
    fontSize: 26,
  },
  total: {
    color: THEME.colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pop: {
    position: 'absolute',
    top: 0,
    color: THEME.colors.coin,
    fontSize: 28,
    fontWeight: '800',
  },
});
