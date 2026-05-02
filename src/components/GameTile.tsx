import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { THEME, type VocabItem } from '../../content/v0';
import { AssetView } from './AssetView';

interface Props {
  item: VocabItem;
  size: number;
  /**
   * Delay (ms) before this tile fades/zooms in — staggered entrance per row.
   */
  enterDelay: number;
  onPress: () => void;
  onLongPress: () => void;
  /** When set, the tile flashes a coloured border for feedback. */
  flash: 'correct' | 'wrong' | null;
}

const FAMILY_TINTS = {
  cat: THEME.colors.familyCat,
  dachshund: THEME.colors.familyDachshund,
  grogu: THEME.colors.familyGrogu,
  world: THEME.colors.familyWorld,
} as const;

export function GameTile({ item, size, enterDelay, onPress, onLongPress, flash }: Props) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const flashScale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(enterDelay, withSpring(1, { damping: 14, stiffness: 160 }));
    opacity.value = withDelay(enterDelay, withTiming(1, { duration: 280 }));
  }, [enterDelay, scale, opacity]);

  useEffect(() => {
    if (flash === 'correct') {
      flashScale.value = withSequence(
        withSpring(1.12, { damping: 8, stiffness: 220 }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      );
    } else if (flash === 'wrong') {
      flashScale.value = withSequence(
        withTiming(0.97, { duration: 80 }),
        withTiming(1, { duration: 120 }),
      );
    }
  }, [flash, flashScale]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * flashScale.value }],
    opacity: opacity.value,
  }));

  const tint = FAMILY_TINTS[item.family];
  const borderColor =
    flash === 'correct' ? THEME.colors.accent
    : flash === 'wrong' ? '#D88A8A'
    : THEME.colors.cardBorder;

  return (
    <Animated.View style={[styles.wrap, containerStyle]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={450}
        accessibilityRole="button"
        accessibilityLabel={`${item.en} tile`}
        style={({ pressed }) => [
          styles.tile,
          {
            width: size,
            height: size,
            borderColor,
            backgroundColor: THEME.colors.card,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        <View style={[styles.tintBand, { backgroundColor: tint }]} />
        <View style={styles.art}>
          <AssetView asset={item.art} size={size * 0.7} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    margin: THEME.spacing.sm,
  },
  tile: {
    borderRadius: THEME.radius.tile,
    borderWidth: 3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 6,
  },
  tintBand: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 12,
  },
  art: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
  },
});
