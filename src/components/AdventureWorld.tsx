import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  ADVENTURE_ROUNDS_PER_SESSION,
  THEME,
  type Level,
  type VocabItem,
  getVocab,
} from '../../content/v0';
import { AssetView } from './AssetView';
import { feedbackCorrect, feedbackTap, feedbackWrong } from '../lib/feedback';
import { speakEnglish } from '../lib/audio';

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
  emoji: string;
  bg: string;
  scenery: string[];
  sceneryCount: number;
  obstacle: { emoji: string; size: number };
  /** One-line narrative beat shown under the scenario title at round start. */
  intro: string;
}

/**
 * Fixed-order journey — like Mario worlds 1→5. The cat walks from a
 * forest at dawn through meadow, beach, snowfield, and ends under
 * starry night. Order matters: it's a story, not a shuffle. There are
 * exactly ADVENTURE_ROUNDS_PER_SESSION (5) entries; round N uses
 * SCENARIOS[N].
 */
const SCENARIOS: Scenario[] = [
  { id: 'forest', name: 'Forest',       emoji: '🌲', bg: '#E5EFD7', scenery: ['🌳', '🌲', '🌿', '🍄'], sceneryCount: 14, obstacle: { emoji: '🪵', size: 64 }, intro: 'The cat starts in a quiet forest…' },
  { id: 'meadow', name: 'Meadow',       emoji: '🌼', bg: '#FBF3CC', scenery: ['🌼', '🌸', '🌾', '🦋'], sceneryCount: 16, obstacle: { emoji: '🪨', size: 54 }, intro: 'Out into the sunny meadow…' },
  { id: 'beach',  name: 'Beach',        emoji: '🏖️', bg: '#FCE3A8', scenery: ['🐚', '⭐', '🌴', '🪸'], sceneryCount: 12, obstacle: { emoji: '🪨', size: 56 }, intro: 'Down to the warm sandy beach…' },
  { id: 'snow',   name: 'Snowfield',    emoji: '❄️', bg: '#E0ECF3', scenery: ['❄️', '🌨️', '🌲', '🐧'], sceneryCount: 16, obstacle: { emoji: '⛄', size: 64 }, intro: 'Into the cold snowy fields…' },
  { id: 'night',  name: 'Starry Night', emoji: '🌙', bg: '#D7D2EE', scenery: ['⭐', '✨', '🌙', '🦉'], sceneryCount: 14, obstacle: { emoji: '🪨', size: 50 }, intro: 'Home at last under the stars.' },
];

const CAT_SIZE = 88;
const TILE_SIZE = 110;

// Movement tuning — pixels per second for d-pad walking; jump impulse + gravity
// pull are in pixels-per-tick (TICK_MS = 33).
const WALK_SPEED_PX_PER_S = 380;
const TICK_MS = 33;
const JUMP_IMPULSE = -14;     // initial vy on jump button press
const GRAVITY_PER_TICK = 1.05; // pulls hopY back toward 0
const JUMP_CLEAR_THRESHOLD = -28; // hopY ≤ this → cat is high enough to clear obstacles

interface Inputs {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jumpRequested: boolean; // edge — consumed by the jump tick
}

/**
 * Player-controlled adventure mode: child drives the cat with the on-screen
 * D-pad (or arrow keys on web). Walk into the right word tile to claim it.
 * The obstacle blocks horizontal/vertical movement — must Jump to clear it.
 */
