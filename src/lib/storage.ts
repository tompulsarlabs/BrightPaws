import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_COINS_TOTAL = '@margo/coins.total';
const KEY_DAILY_PLAY_PREFIX = '@margo/play.';
const KEY_DAILY_TARGET_HIT_PREFIX = '@margo/dailyTargetHit.';
const KEY_LEVEL_MASTERY_PREFIX = '@margo/level.mastery.';
const KEY_LAST_LEVEL = '@margo/level.last';

export async function loadCoinsTotal(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEY_COINS_TOTAL);
  return raw ? Number(raw) || 0 : 0;
}

export async function saveCoinsTotal(total: number): Promise<void> {
  await AsyncStorage.setItem(KEY_COINS_TOTAL, String(total));
}

/** YYYY-MM-DD in local time — cumulative play time is bucketed per local day. */
export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function loadDailyPlaySeconds(date = todayKey()): Promise<number> {
  const raw = await AsyncStorage.getItem(KEY_DAILY_PLAY_PREFIX + date);
  return raw ? Number(raw) || 0 : 0;
}

export async function saveDailyPlaySeconds(seconds: number, date = todayKey()): Promise<void> {
  await AsyncStorage.setItem(KEY_DAILY_PLAY_PREFIX + date, String(Math.floor(seconds)));
}

export async function hasHitDailyTargetToday(date = todayKey()): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEY_DAILY_TARGET_HIT_PREFIX + date);
  return raw === '1';
}

export async function markDailyTargetHit(date = todayKey()): Promise<void> {
  await AsyncStorage.setItem(KEY_DAILY_TARGET_HIT_PREFIX + date, '1');
}

/* ───────── Level mastery ───────── */

/** How many ≥-threshold sessions this level has been completed in. */
export async function loadLevelMastery(levelId: string): Promise<number> {
  const raw = await AsyncStorage.getItem(KEY_LEVEL_MASTERY_PREFIX + levelId);
  return raw ? Number(raw) || 0 : 0;
}

export async function bumpLevelMastery(levelId: string): Promise<number> {
  const current = await loadLevelMastery(levelId);
  const next = current + 1;
  await AsyncStorage.setItem(KEY_LEVEL_MASTERY_PREFIX + levelId, String(next));
  return next;
}

/** The level the child was last on, restored across launches. */
export async function loadLastLevelId(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_LAST_LEVEL);
}

export async function saveLastLevelId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEY_LAST_LEVEL, id);
}
