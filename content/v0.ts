/**
 * v0 content pack — Margaux EN Tutor
 *
 * Single source of truth for the prototype: vocabulary, level structure,
 * theme tokens, copy strings. Swap this file (or fields within it) without
 * touching app code. See IP-NOTES.md re: Grogu placeholder.
 *
 * Asset pipeline:
 *   AssetRef supports three forms — `emoji` (current placeholders), `image`
 *   (drop a PNG into assets/words/ and switch the type), and `placeholder`
 *   (a coloured chip with a label, used for Grogu until real art arrives).
 *   Replacing a word's art is a one-line edit on its `art` field.
 */

import type { ImageSourcePropType } from 'react-native';

export type AssetRef =
  | { type: 'emoji'; value: string }
  | { type: 'image'; source: ImageSourcePropType }
  | { type: 'placeholder'; label: string; bg: string; fg?: string };

export type CharacterFamily = 'cat' | 'dachshund' | 'grogu' | 'forest' | 'world';

export interface VocabItem {
  /** stable id — never change after a word is in the wild (referenced by AsyncStorage). */
  id: string;
  /** the English word the child sees + hears. */
  en: string;
  /** German translation, used for the once-per-session long-press audio hint only. */
  de: string;
  /** which character family this word belongs to (for theming + grouping later). */
  family: CharacterFamily;
  /** the visual asset for the word's tile. */
  art: AssetRef;
}

/**
 * Master vocabulary. Levels (below) cherry-pick from this list by id.
 * Every word here is high-frequency English appropriate for a 7-year-old
 * with daily passive English exposure. Distinct emoji per word so a tile
 * grid is visually unambiguous.
 */
export const VOCAB: VocabItem[] = [
  // Level 1 set — ten very high-frequency nouns.
  { id: 'cat',     en: 'cat',     de: 'Katze',  family: 'cat',       art: { type: 'emoji', value: '🐱' } },
  { id: 'dog',     en: 'dog',     de: 'Hund',   family: 'dachshund', art: { type: 'emoji', value: '🐶' } },
  { id: 'mouse',   en: 'mouse',   de: 'Maus',   family: 'forest',    art: { type: 'emoji', value: '🐭' } },
  { id: 'fish',    en: 'fish',    de: 'Fisch',  family: 'cat',       art: { type: 'emoji', value: '🐟' } },
  { id: 'bird',    en: 'bird',    de: 'Vogel',  family: 'forest',    art: { type: 'emoji', value: '🐦' } },
  { id: 'tree',    en: 'tree',    de: 'Baum',   family: 'forest',    art: { type: 'emoji', value: '🌳' } },
  { id: 'sun',     en: 'sun',     de: 'Sonne',  family: 'world',     art: { type: 'emoji', value: '☀️' } },
  { id: 'moon',    en: 'moon',    de: 'Mond',   family: 'grogu',     art: { type: 'emoji', value: '🌙' } },
  { id: 'apple',   en: 'apple',   de: 'Apfel',  family: 'world',     art: { type: 'emoji', value: '🍎' } },
  { id: 'milk',    en: 'milk',    de: 'Milch',  family: 'cat',       art: { type: 'emoji', value: '🥛' } },
  { id: 'ball',    en: 'ball',    de: 'Ball',   family: 'cat',       art: { type: 'emoji', value: '⚽' } },
  { id: 'book',    en: 'book',    de: 'Buch',   family: 'world',     art: { type: 'emoji', value: '📖' } },

  // Level 2 set — more animals (Tom asked for these) + a few more objects.
  { id: 'bear',    en: 'bear',    de: 'Bär',     family: 'forest',    art: { type: 'emoji', value: '🐻' } },
  { id: 'fox',     en: 'fox',     de: 'Fuchs',   family: 'forest',    art: { type: 'emoji', value: '🦊' } },
  { id: 'rabbit',  en: 'rabbit',  de: 'Hase',    family: 'forest',    art: { type: 'emoji', value: '🐰' } },
  { id: 'owl',     en: 'owl',     de: 'Eule',    family: 'forest',    art: { type: 'emoji', value: '🦉' } },
  { id: 'frog',    en: 'frog',    de: 'Frosch',  family: 'forest',    art: { type: 'emoji', value: '🐸' } },
  { id: 'sausage', en: 'sausage', de: 'Wurst',   family: 'dachshund', art: { type: 'emoji', value: '🌭' } },
  { id: 'grogu',   en: 'Grogu',   de: 'Grogu',   family: 'grogu',     art: { type: 'placeholder', label: 'Grogu', bg: '#9BC97A', fg: '#1F3D17' } },
  { id: 'star',    en: 'star',    de: 'Stern',   family: 'grogu',     art: { type: 'emoji', value: '⭐' } },
  { id: 'flower',  en: 'flower',  de: 'Blume',   family: 'world',     art: { type: 'emoji', value: '🌸' } },
  { id: 'house',   en: 'house',   de: 'Haus',    family: 'world',     art: { type: 'emoji', value: '🏠' } },
  { id: 'car',     en: 'car',     de: 'Auto',    family: 'world',     art: { type: 'emoji', value: '🚗' } },
  { id: 'cake',    en: 'cake',    de: 'Kuchen',  family: 'world',     art: { type: 'emoji', value: '🍰' } },
];

const VOCAB_BY_ID: Record<string, VocabItem> = Object.fromEntries(VOCAB.map(v => [v.id, v]));

/** Look up a VocabItem by id; throws on miss so level data bugs surface loudly. */
export function getVocab(id: string): VocabItem {
  const v = VOCAB_BY_ID[id];
  if (!v) throw new Error(`Unknown vocab id: ${id}`);
  return v;
}