export function AdventureWorld({ level, onAward, onSessionComplete }: Props) {
  const { width, height } = useWindowDimensions();
  // Controls overlay the world (absolute), so the world fills all the height
  // not eaten by the header. No more vertical overflow.
  const headerH = 88;
  const worldH = Math.max(360, height - headerH - 24);
  const worldW = Math.min(width - 32, 1400);

  const pool = useMemo(() => level.vocabIds.map(getVocab), [level]);

  const [round, setRound] = useState(0);
  // Scenario is a function of round — Forest first, then Meadow, then Beach,
  // Snowfield, Starry Night. Like Mario worlds 1→5 (a journey, not a shuffle).
  const scenario = SCENARIOS[Math.min(round, SCENARIOS.length - 1)];
  const [target, setTarget] = useState<VocabItem>(() => pickTarget(pool, []));
  const [tiles, setTiles] = useState<PlacedTile[]>(() => placeTiles(pool, target, worldW, worldH));
  const [scenery, setScenery] = useState(() => placeScenery(scenario, worldW, worldH));
  const [obstacle, setObstacle] = useState(() => placeObstacle(scenario, worldW, worldH));
  const [correctFirstTry, setCorrectFirstTry] = useState(0);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const wrongTriesRef = useRef(false);
  const lastTargetIdsRef = useRef<string[]>([target.id]);

  const startX = worldW / 2 - CAT_SIZE / 2;
  const startY = worldH / 2 - CAT_SIZE / 2;
  const catX = useSharedValue(startX);
  const catY = useSharedValue(startY);
  const facing = useSharedValue(1);
  const hopY = useSharedValue(0);

  // Live state read by the frame loop.
  const inputsRef = useRef<Inputs>({ left: false, right: false, up: false, down: false, jumpRequested: false });
  const jumpStateRef = useRef<{ vy: number; airborne: boolean }>({ vy: 0, airborne: false });
  const lastTouchedRef = useRef<string | null>(null);
  const tilesRef = useRef(tiles);
  const obstacleRef = useRef(obstacle);
  const targetRef = useRef(target);
  tilesRef.current = tiles;
  obstacleRef.current = obstacle;
  targetRef.current = target;

  // Title fade-in per round.
  const titleOpacity = useSharedValue(0);
  useEffect(() => {
    titleOpacity.value = withSequence(
      withTiming(1, { duration: 350 }),
      withTiming(1, { duration: 900 }),
      withTiming(0, { duration: 500 }),
    );
  }, [scenario, round, titleOpacity]);

  // Re-centre cat on world resize (rare).
  useEffect(() => {
    catX.value = startX;
    catY.value = startY;
  }, [worldW, worldH, startX, startY, catX, catY]);

  // Auto-speak target on round change.
  useEffect(() => {
    const id = setTimeout(() => speakEnglish(target.en), 350);
    return () => clearTimeout(id);
  }, [target]);

  // Keyboard controls on web — arrow keys + space.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  inputsRef.current.left = true;
      if (e.key === 'ArrowRight') inputsRef.current.right = true;
      if (e.key === 'ArrowUp')    inputsRef.current.up = true;
      if (e.key === 'ArrowDown')  inputsRef.current.down = true;
      if (e.key === ' ' || e.key === 'Spacebar') {
        inputsRef.current.jumpRequested = true;
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  inputsRef.current.left = false;
      if (e.key === 'ArrowRight') inputsRef.current.right = false;
      if (e.key === 'ArrowUp')    inputsRef.current.up = false;
      if (e.key === 'ArrowDown')  inputsRef.current.down = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Frame loop — drives movement, gravity, collisions, tile triggers.
  useEffect(() => {
    const id = setInterval(() => {
      const inp = inputsRef.current;
      const jump = jumpStateRef.current;
      const speed = (WALK_SPEED_PX_PER_S * TICK_MS) / 1000;

      // ─── Horizontal/vertical input ───
      let dx = 0, dy = 0;
      if (inp.left) dx -= 1;
      if (inp.right) dx += 1;
      if (inp.up) dy -= 1;
      if (inp.down) dy += 1;
      const mag = Math.hypot(dx, dy);
      if (mag > 0) {
        dx = (dx / mag) * speed;
        dy = (dy / mag) * speed;
        if (dx !== 0) facing.value = dx > 0 ? 1 : -1;
      }

      // ─── Jump physics ───
      if (inp.jumpRequested && !jump.airborne) {
        jump.vy = JUMP_IMPULSE;
        jump.airborne = true;
      }
      inp.jumpRequested = false;

      if (jump.airborne) {
        jump.vy += GRAVITY_PER_TICK;
        const nextHop = hopY.value + jump.vy;
        if (nextHop >= 0) {
          hopY.value = 0;
          jump.vy = 0;
          jump.airborne = false;
        } else {
          hopY.value = nextHop;
        }
      }

      // ─── Move with obstacle blocking ───
      const fromX = catX.value;
      const fromY = catY.value;
      const tryX = clamp(fromX + dx, 0, worldW - CAT_SIZE);
      const tryY = clamp(fromY + dy, 0, worldH - CAT_SIZE);

      const obs = obstacleRef.current;
      const obsRect = {
        x: obs.x - obs.size / 2,
        y: obs.y - obs.size / 2,
        w: obs.size,
        h: obs.size,
      };
      const canPassObstacle = hopY.value <= JUMP_CLEAR_THRESHOLD;
      let nextX = tryX;
      let nextY = tryY;
      if (!canPassObstacle) {
        // Resolve X first, then Y — lets the cat slide along an obstacle edge.
        if (rectsOverlap({ x: tryX, y: fromY, w: CAT_SIZE, h: CAT_SIZE }, obsRect)) {
          nextX = fromX;
        }
        if (rectsOverlap({ x: nextX, y: tryY, w: CAT_SIZE, h: CAT_SIZE }, obsRect)) {
          nextY = fromY;
        }
      }
      catX.value = nextX;
      catY.value = nextY;

      // ─── Tile collision ───
      const cat = { x: nextX, y: nextY, w: CAT_SIZE, h: CAT_SIZE };
      let touched: string | null = null;
      for (const p of tilesRef.current) {
        const tx = p.fx * worldW - TILE_SIZE / 2;
        const ty = p.fy * worldH - TILE_SIZE / 2;
        if (rectsOverlap(cat, { x: tx, y: ty, w: TILE_SIZE, h: TILE_SIZE })) {
          touched = p.item.id;
          break;
        }
      }
      if (touched !== lastTouchedRef.current) {
        if (touched != null) {
          const placed = tilesRef.current.find(p => p.item.id === touched);
          if (placed) evaluate(placed);
        }
        lastTouchedRef.current = touched;
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [worldW, worldH, catX, catY, facing, hopY]);

  function evaluate(placed: PlacedTile) {
    if (placed.item.id === targetRef.current.id) {
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
      setTimeout(() => speakEnglish(targetRef.current.en), 250);
    }
  }

  function advanceRound() {
    const nextRound = round + 1;
    if (nextRound >= ADVENTURE_ROUNDS_PER_SESSION) {
      onSessionComplete(correctFirstTry + (wrongTriesRef.current ? 0 : 1));
      return;
    }
    const nextTarget = pickTarget(pool, lastTargetIdsRef.current);
    lastTargetIdsRef.current = [...lastTargetIdsRef.current.slice(-3), nextTarget.id];
    // Next scenario is dictated by the journey order (round → SCENARIOS[round]),
    // computed by the render — no scenario state to update here.
    const nextScenario = SCENARIOS[Math.min(nextRound, SCENARIOS.length - 1)];
    setRound(nextRound);
    setTarget(nextTarget);
    setTiles(placeTiles(pool, nextTarget, worldW, worldH));
    setScenery(placeScenery(nextScenario, worldW, worldH));
    setObstacle(placeObstacle(nextScenario, worldW, worldH));
    wrongTriesRef.current = false;
    // Re-centre cat for the new scene + clear any in-flight collision state.
    catX.value = startX;
    catY.value = startY;
    hopY.value = 0;
    jumpStateRef.current = { vy: 0, airborne: false };
    lastTouchedRef.current = null;
  }

  const catStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: catX.value },
      { translateY: catY.value + hopY.value },
      { scaleX: facing.value },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));

  const setInput = (key: keyof Inputs, val: boolean) => {
    inputsRef.current = { ...inputsRef.current, [key]: val };
  };
  const requestJump = () => {
    feedbackTap();
    inputsRef.current.jumpRequested = true;
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { width: worldW }]}>
        <Text style={styles.round}>{level.name} · {round + 1} / {ADVENTURE_ROUNDS_PER_SESSION}</Text>
        <Pressable
          onPress={() => speakEnglish(target.en)}
          style={({ pressed }) => [styles.targetPill, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.targetText}>Find the {target.en}</Text>
          <Text style={styles.speakerIcon}>🔊</Text>
        </Pressable>
        <Text style={styles.hint}>Use the arrows · Jump to leap</Text>
      </View>

      {/* World — controls are absolutely positioned children so the layout
          always fits regardless of viewport height. */}
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
          />
        ))}

        <Animated.View style={[styles.cat, catStyle]} pointerEvents="none">
          <Text style={styles.catEmoji}>🐱</Text>
        </Animated.View>

        <Animated.View style={[styles.titleWrap, titleStyle]} pointerEvents="none">
          <View style={styles.titleRow}>
            <Text style={styles.titleEmoji}>{scenario.emoji}</Text>
            <Text style={styles.titleText}>
              World {round + 1} · {scenario.name}
            </Text>
          </View>
          <Text style={styles.titleIntro}>{scenario.intro}</Text>
        </Animated.View>

        {/* Controls — overlay bottom-left D-pad cluster, bottom-right Jump.
            Use the responder system instead of Pressable: onPressOut on iOS
            Safari often doesn't fire when the finger drifts off the button,
            which left the cat "stuck" walking. onResponderRelease /
            onResponderTerminate together cover all release paths. */}
        <View style={styles.dpad} pointerEvents="box-none">
          <View style={styles.dpadRow}>
            <View style={styles.dpadSpacer} />
            <DpadButton label="↑" onIn={() => setInput('up', true)} onOut={() => setInput('up', false)} />
            <View style={styles.dpadSpacer} />
          </View>
          <View style={styles.dpadRow}>
            <DpadButton label="←" onIn={() => setInput('left', true)} onOut={() => setInput('left', false)} />
            <View style={styles.dpadSpacer} />
            <DpadButton label="→" onIn={() => setInput('right', true)} onOut={() => setInput('right', false)} />
          </View>
          <View style={styles.dpadRow}>
            <View style={styles.dpadSpacer} />
            <DpadButton label="↓" onIn={() => setInput('down', true)} onOut={() => setInput('down', false)} />
            <View style={styles.dpadSpacer} />
          </View>
        </View>

        <View
          style={styles.jumpBtn}
          accessibilityLabel="Jump"
          onStartShouldSetResponder={() => true}
          onResponderGrant={requestJump}
          onResponderTerminationRequest={() => false}
        >
          <Text style={styles.jumpEmoji}>⬆</Text>
          <Text style={styles.jumpLabel}>Jump</Text>
        </View>
      </View>
    </View>
  );
}

