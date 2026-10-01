# Krypteia

Vault & credential manager. Local-first, encrypted on-device. Personal use first, app store later.

## Docs
| File | Purpose |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | Phase-by-phase build plan |
| [docs/FEATURES.md](docs/FEATURES.md) | V1 scope and V2 placeholders |
| [docs/SECURITY.md](docs/SECURITY.md) | Security model, encryption, recovery |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, data model, diagrams |
| [docs/DESIGN.md](docs/DESIGN.md) | Theme, palette, UI rules |
| [docs/RELEASE.md](docs/RELEASE.md) | Release signing and keystore |

## Stack
Vite + React + TypeScript (Figma Make) -> Capacitor -> Android. No server in V1.

## Workflow
- `main` holds stable docs and code. Use `topic/<name>` branches for longer topics.
- Test: `npm run dev -- --host` for browser/phone preview; signed release APK on GitHub Releases for device testing.
