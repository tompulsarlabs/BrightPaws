import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import {
  COINS_PER_CORRECT,
  MASTERY_CORRECT_THRESHOLD,
  ROUNDS_PER_SESSION,
  THEME,
  getLevel,
  type Level,
  type VocabItem,
} from '../content/v0';
import { AudioButton } from '../src/components/AudioButton';
import { CoinBadge } from '../src/components/CoinBadge';
import { EndOfSessionScreen } from '../src/components/EndOfSessionScreen';
import { GameTile } from '../src/components/GameTile';
import { LevelSelect } from '../src/components/LevelSelect';
import { RepeatButton } from '../src/components/RepeatButton';
import { SoftLockOverlay } from '../src/components/SoftLockOverlay';
import { SunTimer } from '../src/components/SunTimer';
import { buildSession, type Round } from '../src/game/rounds';
import { useCoins } from '../src/hooks/useCoins';
import { useDailyPlayTime } from '../src/hooks/useDailyPlayTime';
import { useLevels } from '../src/hooks/useLevels';
import { speakEnglish, speakGerman } from '../src/lib/audio';
import { feedbackCorrect, feedbackTap, feedbackWrong } from '../src/lib/feedback';
import { t } from '../src/lib/i18n';
import { loadLastLevelId, saveLastLevelId } from '../src/lib/storage';

