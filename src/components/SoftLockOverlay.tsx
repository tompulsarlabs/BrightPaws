import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { THEME } from '../../content/v0';
import { t } from '../lib/i18n';

interface Props {
  onContinue: () => void;
  onDismiss: () => void;
}

/**
 * Soft 30-minute nudge. Two equal-weight choices: "one more round" vs
 * "all done". No countdown timer that auto-dismisses; she controls it.
 */
export function SoftLockOverlay({ onContinue, onDismiss }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(360)} style={styles.wrap}>
      <Animated.View entering={ZoomIn.delay(100).duration(420)} style={styles.card}>
        <Text style={styles.eye}>🌅</Text>
        <Text style={styles.title}>{t('soft_limit_title')}</Text>
        <Text style={styles.body}>{t('soft_limit_body')}</Text>

        <View style={styles.row}>
          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [
              styles.btn,
              styles.btnSecondary,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text style={styles.btnSecondaryText}>{t('soft_limit_continue')}</Text>
          </Pressable>
          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [
              styles.btn,
              styles.btnPrimary,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text style={styles.btnPrimaryText}>{t('soft_limit_dismiss')}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 25, 15, 0.45)',
  },
  card: {
    backgroundColor: THEME.colors.card,
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.xl,
    borderRadius: THEME.radius.card,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 16,
    maxWidth: 560,
  },
  eye: { fontSize: 64, marginBottom: THEME.spacing.sm },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  body: {
    fontSize: 20,
    color: THEME.colors.textMuted,
    marginBottom: THEME.spacing.lg,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  btn: {
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.radius.pill,
  },
  btnPrimary: {
    backgroundColor: THEME.colors.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: THEME.colors.cardBorder,
  },
  btnPrimaryText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  btnSecondaryText: { color: THEME.colors.text, fontSize: 20, fontWeight: '700' },
});
