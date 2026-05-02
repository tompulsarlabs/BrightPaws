import { StyleSheet, Text, View } from 'react-native';
import { DAILY_SOFT_LIMIT_SECONDS, THEME } from '../../content/v0';

interface Props {
  /** cumulative seconds played today. */
  seconds: number;
  width: number;
}

/**
 * The "sun crosses the sky" daily-time indicator. Sun starts at the
 * left horizon (sunrise) and arcs across to the right (sunset) over
 * DAILY_SOFT_LIMIT_SECONDS. After it sets, time keeps flowing but the
 * sun stays at the right edge — the soft-limit overlay handles the
 * transition. Children draws this as an SVG-free pure-RN composition
 * to avoid pulling react-native-svg into v0.
 */
export function SunTimer({ seconds, width }: Props) {
  const progress = Math.min(1, seconds / DAILY_SOFT_LIMIT_SECONDS);

  // Parametric arc — sun position along a half-cosine peak.
  const arcWidth = width - 64; // padding for the sun emoji
  const x = 32 + arcWidth * progress;
  // Peak height of the arc (pixels). Quadratic so the sun spends more
  // time near the top than near the horizon — feels like real noon.
  const peakHeight = 32;
  const t = progress * 2 - 1; // -1 → 1
  const y = 8 + peakHeight * (1 - t * t);

  return (
    <View style={[styles.wrap, { width, height: 64 }]}>
      <View style={[styles.horizon, { width: arcWidth, left: 32 }]} />
      <Text style={[styles.sun, { left: x - 18, bottom: y }]}>☀️</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'visible',
    justifyContent: 'flex-end',
  },
  horizon: {
    position: 'absolute',
    bottom: 8,
    height: 2,
    backgroundColor: THEME.colors.cardBorder,
    borderRadius: 1,
  },
  sun: {
    position: 'absolute',
    fontSize: 36,
  },
});
