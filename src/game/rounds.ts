import { ROUND_TILE_COUNT, ROUNDS_PER_SESSION, VOCAB, type VocabItem } from '../../content/v0';

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
 * Build a session — ROUNDS_PER_SESSION rounds, each with one target +
 * (ROUND_TILE_COUNT - 1) distractors. Targets across the session are
 * sampled without replacement up to VOCAB.length, then re-sampled.
 */
export function buildSession(): Round[] {
  const targets: VocabItem[] = [];
  let pool = shuffle(VOCAB);
  while (targets.length < ROUNDS_PER_SESSION) {
    if (pool.length === 0) pool = shuffle(VOCAB);
    targets.push(pool.shift()!);
  }
  return targets.map(target => {
    const distractors = shuffle(VOCAB.filter(v => v.id !== target.id)).slice(0, ROUND_TILE_COUNT - 1);
    const tiles = shuffle([target, ...distractors]);
    return { target, tiles };
  });
}
