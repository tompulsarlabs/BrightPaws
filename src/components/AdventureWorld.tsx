import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  ADVENTURE_ROUNDS_PER_SESSION,
  COINS_PER_CORRECT,
  THEME,
  type Level,
  type VocabItem,
  getVocab,
} from '../../content/v0';
import { AssetView } from './AssetView';
import { feedbackCorrect, feedbackTap, feedbackWrong } from '../lib/feedback';
import { speakEnglish } from '../lib/audio';
import { t } from '../lib/i18n';

interface Props {
  level: Level;
  onAward: () => void;
  onSessionComplete: (correctFirstTry: number) => void;
}

interface PlacedTile {
  item: VocabItem;
  /** centre coordinates as fractions of the world rect (0..1). */
  fx: number;
  fy: number;
}

interface Scenario {
  id: string;
  name: string;
  /** Emoji shown in the round-intro title. */
  emoji: string;
  /** World background tint. */
  bg: string;
  /** Decorative scenery emoji palette for this scene. */
  scenery: string[];
  /** Number of decorations to scatter. */
  sceneryCount: number;
  /** What the cat has to hop over to reach a tile. */
  obstacle: { emoji: string; size: number };
}

/**
 * Each round picks a different scenario for narrative variety. The cat,
 * tiles, and matching mechanic stay the same — only the world's mood
 * (background tint, scenery palette, obstacle type) changes.
 */
const SCENARIOS: Scenario[] = [
  { id: 'forest', name: 'Forest',  emoji: '🌲', bg: '#E5EFD7', scenery: ['🌳', '🌲', '🌿', '🍄'], sceneryCount: 14, obstacle: { emoji: '🪵', size: 64 } },
  { id: 'meadow', name: 'Meadow',  emoji: '🌼', bg: '#FBF3CC', scenery: ['🌼', '🌸', '🌾', '🦋'], sceneryCount: 16, obstacle: { emoji: '🪨', size: 54 } },
  { id: 'beach',  name: 'Beach',   emoji: '🏖️', bg: '#FCE3A8', scenery: ['🐚', '⭐', '🌴', '🪸'], sceneryCount: 12, obstacle: { emoji: '🪨', size: 56 } },
  { id: 'snow',   name: 'Snowfield', emoji: '❄️', bg: '#E0ECF3', scenery: ['❄️', '🌨️', '🌲', '🐧'], sceneryCount: 16, obstacle: { emoji: '⛄', size: 64 } },
  { id: 'night',  name: 'Starry Night', emoji: '🌙', bg: '#D7D2EE', scenery: ['⭐', '✨', '🌙', '🦉'], sceneryCount: 14, obstacle: { emoji: '🪨', size: 50 } },
];

const CAT_SIZE = 88;
const TILE_SIZE = 110;
const WALK_SPEED_PX_PER_S = 360;

/**
 * Top-down "adventure" mode. Cat starts at centre, child taps a word tile
 * to make her walk over to it. Reach the right tile → coin + next round.
 * Reach the wrong tile → soft buzz, target re-spoken, no penalty.
 *
 * Layout uses absolute positioning inside a fixed world rect, sized off
 * the viewport. Scenery + tile positions are randomised once per round
 * via useMemo (keyed on round + level) so the world feels fresh.
 */
