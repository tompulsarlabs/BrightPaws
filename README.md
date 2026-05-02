# Margo EN Tutor

A touch-based English-learning game for Margo (age 7) on iPad.

## Context
- Margo is 7. Native German (primary) and French (dad). Lives mostly with mum + Tom; English exposure is daily but she lacks speaking confidence.
- Goal: get her speaking-fluent in English BEFORE she turns 8, while the innate language-acquisition window is still wide open. Aim for near-native capability.
- Constraint: this is iPad screen time. Sessions should naturally cap at ~30 minutes. Replay loop must be strong enough that she chooses it over passive screen time, but not addictive.

## Stack
- Expo (React Native) + TypeScript. Locked to iPad landscape.
- Distribution: TBD — Expo Go vs TestFlight (open question).
- Not native iOS / Swift.

## Core mechanics
- Touch-driven (tap, drag, match, point-to-say). No keyboard.
- Coin reward economy: completing activities mints "coins". Coins → €/real rewards via a parent-redemption ledger Tom maintains. (e.g. 10 coins = 1 small thing, 100 coins = something bigger.)
- Voice input: TBD — child voice recognition is hard; scope decision needed.

## Stretch curricular concepts (optional, layered subtly)
- Basic compounding (saving coins grows interest)
- Simple investing analogues (spend now vs save and earn more)
- Light "calculus-flavored" intuition (rates, growth) — conceptual only, no symbols

## Open questions (Tom — answer when ready)
1. **Voice recognition** — phase-1 must-have or phase-2? (Affects whether we use Expo Speech / on-device STT.)
2. **Distribution** — Expo Go (QR scan, fastest iteration) or TestFlight (feels more "real" to her, slower)?
3. **Theme / character** — does Margo have a favorite animal, character, or story world to anchor on?
4. **Coin visibility** — does she see a coin balance in-app, or is it an invisible parent ledger you redeem manually?
5. **Bilingual scaffolding** — start with German UI + English content, fade German over time? Or English-only from day one?
6. **Sessions cap** — hard 30-minute lockout, or soft "your session is winding down"?

## Status
- Bootstrapped, no app code yet. Next step: scaffold Expo TypeScript app and a first vocabulary mini-game.
