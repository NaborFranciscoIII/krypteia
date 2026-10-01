# Architecture

## Stack
| Layer | Choice |
|---|---|
| UI | Vite + React + TypeScript (from Figma Make) |
| Native shell | Capacitor (Android) |
| Storage | Encrypted local SQLite (ciphertext only) |
| Crypto | Web Crypto (AES-256-GCM) + Argon2id (WASM library) |
| Strength check | zxcvbn-ts |
| Generator | `crypto.getRandomValues` |

## Layers
```mermaid
flowchart TD
  UI[React UI] --> Svc[Vault Services]
  Svc --> Crypto[Crypto Module]
  Svc --> Repo[Repository]
  Repo --> DB[(Encrypted SQLite)]
  Crypto --> KS[Android Keystore - optional later]
```

## Data model
```mermaid
erDiagram
  SERVICE ||--|{ ACCOUNT : has
  ACCOUNT ||--o{ CREDENTIAL : has
  SERVICE { string id string title string url }
  ACCOUNT { string id string service_id string username string email string account_id string password }
  CREDENTIAL { string id string account_id string type string payload }
  VAULT_META { string kdf_salt string wrapped_dek_by_vault_key string recovery_wraps string version }
```
Every table also has `deleted_at` (null = active, set = in Recycle Bin). Rules: a service has 1+ accounts; an account has 0+ credentials. Sensitive fields are stored encrypted. `type` examples: `passkey`, `security_question`, `other`.

## Unlock flow
```mermaid
flowchart LR
  A[Open app] --> B{Vault set up?}
  B -- No --> C[Tutorial + create Vault Key + recovery]
  B -- Yes --> D[Enter Vault Key]
  D --> E{Valid?}
  E -- Yes --> F[Vault open]
  E -- No --> G[Delay + retry / Recovery]
```

## Folder layout (code)
```
src/
  ui/          screens and components
  services/    vault, auth, recovery
  crypto/      kdf, encrypt, wrap
  data/        sqlite repository, schema
  theme/       tokens
```
