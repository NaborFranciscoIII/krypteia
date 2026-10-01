# Figma Make Prompts

Paste one at a time, in order. Review the result, ask for fixes, then move to the next.
These prompts are frontend only: mock data, no real encryption or storage.

---

## Prompt 1 - Foundation, onboarding, unlock

```
Build the frontend prototype of "Krypteia", a vault and credential manager app.
Stack: Vite, React, TypeScript. Mobile-first, responsive up to tablet and desktop.
Style: minimalistic, futuristic sci-fi, modern. DARK NAVY ONLY. No light mode, no theme toggle.

DESIGN TOKENS (define as CSS variables, never hard-code hex in components):
- bg #0A1128, surface #121B3A, border #1F2B52
- text #E6ECFF, text-muted #8C9AC4, accent #3DA5FF
- weak/error/delete red #FF5C6C, fair/warning amber #FFB84D, good cyan #3DD6D0, strong/success green #3DDC97
Color follows function: e.g. a "Weak" label is red, "Strong" is green.
Use rounded cards, thin borders, subtle glow on the accent color, large tap targets, one primary action per screen. Use lucide-react icons.

SCREENS IN THIS PROMPT:
1. First-time tutorial: 4 swipeable slides (what a Vault Key is, Services/Accounts/Credentials, Recycle Bin, auto-lock and privacy), Skip and Next buttons.
2. Create Vault Key: input with show/hide, live password strength indicator (Weak/Fair/Good/Strong, colored bar and label), a tips card encouraging the user to create the Vault Key like a strong personal password (long, memorable passphrase, not reused), confirm field, and a warning that if the Vault Key is forgotten and no recovery is set, data cannot be recovered.
3. Recovery setup (can be skipped but discouraged): choose Security Questions (minimum 3 questions, user can write their own, with a note that these are weaker than the Vault Key) and/or Passkey (placeholder button).
4. Unlock screen: Vault Key input, Unlock button, wrong-key error with a short retry-delay countdown, and a "Forgot Vault Key?" link.
5. Recovery flow: verify with a recovery method, then set a new Vault Key (with the same guidance and strength indicator), then success. State clearly that recovery only resets the Vault Key and does not open the vault.

Use a single mock data file and simple app state to switch between screens. No real crypto or storage.
```

---

## Prompt 2 - Data Manager and Recycle Bin

```
Continue the Krypteia prototype with the Data Manager. Keep the same design tokens.

DATA TYPES (TypeScript):
- Service { id, title, url, deletedAt: string | null }
- Account { id, serviceId, username, email, accountId, password, deletedAt }
- Credential { id, accountId, type: "passkey" | "security_question" | "other", label, details, deletedAt }
Rules: a service has one or more accounts. An account has zero or more credentials. Create realistic mock data.

NAVIGATION: bottom tab bar on mobile (Vault, Generator, Recycle Bin, Settings); side navigation on wide screens.

SCREENS:
1. Vault home: searchable list of Services (title, URL, account count), add-service button.
2. Service detail: service info and its accounts list, add-account button, edit, delete.
3. Account detail: username, email, ID, password hidden by default (tap to reveal, auto-hides after a few seconds), copy buttons with a toast "Copied. Clipboard clears in 30 seconds", strength indicator for the password, and a list of its credentials (empty state when none).
4. Forms: add/edit Service, Account (password field with strength indicator and a "Generate" button), Credential (type selector: Passkey, Security Question, Other; Passkey type notes that only info about the passkey is stored, not the passkey itself).
5. Delete confirmation: explains the item moves to the Recycle Bin and is permanently deleted automatically after 30 days. Deleting a service also moves its accounts and credentials.
6. Recycle Bin: items with "days left" labels (red when under 7 days), Restore button, Delete permanently (requires entering the Vault Key), empty state.
7. Auto-lock demo: a way to simulate the app going to background, which returns to the Unlock screen.
```

---

## Prompt 3 - Tools and Settings

```
Continue the Krypteia prototype. Keep the same design tokens.

SCREENS:
1. Password Generator tab: generated password display with strength indicator, length slider (8 to 64), toggles for uppercase, lowercase, numbers, symbols, regenerate and copy buttons.
2. Settings, grouped:
   - Security: Change Vault Key, Recovery settings, Auto-lock (shows "locks when app goes to background"), Clipboard clear (30 seconds), Screenshot blocking (on).
   - Help: View tutorial again (replays the first-time tutorial).
   - Coming in V2 (disabled rows with a "Coming soon" badge): Breach alerts (Have I Been Pwned), Import / Export, Recycle Bin expiry notifications.
   - About: app name and version 1.0.0.
3. Change Vault Key flow: step 1 enter old Vault Key, step 2 enter new Vault Key with strength indicator and the guidance tips card, step 3 confirm and success.
4. Recovery settings: list of recovery methods (Security Questions, Passkey) with status, edit and remove actions.

Finish by checking every screen is responsive at 360px, 768px and 1280px widths, and that all buttons and navigation work with mock data.
```
