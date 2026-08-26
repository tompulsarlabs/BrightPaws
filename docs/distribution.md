# Distribution

Two-track:
- **Expo Go** for fast local iteration without signing.
- **EAS Build → TestFlight** for testing on a learner's iPad outside development mode.

This document is the TestFlight setup plan. It requires an Apple Developer account and several external setup steps.

---

## External setup (one-time)

### 1. Apple Developer Program ($99/yr)
- Sign in at https://developer.apple.com with the Apple ID that should own the app.
- Enrol in the Apple Developer Program. Individual enrolment is fine — no LLC required.
- Wait for approval (typically 24–48h).

### 2. App Store Connect record
- After enrolment, go to https://appstoreconnect.apple.com.
- "My Apps" → "+" → "New App".
- Platform: iOS. Name: "BrightPaws English". Create a globally unique bundle ID, such as `com.example.brightpawsenglish` with `example` replaced by the developer's domain or organization.
- Primary language: English. Use any stable SKU, such as `brightpaws-english-001`.

### 3. Add an iPad as a TestFlight tester
- The learner needs an Apple ID that can use TestFlight. For children, this may be a Family Sharing child account, subject to local age rules and parental controls.
- In App Store Connect → TestFlight → Internal Testing, add a developer account first and verify the build.
- For external testing, invite the tester's Apple ID by email. The tester opens the invite link on the iPad and accepts it in TestFlight.

---

## In-repository setup

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
"bundleIdentifier": "com.example.brightpawsenglish"
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
Uploads the latest build to App Store Connect. After processing, it appears in TestFlight. Internal testers can access it first; external testing may require Beta App Review.

### 6. Iteration loop
- Make changes locally, test in Expo Go (`npx expo start`, scan QR).
- When ready to share an update, bump `expo.version` (or `expo.ios.buildNumber`), then run `eas build` and `eas submit`.
- TestFlight notifies testers when the update is available.

---

## Open considerations
- **Push notifications:** not needed for v0. If we add daily nudges later ("ready for today's English game?"), need APNs setup via EAS — additional config, deferred.
- **Privacy manifest:** Apple now requires `PrivacyInfo.xcprivacy` declarations for SDKs that read certain APIs. Expo SDK 54+ handles most of this automatically. Verify before first submit.
- **Family Sharing and child accounts:** child Apple IDs may have download restrictions. If a learner cannot accept the TestFlight invite, check Screen Time → Content & Privacy Restrictions → Installing Apps.
