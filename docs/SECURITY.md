# Security Model

## Principles
- Everything sensitive is encrypted on the device. No server in V1.
- Use vetted libraries only. No custom crypto.
- Nothing sensitive in logs, analytics, or plain storage.

## Key design (envelope encryption)
- **DEK**: random 256-bit key. Encrypts all vault records with AES-256-GCM.
- **Vault Key** (user's master secret) -> Argon2id + salt -> **KEK**. KEK wraps the DEK.
- **Change Vault Key**: verify old key, unwrap DEK, re-wrap with new KEK. Records are not re-encrypted.
- **Recovery key(s)**: the DEK is also wrapped by a key derived from each recovery method.

## Recovery
Recovery never displays vault data. It only lets the user set a new Vault Key.
```
Recovery method verified -> unwrap DEK internally -> user sets new Vault Key -> DEK re-wrapped -> unlocked state reset
```
**Important:** because the vault is encrypted, a recovery method is cryptographically able to unlock the DEK.
"Does not open the vault" is enforced by app flow, not by cryptography. Therefore recovery methods must be as strong as the Vault Key.

### Security questions (weak by nature)
- Require at least 3 questions; user writes their own or picks uncommon ones.
- Normalize answers (trim, lowercase) then Argon2id with strong parameters.
- Attempt limits with increasing delay.
- Warn the user these are weaker than the Vault Key.

### Passkeys
- Needs the WebAuthn PRF extension (or native Android Credential Manager) to derive a key.
- **To verify in Phase 0 spike** whether Capacitor's Android WebView supports this. Fallback: native plugin.

## Credential data note
Apps cannot export private keys of passkeys made elsewhere. The "Passkey" credential type stores
**metadata/notes** (which service has a passkey, where it lives), not the passkey itself.

## Vault Key guidance
- Encourage a long, memorable passphrase; the strength indicator is shown when creating or changing the key.
- One-time tutorial popup plus inline tips on create and change.
- Warn clearly: forgotten key and no recovery means the data cannot be recovered.

## Activity log (Home > Recent activity)
- Encrypted like all vault data. Stores action type and item id, never item names or secrets.
- Entries for a permanently deleted item are removed.
- Never log password reveals or copied values.
- Needs-attention checks (weak, reused) run in memory after unlock only; results are never stored.

## Service icons and privacy
- Fetching a website icon online tells that third party which sites you have accounts on, and shares your IP address. So online fetching is **opt-in** (setting, off by default, with a plain explanation).
- Bundled brand icons and letter fallbacks work fully offline with no network calls.
- Fetched icons are cached inside the encrypted vault database, never as loose files.
- Never send anything except the bare domain name; no usernames, no paths.

## Recycle Bin
- Soft delete (`deleted_at`). Data stays encrypted while in the Recycle Bin.
- Permanent delete requires the Vault Key.
- Auto-purge after a set time. With no server, expired items are purged when the vault is next unlocked.
- V2 expiry notifications must not reveal item names (generic text only, e.g. "Items in your Recycle Bin expire soon").

## Accepted risks (V1)
- No backup, no device-loss handling (planned: backup in V2, device loss later).
- No biometric unlock (future version).

## Session
- Auto-lock when the app goes to the background; DEK cleared.
- Clipboard cleared automatically after copying a password.
- Screenshots and recent-apps previews blocked on vault screens (Android FLAG_SECURE).
- Vault unlocks into memory only. DEK is cleared on lock.
- Failed unlock attempts: delay increases.

## Threat checklist (review before release)
- [ ] Device lost -> data unreadable without Vault Key
- [ ] Backups (Android auto-backup) disabled or encrypted
- [ ] Release build: no debug flags, no console logging of secrets
- [ ] Dependencies audited (`npm audit`)