export function AdventureWorld({ level, onAward, onSessionComplete }: Props) {
  const { width, height } = useWindowDimensions();
  const headerH = 96;
  const worldH = Math.max(360, height - headerH - 40);
  const worldW = Math.min(width - 32, 1200);

  const pool = useMemo(() => level.vocabIds.map(getVocab), [level]);

  const [round, setRound] = useState(0);
  const [scenario, setScenario] = useState<Scenario>(() => SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]);
  const [target, setTarget] = useState<VocabItem>(() => pickTarget(pool, []));
  const [tiles, setTiles] = useState<PlacedTile[]>(() => placeTiles(pool, target, worldW, worldH));
  const [scenery, setScenery] = useState(() => placeScenery(scenario, worldW, worldH));
  const [obstacle, setObstacle] = useState(() => placeObstacle(scenario, worldW, worldH));
  const [correctFirstTry, setCorrectFirstTry] = useState(0);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const wrongTriesRef = useRef(false);
  const lastTargetIdsRef = useRef<string[]>([target.id]);
  const lastScenarioIdRef = useRef<string>(scenario.id);

  // Cat position — start at world centre.
  const catX = useSharedValue(worldW / 2 - CAT_SIZE / 2);
  const catY = useSharedValue(worldH / 2 - CAT_SIZE / 2);
  const facing = useSharedValue(1); // 1 = right, -1 = left
  const hopY = useSharedValue(0); // additional Y offset for hop-over-obstacle arcs

  // Scenario intro title — fades in then out at round start.
  const titleOpacity = useSharedValue(0);
  useEffect(() => {
    titleOpacity.value = withSequence(
      withTiming(1, { duration: 350 }),
      withTiming(1, { duration: 900 }),
      withTiming(0, { duration: 500 }),
    );
  }, [scenario, round, titleOpacity]);

  // Re-centre cat if viewport size changes mid-game (rare).
  useEffect(() => {
    catX.value = worldW / 2 - CAT_SIZE / 2;
    catY.value = worldH / 2 - CAT_SIZE / 2;
  }, [worldW, worldH, catX, catY]);

  // Auto-speak the target on round change so she always hears what to find.
  useEffect(() => {
    const id = setTimeout(() => speakEnglish(target.en), 350);
    return () => clearTimeout(id);
  }, [target]);

  function advanceRound() {
    const nextRound = round + 1;
    if (nextRound >= ADVENTURE_ROUNDS_PER_SESSION) {
      onSessionComplete(correctFirstTry + (wrongTriesRef.current ? 0 : 1));
      return;
    }
    const nextTarget = pickTarget(pool, lastTargetIdsRef.current);
    lastTargetIdsRef.current = [...lastTargetIdsRef.current.slice(-3), nextTarget.id];
    const nextScenario = pickScenario(lastScenarioIdRef.current);
    lastScenarioIdRef.current = nextScenario.id;
    setRound(nextRound);
    setScenario(nextScenario);
    setTarget(nextTarget);
    setTiles(placeTiles(pool, nextTarget, worldW, worldH));
    setScenery(placeScenery(nextScenario, worldW, worldH));
    setObstacle(placeObstacle(nextScenario, worldW, worldH));
    wrongTriesRef.current = false;
  }

  function walkTo(targetX: number, targetY: number, onArrive?: () => void) {
    const fromX = catX.value;
    const fromY = catY.value;
    const dx = targetX - fromX;
    const dy = targetY - fromY;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const durationMs = Math.min(2000, Math.max(220, (dist / WALK_SPEED_PX_PER_S) * 1000));
    if (dx !== 0) facing.value = dx > 0 ? 1 : -1;
    setBusy(true);
    catX.value = withTiming(targetX, { duration: durationMs });
    catY.value = withTiming(targetY, { duration: durationMs }, (finished) => {
      if (finished && onArrive) runOnJSDelay(onArrive, 0);
    });

    // Compute whether the cat's path crosses the obstacle. If so, schedule
    // a hop arc on hopY at the moment the cat reaches the obstacle's x.
    const obsCx = obstacle.x;
    const obsCy = obstacle.y;
    const catCxFrom = fromX + CAT_SIZE / 2;
    const catCyFrom = fromY + CAT_SIZE / 2;
    const catCxTo = targetX + CAT_SIZE / 2;
    const catCyTo = targetY + CAT_SIZE / 2;
    let hopAtMs: number | null = null;
    if (Math.abs(catCxTo - catCxFrom) > 4) {
      const f = (obsCx - catCxFrom) / (catCxTo - catCxFrom);
      if (f > 0.06 && f < 0.94) {
        const catCyAtCrossing = catCyFrom + (catCyTo - catCyFrom) * f;
        const verticalGap = Math.abs(catCyAtCrossing - obsCy);
        if (verticalGap < (obstacle.size / 2 + CAT_SIZE / 2 + 24)) {
          hopAtMs = Math.max(0, f * durationMs - 140);
        }
      }
    }
    if (hopAtMs !== null) {
      const hopHeight = -56;
      hopY.value = withDelay(hopAtMs, withSequence(
        withTiming(hopHeight, { duration: 200, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 240, easing: Easing.in(Easing.quad) }),
      ));
    } else {
      // Subtle walking bob — no obstacle to hop. Use a single half-sine
      // so we don't overlap with a hop on the next walk.
      const bobs = Math.max(2, Math.floor(durationMs / 220));
      hopY.value = withSequence(
        ...Array.from({ length: bobs }, (_, i) =>
          withTiming(i % 2 === 0 ? -5 : 0, { duration: 220 }),
        ),
        withTiming(0, { duration: 60 }),
      );
    }
  }

  function handleTilePress(placed: PlacedTile) {
    if (busy) return;
    feedbackTap();
    // Stop a step short of the tile centre so the cat appears to greet it.
    const targetCenterX = placed.fx * worldW;
    const targetCenterY = placed.fy * worldH;
    const fromX = catX.value + CAT_SIZE / 2;
    const fromY = catY.value + CAT_SIZE / 2;
    const dx = targetCenterX - fromX;
    const dy = targetCenterY - fromY;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const stopShort = Math.min(dist, TILE_SIZE * 0.55);
    const arriveX = fromX + (dx / dist) * (dist - stopShort) - CAT_SIZE / 2;
    const arriveY = fromY + (dy / dist) * (dist - stopShort) - CAT_SIZE / 2;
    walkTo(arriveX, arriveY, () => evaluate(placed));
  }

  function evaluate(placed: PlacedTile) {
    setBusy(false);
    if (placed.item.id === target.id) {
      feedbackCorrect();
      onAward();
      if (!wrongTriesRef.current) setCorrectFirstTry(c => c + 1);
      setShakeId(placed.item.id);
      setTimeout(() => { setShakeId(null); advanceRound(); }, 700);
    } else {
      feedbackWrong();
      wrongTriesRef.current = true;
      setShakeId(placed.item.id);
      setTimeout(() => setShakeId(null), 500);
      // Re-speak the target so she knows what to look for.
      setTimeout(() => speakEnglish(target.en), 250);
    }
  }

  const catStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: catX.value },
      { translateY: catY.value + hopY.value },
      { scaleX: facing.value },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));

  return (
    <View style={styles.root}>
      {/* Header — target prompt + audio re-play */}
      <View style={[styles.header, { width: worldW }]}>
        <Text style={styles.round}>{level.name} · {round + 1} / {ADVENTURE_ROUNDS_PER_SESSION}</Text>
        <Pressable
          onPress={() => speakEnglish(target.en)}
          style={({ pressed }) => [styles.targetPill, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.targetText}>{t('adventure_prompt', target.en)}</Text>
          <Text style={styles.speakerIcon}>🔊</Text>
        </Pressable>
        <Text style={styles.hint}>{t('adventure_hint')}</Text>
      </View>

      {/* World — scenery, tiles, obstacle, cat */}
      <View
        style={[styles.world, { width: worldW, height: worldH, backgroundColor: scenario.bg }]}
        pointerEvents="box-none"
      >
        {scenery.map((s, i) => (
          <Text
            key={`scn-${i}`}
            style={[styles.scenery, { left: s.x, top: s.y, fontSize: s.size }]}
            pointerEvents="none"
          >
            {s.emoji}
          </Text>
        ))}

        {/* The obstacle the cat hops over when its path crosses. */}
        <Text
          style={[
            styles.obstacle,
            {
              left: obstacle.x - obstacle.size / 2,
              top: obstacle.y - obstacle.size / 2,
              fontSize: obstacle.size,
            },
          ]}
          pointerEvents="none"
        >
          {scenario.obstacle.emoji}
        </Text>

        {tiles.map(p => (
          <AdventureTile
            key={`${round}-${p.item.id}`}
            placed={p}
            worldW={worldW}
            worldH={worldH}
            shake={shakeId === p.item.id}
            onPress={() => handleTilePress(p)}
          />
        ))}

        <Animated.View style={[styles.cat, catStyle]} pointerEvents="none">
          <Text style={styles.catEmoji}>🐱</Text>
        </Animated.View>

        {/* Scenario intro title — fades in then out at round start. */}
        <Animated.View style={[styles.titleWrap, titleStyle]} pointerEvents="none">
          <Text style={styles.titleEmoji}>{scenario.emoji}</Text>
          <Text style={styles.titleText}>{scenario.name}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

function AdventureTile({
  placed, worldW, worldH, shake, onPress,
}: {
  placed: PlacedTile;
  worldW: number;
  worldH: number;
  shake: boolean;
  onPress: () => void;
}) {
  const tx = placed.fx * worldW - TILE_SIZE / 2;
  const ty = placed.fy * worldH - TILE_SIZE / 2;
  const shakeX = useSharedValue(0);
  useEffect(() => {
    if (!shake) return;
    shakeX.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withSpring(0, { damping: 14, stiffness: 240 }),
    );
  }, [shake, shakeX]);
  const aniStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  return (
    <Animated.View style={[styles.tileWrap, { left: tx, top: ty }, aniStyle]}>
      <Pressable onPress={onPress} style={({ pressed }) => [
        styles.tile,
        pressed && { transform: [{ scale: 0.96 }] },
      ]}>
        <AssetView asset={placed.item.art} size={64} />
        <Text style={styles.tileLabel}>{placed.item.en}</Text>
      </Pressable>
    </Animated.View>
  );
}

/* ──────────── helpers ──────────── */

function pickTarget(pool: VocabItem[], avoidIds: string[]): VocabItem {
  const candidates = pool.filter(v => !avoidIds.includes(v.id));
  const set = candidates.length > 0 ? candidates : pool;
  return set[Math.floor(Math.random() * set.length)];
}

function placeTiles(pool: VocabItem[], target: VocabItem, worldW: number, worldH: number): PlacedTile[] {
  const distractors = pool.filter(v => v.id !== target.id);
  shuffleInPlace(distractors);
  const items = [target, ...distractors.slice(0, 4)];
  shuffleInPlace(items);

  // Place around an annulus from centre — keeps tiles away from the cat's
  // start position and away from the world edges.
  const cx = 0.5;
  const cy = 0.5;
  const placed: PlacedTile[] = [];
  const minSep = (TILE_SIZE * 1.4) / Math.min(worldW, worldH);
  for (let i = 0; i < items.length; i++) {
    let attempt = 0;
    while (attempt < 80) {
      attempt++;
      const angle = (i / items.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const radius = 0.30 + Math.random() * 0.14;
      const fx = clamp(cx + Math.cos(angle) * radius, 0.10, 0.90);
      const fy = clamp(cy + Math.sin(angle) * radius * (worldW / worldH), 0.16, 0.84);
      const ok = placed.every(p => Math.hypot((p.fx - fx) * worldW, (p.fy - fy) * worldH) > TILE_SIZE * 1.2);
      if (ok) { placed.push({ item: items[i], fx, fy }); break; }
      if (attempt === 80) placed.push({ item: items[i], fx, fy });
    }
  }
  return placed;
}

function placeScenery(scenario: Scenario, worldW: number, worldH: number) {
  const palette = scenario.scenery;
  const result: { x: number; y: number; size: number; emoji: string }[] = [];
  for (let i = 0; i < scenario.sceneryCount; i++) {
    result.push({
      x: Math.random() * (worldW - 40),
      y: Math.random() * (worldH - 40),
      size: 22 + Math.random() * 16,
      emoji: palette[Math.floor(Math.random() * palette.length)],
    });
  }
  return result;
}

/**
 * Place the obstacle somewhere in the middle band of the world — far
 * enough from the cat's centre-start to be on a likely path, far enough
 * from the edges that tiles aren't placed on top of it.
 */
function placeObstacle(scenario: Scenario, worldW: number, worldH: number) {
  // Pick a position in a ring around centre — biased toward horizontal
  // displacement so the cat actually walks past it on her way to a tile.
  const angle = Math.random() * Math.PI * 2;
  const fx = clamp(0.5 + Math.cos(angle) * 0.18, 0.20, 0.80);
  const fy = clamp(0.5 + Math.sin(angle) * 0.10 * (worldW / worldH), 0.25, 0.75);
  return { x: fx * worldW, y: fy * worldH, size: scenario.obstacle.size };
}

function pickScenario(prevId: string): Scenario {
  const others = SCENARIOS.filter(s => s.id !== prevId);
  return others[Math.floor(Math.random() * others.length)];
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** runOnJS-style helper. The reanimated runOnJS import is finicky across
 *  versions; setTimeout(fn, 0) reaches the JS thread reliably. */
function runOnJSDelay(fn: () => void, ms: number) {
  setTimeout(fn, ms);
}

/* ──────────── styles ──────────── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    paddingTop: THEME.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    gap: THEME.spacing.md,
  },
  round: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.4,
    minWidth: 140,
  },
  targetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.colors.card,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.radius.pill,
    borderWidth: 2,
    borderColor: THEME.colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  targetText: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.text,
    letterSpacing: -0.3,
  },
  speakerIcon: {
    fontSize: 24,
  },
  hint: {
    fontSize: 13,
    fontStyle: 'italic',
    color: THEME.colors.textMuted,
    minWidth: 140,
    textAlign: 'right',
  },
  world: {
    backgroundColor: THEME.colors.bgAlt,
    borderRadius: THEME.radius.card,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: THEME.colors.cardBorder,
  },
  scenery: {
    position: 'absolute',
    opacity: 0.55,
  },
  obstacle: {
    position: 'absolute',
    textAlign: 'center',
    // Slight drop-shadow on the emoji glyph itself so it reads as "in the world".
    textShadowColor: 'rgba(60,40,10,0.25)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  titleWrap: {
    position: 'absolute',
    top: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  titleEmoji: { fontSize: 38 },
  titleText: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.colors.text,
    letterSpacing: -0.5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: THEME.radius.pill,
    overflow: 'hidden',
  },
  tileWrap: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  tile: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: THEME.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 5,
  },
  tileLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.text,
    marginTop: 4,
  },
  cat: {
    position: 'absolute',
    width: CAT_SIZE,
    height: CAT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEmoji: {
    fontSize: 76,
    lineHeight: 84,
  },
});
