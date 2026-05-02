/**
 * v0 content pack — Margo EN Tutor
 *
 * Single source of truth for the prototype: vocabulary, character roster,
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

export type CharacterFamily = 'cat' | 'dachshund' | 'grogu' | 'world';

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
 * v0 vocabulary — 12 items spanning the three character families plus
 * "world" (objects from their world). Visually distinct on a tile-grid so a
 * 7-year-old can tell them apart at a glance.
 */
export const VOCAB: VocabItem[] = [
  { id: 'cat',       en: 'cat',       de: 'Katze',     family: 'cat',       art: { type: 'emoji', value: '🐱' } },
  { id: 'fish',      en: 'fish',      de: 'Fisch',     family: 'cat',       art: { type: 'emoji', value: '🐟' } },
  { id: 'milk',      en: 'milk',      de: 'Milch',     family: 'cat',       art: { type: 'emoji', value: '🥛' } },
  { id: 'ball',      en: 'ball',      de: 'Ball',      family: 'cat',       art: { type: 'emoji', value: '⚽' } },
  { id: 'dog',       en: 'dog',       de: 'Hund',      family: 'dachshund', art: { type: 'emoji', value: '🐶' } },
  { id: 'sausage',   en: 'sausage',   de: 'Wurst',     family: 'dachshund', art: { type: 'emoji', value: '🌭' } },
  { id: 'tree',      en: 'tree',      de: 'Baum',      family: 'dachshund', art: { type: 'emoji', value: '🌳' } },
  { id: 'sun',       en: 'sun',       de: 'Sonne',     family: 'dachshund', art: { type: 'emoji', value: '☀️' } },
  { id: 'grogu',     en: 'Grogu',     de: 'Grogu',     family: 'grogu',     art: { type: 'placeholder', label: 'Grogu', bg: '#9BC97A', fg: '#1F3D17' } },
  { id: 'star',      en: 'star',      de: 'Stern',     family: 'grogu',     art: { type: 'emoji', value: '⭐' } },
  { id: 'moon',      en: 'moon',      de: 'Mond',      family: 'grogu',     art: { type: 'emoji', value: '🌙' } },
  { id: 'apple',     en: 'apple',     de: 'Apfel',     family: 'world',     art: { type: 'emoji', value: '🍎' } },
];

/** A round = one target word + N distractors drawn from the rest of VOCAB. */
export const ROUND_TILE_COUNT = 5;
export const ROUNDS_PER_SESSION = 10;
export const COINS_PER_CORRECT = 1;
export const DAILY_COIN_TARGET = 10;
export const DAILY_SOFT_LIMIT_SECONDS = 30 * 60; // 30 minutes

/**
 * Theme tokens — pastel-forest-ish palette, soft shadows, large rounded
 * shapes, generous spacing. Tuned for a 7-year-old on iPad.
 */
export const THEME = {
  colors: {
    /** Page background: warm cream that looks like aged paper. */
    bg: '#F4EFE2',
    bgAlt: '#FAF6EC',

    /** Tile + card surfaces. */
    card: '#FFFFFF',
    cardBorder: '#E8DFC9',
    cardShadow: 'rgba(60, 40, 10, 0.10)',

    /** Primary accent — a confident sage green. */
    accent: '#5A8C5A',
    accentSoft: '#C7DDC4',

    /** Secondary accent for coins and reward signals. */
    coin: '#E0A93B',
    coinSoft: '#FBE7B8',

    /** Text. */
    text: '#2E2A1F',
    textMuted: '#6E6852',

    /** Per-family bands (for subtle tinted borders or backdrops). */
    familyCat: '#E9D5F0',       // soft lavender
    familyDachshund: '#F5D6BC', // warm peach
    familyGrogu: '#D5E8C0',     // green-tea
    familyWorld: '#E5E5DA',     // neutral
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
    /** Massive headline for the target word — must read across the room. */
    target: { fontSize: 88, fontWeight: '800' as const, letterSpacing: -1 },
    title:  { fontSize: 32, fontWeight: '700' as const },
    body:   { fontSize: 20, fontWeight: '500' as const },
    coin:   { fontSize: 28, fontWeight: '800' as const },
  },
} as const;

/**
 * Copy strings — single English locale for v0. Wrapped through the t()
 * helper in src/lib/i18n.ts so we can wire real i18n without code churn
 * once Tom decides on bilingual scaffolding strategy.
 */
export const STRINGS = {
  audio_button_label: 'Tap to hear',
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
} as const;

export type StringKey = keyof typeof STRINGS;