function DpadButton({ label, onIn, onOut }: { label: string; onIn: () => void; onOut: () => void }) {
  const [pressed, setPressed] = useState(false);
  const grant = () => { setPressed(true); onIn(); };
  const release = () => { setPressed(false); onOut(); };
  return (
    <View
      accessibilityLabel={`Move ${label}`}
      onStartShouldSetResponder={() => true}
      onResponderGrant={grant}
      onResponderRelease={release}
      onResponderTerminate={release}
      onResponderTerminationRequest={() => false}
      style={[
        styles.dpadBtn,
        pressed && { transform: [{ scale: 0.93 }], backgroundColor: THEME.colors.accent },
      ]}
    >
      <Text style={[styles.dpadLabel, pressed && { color: '#fff' }]}>{label}</Text>
    </View>
  );
}

function AdventureTile({
  placed, worldW, worldH, shake,
}: {
  placed: PlacedTile;
  worldW: number;
  worldH: number;
  shake: boolean;
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
      <View style={styles.tile}>
        <AssetView asset={placed.item.art} size={64} />
        <Text style={styles.tileLabel}>{placed.item.en}</Text>
      </View>
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
  const cx = 0.5;
  const cy = 0.5;
  const placed: PlacedTile[] = [];
  for (let i = 0; i < items.length; i++) {
    let attempt = 0;
    while (attempt < 80) {
      attempt++;
      const angle = (i / items.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const radius = 0.30 + Math.random() * 0.12;
      const fx = clamp(cx + Math.cos(angle) * radius, 0.12, 0.88);
      // Keep tiles out of the bottom corners where the D-pad and Jump button sit.
      const fy = clamp(cy + Math.sin(angle) * radius * (worldW / worldH), 0.16, 0.74);
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

function placeObstacle(scenario: Scenario, worldW: number, worldH: number) {
  const angle = Math.random() * Math.PI * 2;
  const fx = clamp(0.5 + Math.cos(angle) * 0.18, 0.20, 0.80);
  const fy = clamp(0.5 + Math.sin(angle) * 0.10 * (worldW / worldH), 0.25, 0.75);
  return { x: fx * worldW, y: fy * worldH, size: scenario.obstacle.size };
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

function rectsOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/* ──────────── styles ──────────── */

const DPAD_BTN_SIZE = 52;

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
  speakerIcon: { fontSize: 24 },
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
  scenery: { position: 'absolute', opacity: 0.55 },
  obstacle: {
    position: 'absolute',
    textAlign: 'center',
    textShadowColor: 'rgba(60,40,10,0.25)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  titleWrap: {
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleEmoji: { fontSize: 36 },
  titleText: {
    fontSize: 30,
    fontWeight: '800',
    color: THEME.colors.text,
    letterSpacing: -0.5,
    backgroundColor: 'rgba(255,255,255,0.78)',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: THEME.radius.pill,
    overflow: 'hidden',
  },
  titleIntro: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    color: THEME.colors.text,
    fontStyle: 'italic',
    backgroundColor: 'rgba(255,255,255,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: THEME.radius.pill,
    overflow: 'hidden',
  },
  tileWrap: { position: 'absolute', width: TILE_SIZE, height: TILE_SIZE },
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
  catEmoji: { fontSize: 76, lineHeight: 84 },

  /* ─ Controls — absolutely positioned overlays inside the world rect ─ */
  dpad: {
    position: 'absolute',
    left: 18,
    bottom: 18,
    alignItems: 'center',
  },
  dpadRow: { flexDirection: 'row' },
  dpadBtn: {
    width: DPAD_BTN_SIZE,
    height: DPAD_BTN_SIZE,
    margin: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 2,
    borderColor: 'rgba(60,40,10,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    // Disable native gestures (scroll/zoom on web Safari) on touch.
    touchAction: 'none',
    userSelect: 'none',
  },
  dpadLabel: { fontSize: 26, fontWeight: '800', color: THEME.colors.text },
  dpadSpacer: { width: DPAD_BTN_SIZE + 8, height: DPAD_BTN_SIZE + 8 },
  jumpBtn: {
    position: 'absolute',
    right: 24,
    bottom: 28,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: THEME.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 8,
    touchAction: 'none',
    userSelect: 'none',
  },
  jumpEmoji: { fontSize: 34, color: '#fff', lineHeight: 38 },
  jumpLabel: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});
