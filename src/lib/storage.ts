import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_COINS_TOTAL = '@margo/coins.total';
const KEY_DAILY_PLAY_PREFIX = '@margo/play.';
const KEY_DAILY_TARGET_HIT_PREFIX = '@margo/dailyTargetHit.';

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
