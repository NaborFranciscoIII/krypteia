# Phase 0 Spikes

Throwaway test app. Answers three questions on your real phone before we build on them:
1. Is Argon2id fast enough in the Android WebView? (target: under about 1.5 seconds)
2. Does SQLite work through Capacitor?
3. Can the WebView create a passkey with the PRF extension (for passkey recovery)?

## Steps (VS Code terminal, inside your repo)
```
git switch -c spike/phase0
mkdir spikes && cd spikes
npm create vite@latest phase0 -- --template react-ts
cd phase0
npm install
npm install hash-wasm @capacitor/core @capacitor/android @capacitor-community/sqlite
npm install -D @capacitor/cli
npx cap init KrypteiaSpike com.krypteia.spike --web-dir=dist
npm run build
npx cap add android
```
Then replace `src/App.tsx` with the `App.tsx` from this folder, and run:
```
npm run build
npx cap sync android
npx cap open android
```
In Android Studio: connect your phone by USB (USB debugging on), pick it as the target, press Run.
Tap the three buttons and send me the PASS/FAIL lines.

## Notes
- Do not merge this branch into main. It is only for testing.
- Expect the Passkey test may FAIL. Android passkeys are tied to a website domain, and an offline app has none. A fail here is useful information, not a bug.
