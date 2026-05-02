import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { DAILY_COIN_TARGET, THEME } from '../../content/v0';
import { t } from '../lib/i18n';

interface Props {
  sessionCoins: number;
  totalCoins: number;
  dailyTargetJustHit: boolean;
  onPlayAnother: () => void;
}

export function EndOfSessionScreen({ sessionCoins, totalCoins, dailyTargetJustHit, onPlayAnother }: Props) {
  const subtitleKey = sessionCoins === 1 ? 'end_of_session_subtitle_one' : 'end_of_session_subtitle_many';

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.wrap}>
      <Animated.View entering={ZoomIn.delay(100).duration(420)} style={styles.card}>
        <Text style={styles.title}>{t('end_of_session_title')}</Text>
        <Text style={styles.coinHero}>🪙 +{sessionCoins}</Text>
        <Text style={styles.subtitle}>{t(subtitleKey, sessionCoins)}</Text>
        <Text style={styles.total}>{t('end_of_session_total', totalCoins, t('coins_label'))}</Text>

        {dailyTargetJustHit && (
          <Animated.View entering={ZoomIn.delay(450).duration(420)} style={styles.targetBanner}>
            <Text style={styles.targetText}>🎉 {t('daily_target_hit', DAILY_COIN_TARGET)}</Text>
          </Animated.View>
        )}

        <Pressable
          onPress={onPlayAnother}
          style={({ pressed }) => [
            styles.cta,
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <Text style={styles.ctaText}>{t('play_another')}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 239, 226, 0.94)',
  },
  card: {
    backgroundColor: THEME.colors.card,
    paddingHorizontal: THEME.spacing.xl + 12,
    paddingVertical: THEME.spacing.xl,
    borderRadius: THEME.radius.card,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 16,
    minWidth: 480,
    borderWidth: 2,
    borderColor: THEME.colors.cardBorder,
  },
  title: {
    fontSize: 44,
    fontWeight: '800',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.md,
  },
  coinHero: {
    fontSize: 88,
    fontWeight: '900',
    color: THEME.colors.coin,
    marginVertical: THEME.spacing.sm,
  },
  subtitle: {
    fontSize: 22,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  total: {
    fontSize: 18,
    color: THEME.colors.textMuted,
    marginBottom: THEME.spacing.lg,
    fontWeight: '600',
  },
  targetBanner: {
    backgroundColor: THEME.colors.coinSoft,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.radius.pill,
    marginBottom: THEME.spacing.lg,
    borderWidth: 2,
    borderColor: THEME.colors.coin,
  },
  targetText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  cta: {
    backgroundColor: THEME.colors.accent,
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
