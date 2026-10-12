# Build Plan

Check items off as we go. Each phase ends with something testable.

## Phase 0 - Foundation
- [x] GitHub repo + this docs folder committed
- [x] Confirm V1 scope (FEATURES.md) and security decisions (SECURITY.md)
- [x] Spikes: Argon2id ~330 ms PASS, SQLite via Capacitor PASS, passkey FAIL (WebAuthn unavailable in Android WebView). Decision: passkey recovery moves to V2; V1 uses Security Questions + Recovery Key

## Phase 1 - Prototype (Figma Make)
- [x] Run the 3 prompts in docs/FIGMA_PROMPTS.md in order, reviewing after each
- [x] Screens: tutorial, create Vault Key, unlock, service list, service detail, account form, credential form, generator, settings, change key, recovery setup
- [x] Apply DESIGN.md tokens
- [x] Review and approve prototype

## Phase 2 - Project setup
- [ ] Export Figma Make code, run in VS Code
- [ ] Clean structure (ARCHITECTURE.md folders), theme tokens
- [ ] Add Capacitor Android, run on phone

## Phase 3 - Security core
- [ ] Argon2id + AES-GCM + DEK wrapping
- [ ] Create / unlock / lock vault
- [ ] Unlock attempt delay
- [ ] Auto-lock on background
- [ ] Screenshot blocking
- [ ] Unit tests for crypto

## Phase 4 - Data Manager
- [ ] Encrypted SQLite schema
- [ ] Services CRUD
- [ ] Accounts CRUD (one-to-many)
- [ ] Credentials CRUD
- [ ] Search and reveal/copy behavior
- [ ] Recycle Bin: soft delete, restore, permanent delete (Vault Key required)
- [ ] Auto-purge on unlock + auto-purge notice in delete confirmation
- [ ] Clipboard auto-clear

## Phase 5 - Tools
- [ ] Password generator
- [ ] Strength indicator (zxcvbn-ts) wired into account form

## Phase 6 - Settings and recovery
- [ ] Change Vault Key
- [ ] Recovery setup: Recovery Key (generated, shown once, user stores it outside the app)
- [ ] Recovery setup: security questions
- [ ] Recovery flow (reset Vault Key via Recovery Key or security questions)
- [ ] Tutorial + replay from Settings
- [ ] Vault Key guidance popup on create and change
- [ ] V2 placeholders (HIBP, Import/Export, Passkey recovery) disabled

## Phase 7 - Test and release
- [ ] Full feature test checklist on device
- [ ] Security checklist (SECURITY.md)
- [ ] Create release keystore and back it up safely (see docs/RELEASE.md)
- [ ] Signed release APK, GitHub Release, install on phone
- [ ] Fix bugs, tag v1.0.0

## Later (V2+)
HIBP notifications, Recycle Bin expiry notifications, import/export with encrypted backup, device loss handling, biometric unlock, optional encrypted sync backend, app store prep.
