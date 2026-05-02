# Distribution

Two-track:
- **Expo Go** for fast local iteration (Tom dev, no signing, QR scan).
- **EAS Build → TestFlight** for Margo's iPad (must feel "real", not dev-mode).

This document is the TestFlight setup plan. Not done in this session — needs an Apple Developer account and external steps Tom must complete.

---

## What Tom needs to do externally (one-time)

### 1. Apple Developer Program ($99/yr)
- Sign in at https://developer.apple.com with the Apple ID Tom wants tied to the app.
- Enrol in the Apple Developer Program. Individual enrolment is fine — no LLC required.
- Wait for approval (typically 24–48h).

### 2. App Store Connect record
- After enrolment, go to https://appstoreconnect.apple.com.
- "My Apps" → "+" → "New App".
- Platform: iOS. Name: "Margo EN Tutor". Bundle ID: create new, suggested `ai.tomgreen.margoentutor` (or whatever Tom prefers — must be globally unique).
- Primary language: English. SKU: anything stable, e.g. `margoentutor-001`.

### 3. Margo's iPad as a TestFlight tester
- Margo's Apple ID needs to exist (for under-13s in EU, this is a Family Sharing child Apple ID — Tom likely already set this up).
- In App Store Connect → TestFlight → Internal Testing → add Tom's Apple ID first (verify the build works for Tom).
- Then external testing: invite Margo's Apple ID by email. She gets a TestFlight invite link, opens TestFlight on her iPad, accepts.

---

## What Claude (or Tom) does in-repo

### 1. EAS CLI
```sh
npm install -g eas-cli
eas login
```

### 2. Configure EAS
```sh
cd <repo>
eas init    # creates project, links to App Store Connect when prompted
eas build:configure
```
This generates `eas.json` with default `development`, `preview`, `production` profiles.

### 3. Set the bundle identifier
In `app.json`, add under `ios`:
```json
"bundleIdentifier": "ai.tomgreen.margoentutor"
```
Match this exactly to the bundle ID created in App Store Connect.

### 4. Build for TestFlight
```sh
eas build --platform ios --profile production
```
First run prompts for Apple credentials and offers to manage signing certificates / provisioning profiles automatically. Say yes — EAS handles it.

Build runs on EAS servers (~15–25 min). When done, the build output URL gives a `.ipa` artefact.

### 5. Submit to TestFlight
```sh
eas submit --platform ios --latest
```
Uploads the latest build to App Store Connect. Apple processes it for ~10–30 min, then it appears in TestFlight. Internal testers (Tom) get it immediately. External testers (Margo) get it after a brief Beta App Review (usually under 24h, often same-day for an established account).

### 6. Iteration loop
- Make changes locally, test in Expo Go (`npx expo start`, scan QR).
- When ready to push to Margo: bump `expo.version` (or `expo.ios.buildNumber`), run `eas build` + `eas submit`.
- TestFlight on her iPad notifies her of the update.

---

## Open considerations
- **Push notifications:** not needed for v0. If we add daily nudges later ("ready for today's English game?"), need APNs setup via EAS — additional config, deferred.
- **Privacy manifest:** Apple now requires `PrivacyInfo.xcprivacy` declarations for SDKs that read certain APIs. Expo SDK 54+ handles most of this automatically. Verify before first submit.
- **Family Sharing under-13 quirks:** child Apple IDs sometimes have download restrictions. If Margo can't accept the TestFlight invite, check Screen Time → Content & Privacy Restrictions → Installing Apps.
