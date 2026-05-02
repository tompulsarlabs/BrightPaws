import {
  ROUND_TILE_COUNT,
  ROUNDS_PER_SESSION,
  VOCAB,
  getVocab,
  type Level,
  type VocabItem,
} from '../../content/v0';

export interface Round {
  target: VocabItem;
  /** length === ROUND_TILE_COUNT, includes the target somewhere; order randomised. */
  tiles: VocabItem[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a session for a given Level — ROUNDS_PER_SESSION rounds, each with
 * one target + (ROUND_TILE_COUNT - 1) distractors, all drawn from the
 * level's vocab pool. Targets are sampled without replacement up to the
 * pool size, then re-sampled.
 */
export function buildSession(level: Level): Round[] {
  const pool = level.vocabIds.map(getVocab);
  if (pool.length < ROUND_TILE_COUNT) {
    throw new Error(`Level "${level.id}" has only ${pool.length} words; need ≥ ${ROUND_TILE_COUNT}.`);
  }
  const targets: VocabItem[] = [];
  let bag = shuffle(pool);
  while (targets.length < ROUNDS_PER_SESSION) {
    if (bag.length === 0) bag = shuffle(pool);
    targets.push(bag.shift()!);
  }
  return targets.map(target => {
    const distractors = shuffle(pool.filter(v => v.id !== target.id)).slice(0, ROUND_TILE_COUNT - 1);
    const tiles = shuffle([target, ...distractors]);
    return { target, tiles };
  });
}

/** Re-export so call-sites that just want all words don't need a second import. */
export { VOCAB };
