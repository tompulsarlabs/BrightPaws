# BrightPaws English

A playful, touch-first English-learning game for children on tablets.

## Overview

- **Audience:** children building early English vocabulary, listening skills, and speaking confidence, regardless of their home language.
- **Goal:** make short, active English practice inviting through pictures, sound, movement, and repetition.
- **Session design:** play is naturally paced in sessions of about 30 minutes, with a gentle stopping prompt and no addictive or guilt-based mechanics.
- **Current platform:** Expo (React Native) on iPad, with room to support more devices over time.

## Stack

- Expo (React Native) + TypeScript.
- Optimized for landscape tablet play (`ios.isTabletOnly`, `orientation: "landscape"`).
- Expo Go supports fast local iteration; EAS Build and TestFlight support device testing. See `docs/distribution.md`.

## Core mechanics

- Touch-driven activities: tap, drag, match, explore, and point-to-say. No keyboard required.
- Picture-and-audio vocabulary practice with repeat-after-me recording.
- A positive coin economy that can be connected to optional, parent-defined rewards.
- A visible, child-friendly session timer with a gentle break reminder.
- Voice recognition is deferred to a later phase; the current recording feature does not grade speech.

## Learning design

### English-first experience with optional language support

- Regular interface copy and spoken prompts are in English.
- Long-pressing an image can play a short home-language clue. The v0 content pack includes German clues as a starter localization, and other languages can be added or substituted.
- The clue is an optional fallback rather than a required step, helping learners connect an image directly with its English word.
- Language support should be adapted when it causes frustration, is unnecessary, or does not match a learner's needs.

### Encouragement without pressure

- Coins are shown as a balance with celebratory framing such as “You earned 5 coins!”
- There are no streak penalties, scarcity messages, or fear-of-missing-out timers.
- A daily target can be celebrated when reached and is never punished when missed.

### Gentle session limits

- A visual indicator shows elapsed play time.
- At 30 minutes of cumulative daily play, the app suggests an eye break and offers a “one more round” option.
- There is no hard lockout in the current version.

### Friendly, replaceable theme

- Cats and dachshunds are the primary character families.
- Grogu is currently a private-development placeholder and must be replaced with an original character before public distribution. See `IP-NOTES.md`.
- Theme content lives in `content/v0.ts`, so artwork can be replaced without changing the game logic.

## Optional future concepts

These ideas may be layered in subtly as the curriculum grows:

- Basic saving and compounding
- Simple spend-now-versus-save choices
- Age-appropriate intuition about rates and growth, without formal notation

## Current decisions

1. Voice recognition is planned for a later phase; v0 uses ungraded repeat-after-me recording.
2. Development uses Expo Go, with EAS Build and TestFlight available for device testing.
3. The animal theme is replaceable through `content/v0.ts`.
4. Coins are reward-framed and never used to create pressure.
5. The interface is English-first, with optional home-language audio clues.
6. The 30-minute session reminder is soft rather than a hard lockout.

## Status

The v0 prototype includes a landscape tablet app, tap-to-match and exploration activities, persistent coins and level progress, a soft 30-minute timer, English audio, repeat-after-me recording, and optional German audio clues in the starter content pack.

## Licence

Original work owned by Tom Green is proprietary. Commercial reuse requires his
prior written permission. See [LICENSE](LICENSE). Third-party materials retain their
own rights and licences; previously granted rights are preserved.

Third-party character assets are excluded from this ownership notice. The licence
does not clear those rights; see the Grogu placeholder restrictions in
[IP-NOTES.md](IP-NOTES.md).