/* ───────────────────────── Levels ───────────────────────── */

export type LevelMode = 'tap-match' | 'adventure';

export interface Level {
  /** stable id — referenced by AsyncStorage mastery records. */
  id: string;
  /** display name on the level select screen. */
  name: string;
  /** short tagline shown beneath the name. */
  tagline: string;
  /** emoji that represents this world on the level select tile. */
  emoji: string;
  /** background tint for this world's tile. */
  bg: string;
  /** vocab pool — round generator picks targets + distractors from here. */
  vocabIds: string[];
  /** id of a level that must be mastered (≥ MASTERY_THRESHOLD twice) to unlock this one. */
  unlockAfter: string | null;
  /** Game mechanic for this level. Defaults to 'tap-match'. */
  mode?: LevelMode;
}

export const LEVELS: Level[] = [
  {
    id: 'forest',
    name: 'Forest',
    tagline: 'First words — animals & things',
    emoji: '🌲',
    bg: '#D5E8C0',
    vocabIds: ['cat', 'dog', 'mouse', 'fish', 'bird', 'tree', 'sun', 'moon', 'apple', 'milk', 'ball', 'book'],
    unlockAfter: null,
  },
  {
    id: 'meadow',
    name: 'Meadow',
    tagline: 'More animals & a wider world',
    emoji: '🌼',
    bg: '#F5D6BC',
    vocabIds: ['bear', 'fox', 'rabbit', 'owl', 'frog', 'sausage', 'grogu', 'star', 'flower', 'house', 'car', 'cake'],
    unlockAfter: 'forest',
  },
  {
    id: 'adventure',
    name: 'Adventure',
    tagline: 'Walk the cat to the right word',
    emoji: '🐱',
    bg: '#FCE8B8',
    // Reuses the Forest pool so it works on day one without prerequisite mastery.
    vocabIds: ['cat', 'dog', 'mouse', 'fish', 'bird', 'tree', 'sun', 'moon', 'apple', 'milk', 'ball', 'book'],
    unlockAfter: null,
    mode: 'adventure',
  },
];

export function getLevel(id: string): Level {
  const l = LEVELS.find(x => x.id === id);
  if (!l) throw new Error(`Unknown level id: ${id}`);
  return l;
}

/* ───────────────────────── Tunables ───────────────────────── */

export const ROUND_TILE_COUNT = 5;
export const ROUNDS_PER_SESSION = 10;
/** Adventure mode is shorter — exploration eats more time per round. */
export const ADVENTURE_ROUNDS_PER_SESSION = 5;
export const COINS_PER_CORRECT = 1;
export const DAILY_COIN_TARGET = 10;
export const DAILY_SOFT_LIMIT_SECONDS = 30 * 60;

/** Mastery threshold per round-session: ≥ this many correct on first try counts as mastered. */
export const MASTERY_CORRECT_THRESHOLD = 8;
/** ...and we want this many mastered sessions on the current level before unlocking the next. */
export const MASTERY_SESSIONS_REQUIRED = 2;

/* ───────────────────────── Theme ───────────────────────── */

export const THEME = {
  colors: {
    bg: '#F4EFE2',
    bgAlt: '#FAF6EC',

    card: '#FFFFFF',
    cardBorder: '#E8DFC9',
    cardShadow: 'rgba(60, 40, 10, 0.10)',

    accent: '#5A8C5A',
    accentSoft: '#C7DDC4',

    coin: '#E0A93B',
    coinSoft: '#FBE7B8',

    /** Voice / repeat-after-me action — warm rust so it doesn't compete with audio-out green. */
    voice: '#C25A3A',
    voiceSoft: '#F1CFC3',
    voiceLive: '#E63946',

    text: '#2E2A1F',
    textMuted: '#6E6852',

    /** Per-family band tints (for the underline beneath each tile). */
    familyCat: '#E9D5F0',
    familyDachshund: '#F5D6BC',
    familyGrogu: '#D5E8C0',
    familyForest: '#CFE7CE',
    familyWorld: '#E5E5DA',
  },
  radius: {
    tile: 28,
    card: 32,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 12,
    md: 18,
    lg: 28,
    xl: 44,
  },
  type: {
    target: { fontSize: 88, fontWeight: '800' as const, letterSpacing: -1 },
    title:  { fontSize: 32, fontWeight: '700' as const },
    body:   { fontSize: 20, fontWeight: '500' as const },
    coin:   { fontSize: 28, fontWeight: '800' as const },
  },
} as const;

/* ───────────────────────── Copy ───────────────────────── */

export const STRINGS = {
  audio_button_label: 'Tap to hear',
  voice_button_idle: 'Now you say it',
  voice_button_recording: 'Listening…',
  voice_button_playing: 'Nice!',
  long_press_hint: 'Hold an animal for a German clue',
  coins_label: 'coins',
  end_of_session_title: 'Great round!',
  end_of_session_subtitle_one: 'You earned %d coin this round.',
  end_of_session_subtitle_many: 'You earned %d coins this round.',
  end_of_session_total: 'Total: %d %s',
  play_another: 'Play another round',
  daily_target_hit: 'You hit your %d-coin goal today!',
  soft_limit_title: 'Great session!',
  soft_limit_body: "Let's give your eyes a little rest.",
  soft_limit_continue: 'One more round',
  soft_limit_dismiss: 'All done for today',
  level_select_title: 'Pick a world',
  level_locked: 'Master the previous world to open this one',
  mic_permission_blocked: 'Tap is fine — voice needs microphone',
  adventure_prompt: 'Find the %s',
  adventure_hint: 'Tap a tile — the cat will walk to it',
} as const;

export type StringKey = keyof typeof STRINGS;
