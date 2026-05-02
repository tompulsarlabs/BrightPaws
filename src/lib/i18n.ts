import { STRINGS, type StringKey } from '../../content/v0';

/**
 * v0 i18n stub — passthrough.
 *
 * English-only UI is the v0 decision (see README "Pedagogical decisions").
 * This helper exists so all user-facing copy is funnelled through one
 * function — when (and if) we add a second UI locale, swap the body of t()
 * for a real lookup without touching every callsite.
 *
 * Supports a single %d / %s substitution per string. Plural selection is
 * handled at the callsite (see end-of-session screen) — no plural rule
 * library yet, just an explicit one/many lookup.
 */
export function t(key: StringKey, ...args: (string | number)[]): string {
  let s: string = STRINGS[key];
  for (const a of args) {
    s = s.replace(/%[ds]/, String(a));
  }
  return s;
}