type GameState = 'level-select' | 'playing' | 'end-of-session' | 'soft-lock';

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
  const { width } = useWindowDimensions();

  const [gameState, setGameState] = useState<GameState>('level-select');
  const [level, setLevel] = useState<Level | null>(null);
  const [session, setSession] = useState<Round[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [flashTileId, setFlashTileId] = useState<string | null>(null);
  const [flashKind, setFlashKind] = useState<'correct' | 'wrong' | null>(null);
  const [awardKey, setAwardKey] = useState(0);
  const [correctFirstTry, setCorrectFirstTry] = useState(0);
  const [newlyUnlockedLevel, setNewlyUnlockedLevel] = useState<string | null>(null);

  const { total, session: sessionCoins, dailyTargetJustHit, ready: coinsReady, award, resetSession } = useCoins();
  const playEnabled = gameState === 'playing';
  const { seconds: playedSeconds, ready: timerReady, softLimitJustReached, acknowledgeSoftLimit } =
    useDailyPlayTime(playEnabled);
  const { states: levelStates, ready: levelsReady, recordMastery } = useLevels();

  // Track which words have already played their German hint this session.
  const hintedThisSessionRef = useRef<Set<string>>(new Set());
  // Track which rounds have had a wrong tap (to compute mastery — first-try correct only).
  const wrongTriesThisRoundRef = useRef(false);

  useEffect(() => {
    if (softLimitJustReached && gameState === 'playing') {
      setGameState('soft-lock');
    }
  }, [softLimitJustReached, gameState]);

  // Restore last-played level on first load (so the dot count and selected
  // level feel continuous across launches).
  useEffect(() => {
    loadLastLevelId().then(id => {
      // Just for warmth — doesn't auto-start; she still picks via LevelSelect.
      if (id) { /* no-op for v0.2; could prefocus the card later */ }
    });
  }, []);

  const round = session[roundIdx];

  useEffect(() => {
    if (gameState !== 'playing' || !round) return;
    const id = setTimeout(() => speakEnglish(round.target.en), 350);
    return () => clearTimeout(id);
  }, [round, gameState]);

  function handlePickLevel(levelId: string) {
    const lvl = getLevel(levelId);
    setLevel(lvl);
    setSession(buildSession(lvl));
    setRoundIdx(0);
    setCorrectFirstTry(0);
    resetSession();
    hintedThisSessionRef.current.clear();
    wrongTriesThisRoundRef.current = false;
    setNewlyUnlockedLevel(null);
    setGameState('playing');
    saveLastLevelId(levelId).catch(() => {});
  }

  function handleTilePress(tile: VocabItem) {
    if (!round) return;
    if (tile.id === round.target.id) {
      feedbackCorrect();
      award(COINS_PER_CORRECT);
      setAwardKey(k => k + 1);
      setFlashTileId(tile.id);
      setFlashKind('correct');
      const wasFirstTry = !wrongTriesThisRoundRef.current;
      if (wasFirstTry) setCorrectFirstTry(c => c + 1);
      setTimeout(() => {
        setFlashTileId(null);
        setFlashKind(null);
        if (roundIdx + 1 >= ROUNDS_PER_SESSION) {
          finishSession(wasFirstTry ? correctFirstTry + 1 : correctFirstTry);
        } else {
          setRoundIdx(i => i + 1);
          wrongTriesThisRoundRef.current = false;
        }
      }, 700);
    } else {
      feedbackWrong();
      wrongTriesThisRoundRef.current = true;
      setFlashTileId(tile.id);
      setFlashKind('wrong');
      setTimeout(() => {
        setFlashTileId(null);
        setFlashKind(null);
      }, 350);
    }
  }

  async function finishSession(finalCorrectFirstTry: number) {
    if (level && finalCorrectFirstTry >= MASTERY_CORRECT_THRESHOLD) {
      const unlocked = await recordMastery(level.id);
      if (unlocked) {
        const u = getLevel(unlocked);
        setNewlyUnlockedLevel(u.name);
      }
    }
    setGameState('end-of-session');
  }

  function handleTileLongPress(tile: VocabItem) {
    if (hintedThisSessionRef.current.has(tile.id)) {
      feedbackTap();
      return;
    }
    hintedThisSessionRef.current.add(tile.id);
    speakGerman(tile.de);
  }

  function handlePlayAnother() {
    if (!level) { setGameState('level-select'); return; }
    setSession(buildSession(level));
    setRoundIdx(0);
    setCorrectFirstTry(0);
    resetSession();
    hintedThisSessionRef.current.clear();
    wrongTriesThisRoundRef.current = false;
    setNewlyUnlockedLevel(null);
    setGameState('playing');
  }

  function handleChooseLevel() {
    setGameState('level-select');
  }

  function handleSoftLockContinue() {
    acknowledgeSoftLimit();
    setGameState('playing');
  }

  function handleSoftLockDismiss() {
    acknowledgeSoftLimit();
    setGameState('end-of-session');
  }

  // Tile sizing — landscape iPad: 5 tiles in a single row, generous gaps.
  const horizontalPadding = THEME.spacing.xl;
  const availableWidth = width - horizontalPadding * 2;
  const tileGap = THEME.spacing.sm * 2;
  const tileSize = Math.min(180, Math.floor((availableWidth - tileGap * 5) / 5));

  if (!coinsReady || !timerReady || !levelsReady) {
    return (
      <SafeAreaView style={styles.loading} edges={['top', 'bottom']}>
        <Text style={styles.loadingText}>…</Text>
      </SafeAreaView>
    );
  }

  if (gameState === 'level-select') {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <LevelSelect states={levelStates} onPick={handlePickLevel} totalCoins={total} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.roundCounter}>
            {level?.name} · Round {Math.min(roundIdx + 1, ROUNDS_PER_SESSION)} / {ROUNDS_PER_SESSION}
          </Text>
          <Text style={styles.hint}>{t('long_press_hint')}</Text>
        </View>
        <View style={styles.headerCenter}>
          <SunTimer seconds={playedSeconds} width={Math.min(360, width * 0.32)} />
        </View>
        <View style={styles.headerRight}>
          <CoinBadge total={total} awardKey={awardKey} />
        </View>
      </View>

      {round && gameState !== 'end-of-session' && (
        <View key={`round-${roundIdx}`} style={styles.center}>
          <View style={styles.targetCard}>
            <Text style={styles.targetWord}>{round.target.en}</Text>
            <AudioButton onPress={() => speakEnglish(round.target.en)} />
            <RepeatButton resetKey={`${level?.id ?? 'x'}-${roundIdx}`} />
          </View>

          <View style={styles.tileRow}>
            {round.tiles.map((tile) => (
              <GameTile
                key={`${roundIdx}-${tile.id}`}
                item={tile}
                size={tileSize}
                onPress={() => handleTilePress(tile)}
                onLongPress={() => handleTileLongPress(tile)}
                flash={flashTileId === tile.id ? flashKind : null}
              />
            ))}
          </View>
        </View>
      )}

      {gameState === 'end-of-session' && (
        <EndOfSessionScreen
          sessionCoins={sessionCoins}
          totalCoins={total}
          dailyTargetJustHit={dailyTargetJustHit}
          levelLabel={level ? `${level.name} · ${correctFirstTry}/${ROUNDS_PER_SESSION} on first try` : undefined}
          newLevelUnlocked={newlyUnlockedLevel}
          onPlayAnother={handlePlayAnother}
          onChooseLevel={handleChooseLevel}
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
  targetCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  targetWord: {
    fontSize: 88,
    fontWeight: '800',
    color: THEME.colors.text,
    letterSpacing: -1,
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
});
