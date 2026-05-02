import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DAILY_COIN_TARGET, THEME } from '../../content/v0';
import { t } from '../lib/i18n';

interface Props {
  sessionCoins: number;
  totalCoins: number;
  dailyTargetJustHit: boolean;
  levelLabel?: string;
  newLevelUnlocked?: string | null;
  onPlayAnother: () => void;
  onChooseLevel?: () => void;
}

// Plain Views, no reanimated entering — same fix as GameTile, see comment there.
export function EndOfSessionScreen({
  sessionCoins,
  totalCoins,
  dailyTargetJustHit,
  levelLabel,
  newLevelUnlocked,
  onPlayAnother,
  onChooseLevel,
}: Props) {
  const subtitleKey = sessionCoins === 1 ? 'end_of_session_subtitle_one' : 'end_of_session_subtitle_many';

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('end_of_session_title')}</Text>
        {levelLabel && <Text style={styles.levelLabel}>{levelLabel}</Text>}
        <Text style={styles.coinHero}>🪙 +{sessionCoins}</Text>
        <Text style={styles.subtitle}>{t(subtitleKey, sessionCoins)}</Text>
        <Text style={styles.total}>{t('end_of_session_total', totalCoins, t('coins_label'))}</Text>

        {dailyTargetJustHit && (
          <View style={styles.targetBanner}>
            <Text style={styles.targetText}>🎉 {t('daily_target_hit', DAILY_COIN_TARGET)}</Text>
          </View>
        )}

        {newLevelUnlocked && (
          <View style={styles.unlockBanner}>
            <Text style={styles.unlockText}>✨ New world unlocked: {newLevelUnlocked}</Text>
          </View>
        )}

        <View style={styles.ctaRow}>
          {onChooseLevel && (
            <Pressable
              onPress={onChooseLevel}
              style={({ pressed }) => [
                styles.cta,
                styles.ctaSecondary,
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
            >
              <Text style={styles.ctaSecondaryText}>Choose world</Text>
            </Pressable>
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
        </View>
      </View>
    </View>
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
    marginBottom: THEME.spacing.xs,
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    letterSpacing: 0.4,
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
  unlockBanner: {
    backgroundColor: THEME.colors.accentSoft,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.radius.pill,
    marginBottom: THEME.spacing.lg,
    borderWidth: 2,
    borderColor: THEME.colors.accent,
  },
  unlockText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
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
  ctaSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: THEME.colors.cardBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaSecondaryText: {
    color: THEME.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  ctaText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
