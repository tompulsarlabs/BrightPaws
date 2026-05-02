# Margo EN Tutor

A touch-based English-learning game for Margo (age 7) on iPad.

## Context
- Margo is 7. Native German (primary) and French (dad). Lives mostly with mum + Tom; English exposure is daily but she lacks speaking confidence.
- Goal: get her speaking-fluent in English BEFORE she turns 8, while the innate language-acquisition window is still wide open. Aim for near-native capability.
- Constraint: this is iPad screen time. Sessions should naturally cap at ~30 minutes. Replay loop must be strong enough that she chooses it over passive screen time, but not addictive.

## Stack
- Expo (React Native) + TypeScript. Locked to iPad landscape (`ios.isTabletOnly`, `orientation: "landscape"`).
- Distribution: **TestFlight** for Margo's actual device (must feel "real", not dev-mode). Two-track: Expo Go for fast local iteration, EAS Build → TestFlight for her. Setup deferred — see `docs/distribution.md`.
- Not native iOS / Swift.

## Core mechanics
- Touch-driven (tap, drag, match, point-to-say). No keyboard.
- Coin reward economy: completing activities mints "coins". Coins → €/real rewards via a parent-redemption ledger Tom maintains. (e.g. 10 coins = 1 small thing, 100 coins = something bigger.)
- Voice input: deferred to phase 2.

## Pedagogical decisions (v0)

These are the deliberate calls baked into v0. Future-Tom / future-Claude: read this before changing them.

### Bilingual scaffolding: English-only UI, long-press German audio hint
- **All UI copy and all spoken audio is English.** No German text in the interface.
- **Long-press an image** → plays a German audio "hint" for that word, sparingly. (Default once per session per word; frequency dial-able.)
- **Why:** Krashen's "comprehensible input" model — for an already-passively-English-fluent 7-year-old, persistent German scaffolding builds a translation reflex (English → German → meaning) instead of the direct image → English association we want. The long-press hint is an emergency rip-cord so she doesn't disengage when stuck, not a default crutch.
- Revisit if: she's getting frustrated and disengaging despite the hint, or conversely if she never uses the hint and is breezing through.

### Coin economy: reward-framed, not pressure-framed
First principles of incentives, light touch, deepenable over time. Specifically:
- Coins shown as a **balance** with celebratory framing ("you earned X coins!"), never scarcity ("X to go").
- **No streak guilt.** No "you'll lose your X" mechanics. No FOMO timers.
- **Daily soft target** (e.g. 10 coins/day) celebrated when hit, never punished when missed.

### Session cap: soft, visible, delightful
- Visible elapsed-time indicator (e.g. a sun crossing the sky, a cat shape filling up).
- At 30 minutes cumulative same-day play: soft "great session, let's stretch your eyes" prompt with a "play one more round" escape hatch. **No hard lockout.** Easy to flip later if needed.

### Theme: cats + sausage dogs + Grogu (placeholder)
- Cats are the primary character family. Sausage dogs (dachshunds) and Grogu are recurring side characters.
- Grogu = Disney/Lucasfilm IP. For private TestFlight (Tom + family), this is fine. If scope ever expands, Grogu must be swapped for a Grogu-inspired original. See `IP-NOTES.md`.
- All theme content lives in `content/v0.ts`. Asset pipeline lets Tom drop in his own art / commissioned art / image-gen output without touching app code.

## Stretch curricular concepts (optional, layered subtly)
- Basic compounding (saving coins grows interest)
- Simple investing analogues (spend now vs save and earn more)
- Light "calculus-flavored" intuition (rates, growth) — conceptual only, no symbols

## Open questions — RESOLVED 2026-05-02
1. ~~**Voice recognition**~~ → **Phase 2.** No STT in v0.
2. ~~**Distribution**~~ → **TestFlight** (with Expo Go for dev iteration). See `docs/distribution.md`.
3. ~~**Theme / character**~~ → **Cats + sausage dogs + Grogu** (placeholder); swappable via `content/v0.ts`. IP caveat in `IP-NOTES.md`.
4. ~~**Coin visibility**~~ → **In-app, reward-framed.** See "Pedagogical decisions" above.
5. ~~**Bilingual scaffolding**~~ → **English-only UI + long-press German audio hint.** Rationale above.
6. ~~**Sessions cap**~~ → **Soft, visible, delightful timer.** No hard lockout.

## Status
- v0 prototype: scaffolded Expo iPad app, single-screen tap-to-match vocab game, AsyncStorage coin balance, soft 30-minute timer, English-only with German long-press hint scaffold. Theme: placeholder cats/dogs/Grogu emoji until Tom drops in real assets.
- No remote yet. Tom to add GitHub remote when ready.
