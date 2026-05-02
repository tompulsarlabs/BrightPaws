import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ROUNDS_PER_SESSION,
  COINS_PER_CORRECT,
  THEME,
  type VocabItem,
} from '../content/v0';
import { AudioButton } from '../src/components/AudioButton';
import { CoinBadge } from '../src/components/CoinBadge';
import { EndOfSessionScreen } from '../src/components/EndOfSessionScreen';
import { GameTile } from '../src/components/GameTile';
import { SoftLockOverlay } from '../src/components/SoftLockOverlay';
import { SunTimer } from '../src/components/SunTimer';
import { buildSession, type Round } from '../src/game/rounds';
import { useCoins } from '../src/hooks/useCoins';
import { useDailyPlayTime } from '../src/hooks/useDailyPlayTime';
import { speakEnglish, speakGerman } from '../src/lib/audio';
import { feedbackCorrect, feedbackWrong, feedbackTap } from '../src/lib/feedback';
import { t } from '../src/lib/i18n';

type GameState = 'playing' | 'end-of-session' | 'soft-lock';

export default function Index() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Game />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function Game() {
  const { width, height } = useWindowDimensions();

  const [session, setSession] = useState<Round[]>(() => buildSession());
  const [roundIdx, setRoundIdx] = useState(0);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [flashTileId, setFlashTileId] = useState<string | null>(null);
  const [flashKind, setFlashKind] = useState<'correct' | 'wrong' | null>(null);
  const [awardKey, setAwardKey] = useState(0);

  const { total, session: sessionCoins, dailyTargetJustHit, ready: coinsReady, award, resetSession } = useCoins();
  const playEnabled = gameState === 'playing';
  const { seconds: playedSeconds, ready: timerReady, softLimitJustReached, acknowledgeSoftLimit } =
    useDailyPlayTime(playEnabled);

  // Track which words have already played their German hint this session.
  // useRef so mutations don't re-render and so the value survives across rounds.
  const hintedThisSessionRef = useRef<Set<string>>(new Set());

  // When the soft-limit threshold is crossed, surface the overlay (unless we're
  // already in end-of-session).
  useEffect(() => {
    if (softLimitJustReached && gameState === 'playing') {
      setGameState('soft-lock');
    }
  }, [softLimitJustReached, gameState]);

  const round = session[roundIdx];

  // Auto-speak the target word at the start of each round so she always
  // hears what she's looking for.
  useEffect(() => {
    if (gameState !== 'playing' || !round) return;
    const id = setTimeout(() => speakEnglish(round.target.en), 350);
    return () => clearTimeout(id);
  }, [round, gameState]);

  function handleTilePress(tile: VocabItem) {
    if (!round) return;
    if (tile.id === round.target.id) {
      feedbackCorrect();
      award(COINS_PER_CORRECT);
      setAwardKey(k => k + 1);
      setFlashTileId(tile.id);
      setFlashKind('correct');
      setTimeout(() => {
        setFlashTileId(null);
        setFlashKind(null);
        if (roundIdx + 1 >= ROUNDS_PER_SESSION) {
          setGameState('end-of-session');
        } else {
          setRoundIdx(i => i + 1);
        }
      }, 700);
    } else {
      feedbackWrong();
      setFlashTileId(tile.id);
      setFlashKind('wrong');
      setTimeout(() => {
        setFlashTileId(null);
        setFlashKind(null);
      }, 350);
    }
  }

  function handleTileLongPress(tile: VocabItem) {
    // Once-per-session-per-word German audio hint.
    if (hintedThisSessionRef.current.has(tile.id)) {
      feedbackTap();
      return;
    }
    hintedThisSessionRef.current.add(tile.id);
    speakGerman(tile.de);
  }

  function handlePlayAnother() {
    setSession(buildSession());
    setRoundIdx(0);
    resetSession();
    hintedThisSessionRef.current.clear();
    setGameState('playing');
  }

  function handleSoftLockContinue() {
    acknowledgeSoftLimit();
    setGameState('playing');
  }

  function handleSoftLockDismiss() {
    acknowledgeSoftLimit();
    setGameState('end-of-session');
  }

  // Responsive sizing — flex on phone, fixed-ish on iPad.
  const isNarrow = width < 600;
  const isShort = height < 500; // iPhone landscape
  const horizontalPadding = isNarrow ? THEME.spacing.md : THEME.spacing.xl;
  const availableWidth = width - horizontalPadding * 2;
  const tileGap = THEME.spacing.sm * 2; // GameTile.styles.wrap margin: sm on each side
  // Tiles must clear Apple's 44pt min tap target. flexWrap on the row will
  // wrap to a second line if 5 don't fit (e.g. cramped iPhone portrait).
  const tileSize = Math.max(
    44,
    Math.min(isShort ? 110 : 180, Math.floor((availableWidth - tileGap * 5) / 5)),
  );
  const targetWordSize = isNarrow ? 56 : 88;
  const sunTimerWidth = Math.min(360, Math.max(110, width * 0.32));

  if (!coinsReady || !timerReady) {
    return (
      <SafeAreaView style={styles.loading} edges={['top', 'bottom', 'left', 'right']}>
        <Text style={styles.loadingText}>…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.header, isNarrow && styles.headerNarrow]}>
        <View style={styles.headerLeft}>
          <Text style={styles.roundCounter}>
            Round {Math.min(roundIdx + 1, ROUNDS_PER_SESSION)} / {ROUNDS_PER_SESSION}
          </Text>
          {!isNarrow && <Text style={styles.hint}>{t('long_press_hint')}</Text>}
        </View>
        <View style={styles.headerCenter}>
          <SunTimer seconds={playedSeconds} width={sunTimerWidth} />
        </View>
        <View style={styles.headerRight}>
          <CoinBadge total={total} awardKey={awardKey} />
        </View>
      </View>

      {round && gameState !== 'end-of-session' && (
        <Animated.View
          key={`round-${roundIdx}`}
          entering={FadeIn.duration(360)}
          style={[styles.center, isNarrow && styles.centerNarrow]}
        >
          <Animated.View
            entering={FadeInDown.duration(420)}
            style={[styles.targetCard, isNarrow && styles.targetCardNarrow]}
          >
            <Text
              style={[styles.targetWord, { fontSize: targetWordSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {round.target.en}
            </Text>
            <AudioButton onPress={() => speakEnglish(round.target.en)} />
          </Animated.View>

          <View style={styles.tileRow}>
            {round.tiles.map((tile, i) => (
              <GameTile
                key={`${roundIdx}-${tile.id}`}
                item={tile}
                size={tileSize}
                enterDelay={120 + i * 90}
                onPress={() => handleTilePress(tile)}
                onLongPress={() => handleTileLongPress(tile)}
                flash={flashTileId === tile.id ? flashKind : null}
              />
            ))}
          </View>
        </Animated.View>
      )}

      {gameState === 'end-of-session' && (
        <EndOfSessionScreen
          sessionCoins={sessionCoins}
          totalCoins={total}
          dailyTargetJustHit={dailyTargetJustHit}
          onPlayAnother={handlePlayAnother}
        />
      )}

      {gameState === 'soft-lock' && (
        <SoftLockOverlay
          onContinue={handleSoftLockContinue}
          onDismiss={handleSoftLockDismiss}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 60,
    color: THEME.colors.textMuted,
  },
  root: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  headerNarrow: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  headerLeft: { flex: 1, alignItems: 'flex-start' },
  headerCenter: { alignItems: 'center', justifyContent: 'center' },
  headerRight: { flex: 1, alignItems: 'flex-end' },
  roundCounter: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.4,
  },
  hint: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: THEME.spacing.xl,
    paddingBottom: THEME.spacing.lg,
  },
  centerNarrow: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
  },
  targetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '100%',
    gap: THEME.spacing.xl,
    backgroundColor: THEME.colors.card,
    paddingHorizontal: THEME.spacing.xl + 12,
    paddingVertical: THEME.spacing.lg,
    borderRadius: THEME.radius.card,
    borderWidth: 2,
    borderColor: THEME.colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 6,
  },
  targetCardNarrow: {
    gap: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
  },
  targetWord: {
    fontWeight: '800',
    color: THEME.colors.text,
    letterSpacing: -1,
    flexShrink: 1,
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
});
