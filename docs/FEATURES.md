# Features

## V1 (build now)
1. **Vault Key login** - unlocks the app and data; required for sensitive actions.
2. **Data Manager**
   - **Service**: title, URL. A service has one or more accounts.
   - **Account**: username, email, ID, password. Belongs to one service. Has zero or more credentials.
   - **Credential**: passkey info, security questions, other types later. Belongs to one account.
   - Service, Account, and Credential are separate entities (separate tables).
3. **Password generator** - length, character sets.
4. **Password strength indicator** - Weak / Fair / Good / Strong, color coded.
5. **Dark navy theme** - only theme, no light mode toggle.
6. **First-time tutorial** - replayable from Settings.
7. **Change Vault Key** - confirm old key, then set new key.
8. **Vault Key recovery settings** - set up / update recovery methods. V1 methods: **Recovery Key** (generated, strong) and **Security Questions** (weaker). Passkey recovery is a V2 placeholder.

9. **Auto-lock** - vault locks when the app goes to the background.
10. **Clipboard auto-clear** - copied passwords are cleared after a short delay.
11. **Screenshot blocking** - on vault screens.
12. **Vault Key guidance** - encourage a strong, personal-password-style Vault Key. Shown as a one-time tutorial popup and as built-in tips whenever the key is created or changed. Setup warns that a forgotten key with no recovery means permanent data loss.
13. **Recycle Bin** - deleting a service, account, or credential moves it to the Recycle Bin. Items can be restored or permanently deleted. Items are purged automatically after a set time (30 days). The delete confirmation tells the user about the auto-purge period before they proceed. Deleting a service moves its accounts and credentials with it; restoring brings them back.

## V2 placeholders (UI present, disabled)
- Have I Been Pwned breach notifications
- Import / Export (includes encrypted backup)
- Recycle Bin expiry notifications: alert the user when items are close to auto-deletion so they can decide whether to restore them
- Passkey recovery (needs a native Android plugin; WebAuthn is unavailable in the WebView, confirmed in the Phase 0 spike)

## Future versions
- Biometric unlock
- Device loss handling

## Accepted risks (V1)
- No backup: a lost or reset phone means a lost vault.
- No device-loss handling.
