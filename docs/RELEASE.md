# Release Signing

Android requires every app to be digitally signed. The **keystore** is the file holding your signing key.

## Why it matters
- Android only installs an update if it is signed with the same key as the installed version.
- Lose the keystore or its passwords = you can never update the installed app. You would have to uninstall it, which wipes the local vault.
- Anyone with the keystore can publish apps pretending to be Krypteia.

## Rules
1. Create it once, in Phase 7.
2. Never commit it to GitHub. Add `*.jks`, `*.keystore`, and `keystore.properties` to `.gitignore`.
3. Keep at least two backups in separate places (e.g. password manager attachment + offline drive).
4. Record the key alias, store password, and key password in a safe place.

## Create (Phase 7)
```
keytool -genkeypair -v -keystore krypteia-release.jks -alias krypteia -keyalg RSA -keysize 2048 -validity 10000
```

## Build
Android Studio: Build > Generate Signed App Bundle / APK > APK > choose keystore > release.
Upload the signed APK to a GitHub Release.

## App store note
If you later publish on Google Play, enable Play App Signing so Google holds the final signing key and you keep only an upload key (recoverable if lost).
