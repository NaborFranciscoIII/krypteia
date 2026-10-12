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
  CATEGORY ||--o{ SERVICE : groups
  SERVICE ||--o{ ACCOUNT : has
  ACCOUNT ||--o{ CREDENTIAL : has
  SERVICE { string id string category_id string title string url string icon_source string icon_data }
  CATEGORY { string id string name string color }
  ACCOUNT { string id string service_id string username string email string account_id string password }
  CREDENTIAL { string id string account_id string type string payload }
  ACTIVITY { string id string type string entity_type string entity_id string created_at }
  VAULT_META { string kdf_salt string wrapped_dek_by_vault_key string recovery_wraps string version }
```
ACTIVITY powers Home > Recent activity (stores ids, not names; encrypted; capped at 50). Every other table also has `deleted_at` (null = active, set = in Recycle Bin). Rules: a service has 0+ accounts (it starts with none); an account has 0+ credentials. Sensitive fields are stored encrypted. `type` examples: `passkey`, `security_question`, `other`.

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
