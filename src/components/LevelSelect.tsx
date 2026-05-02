import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MASTERY_SESSIONS_REQUIRED, THEME } from '../../content/v0';
import type { LevelState } from '../hooks/useLevels';
import { t } from '../lib/i18n';

interface Props {
  states: LevelState[];
  onPick: (levelId: string) => void;
  totalCoins: number;
}

/**
 * Pre-game world-map screen. Each level is a tappable rounded card.
 * Locked levels show a lock icon and a hint about how to unlock.
 * Mastered levels get a check; in-progress show their mastery dots.
 */
export function LevelSelect({ states, onPick, totalCoins }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('level_select_title')}</Text>
        <View style={styles.coinPill}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinTotal}>{totalCoins}</Text>
        </View>
      </View>

      <View style={styles.row}>
        {states.map(s => (
          <LevelCard key={s.level.id} state={s} onPress={() => s.unlocked && onPick(s.level.id)} />
        ))}
      </View>
    </View>
  );
}

function LevelCard({ state, onPress }: { state: LevelState; onPress: () => void }) {
  const { level, unlocked, mastered, mastery } = state;
  return (
    <Pressable
      onPress={onPress}
      disabled={!unlocked}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: unlocked ? level.bg : '#E5E0D2' },
        unlocked && pressed && { transform: [{ scale: 0.97 }] },
        !unlocked && { opacity: 0.55 },
      ]}
    >
      <Text style={styles.emoji}>{unlocked ? level.emoji : '🔒'}</Text>
      <Text style={styles.name}>{level.name}</Text>
      <Text style={styles.tagline} numberOfLines={2}>
        {unlocked ? level.tagline : t('level_locked')}
      </Text>

      {unlocked && (
        <View style={styles.dots}>
          {Array.from({ length: MASTERY_SESSIONS_REQUIRED }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i < mastery ? THEME.colors.accent : 'rgba(60,40,10,0.18)' },
              ]}
            />
          ))}
        </View>
      )}

      {mastered && <Text style={styles.masteredBadge}>✓ Mastered</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
    paddingHorizontal: THEME.spacing.xl,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.xl,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: THEME.colors.text,
    letterSpacing: -0.5,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.colors.coinSoft,
    borderWidth: 2,
    borderColor: THEME.colors.coin,
  },
  coinIcon: { fontSize: 22 },
  coinTotal: { fontSize: 22, fontWeight: '800', color: THEME.colors.text },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: THEME.spacing.lg,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    maxWidth: 360,
    minHeight: 320,
    borderRadius: THEME.radius.card,
    padding: THEME.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(60,40,10,0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
  emoji: { fontSize: 96, marginBottom: THEME.spacing.sm },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    color: THEME.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: THEME.spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: THEME.spacing.md,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  masteredBadge: {
    marginTop: THEME.spacing.sm,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.accent,
    letterSpacing: 0.5,
  },
});
