import { useState } from 'react'
import { argon2id } from 'hash-wasm'
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'

type Result = { name: string; ok: boolean; detail: string }

const enc = new TextEncoder()
const dec = new TextDecoder()
const rand = (n: number) => crypto.getRandomValues(new Uint8Array(n))

async function deriveKey(secret: string, salt: Uint8Array, memKiB: number) {
  const raw = await argon2id({
    password: secret,
    salt,
    parallelism: 1,
    iterations: 3,
    memorySize: memKiB,
    hashLength: 32,
    outputType: 'binary',
  })
  return crypto.subtle.importKey('raw', new Uint8Array(raw), 'AES-GCM', false, ['encrypt', 'decrypt'])
}

async function seal(key: CryptoKey, data: Uint8Array) {
  const iv = rand(12)
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new Uint8Array(data)))
  const out = new Uint8Array(iv.length + ct.length)
  out.set(iv)
  out.set(ct, iv.length)
  return out
}

async function open(key: CryptoKey, blob: Uint8Array) {
  const iv = blob.slice(0, 12)
  const ct = blob.slice(12)
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct))
}

// Spike 1: Argon2id speed, AES-GCM, DEK wrapping with two keys (Vault Key + recovery answers)
async function spikeCrypto(): Promise<string> {
  const salt = rand(16)
  const t0 = performance.now()
  const kekVault = await deriveKey('correct horse battery staple', salt, 65536) // 64 MiB
  const ms = Math.round(performance.now() - t0)

  const kekRecovery = await deriveKey('answer1|answer2|answer3', salt, 65536)
  const dek = rand(32)
  const dekKey = await crypto.subtle.importKey('raw', dek, 'AES-GCM', false, ['encrypt', 'decrypt'])

  const wrappedByVault = await seal(kekVault, dek)
  const wrappedByRecovery = await seal(kekRecovery, dek)

  const record = await seal(dekKey, enc.encode('github: hunter2'))
  const viaVault = await open(await crypto.subtle.importKey('raw', await open(kekVault, wrappedByVault), 'AES-GCM', false, ['decrypt']), record)
  const viaRecovery = await open(await crypto.subtle.importKey('raw', await open(kekRecovery, wrappedByRecovery), 'AES-GCM', false, ['decrypt']), record)

  let wrongKeyRejected = false
  try {
    await open(await deriveKey('wrong password', salt, 65536), wrappedByVault)
  } catch {
    wrongKeyRejected = true
  }

  const same = dec.decode(viaVault) === 'github: hunter2' && dec.decode(viaRecovery) === 'github: hunter2'
  if (!same || !wrongKeyRejected) throw new Error('Round trip failed')
  return `Argon2id (64 MiB, 3 passes) took ${ms} ms for one key. Wrap/unwrap OK. Wrong key rejected.`
}

// Spike 2: SQLite on device
async function spikeSqlite(): Promise<string> {
  const sqlite = new SQLiteConnection(CapacitorSQLite)
  const db = await sqlite.createConnection('spike', false, 'no-encryption', 1, false)
  await db.open()
  await db.execute('CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, v TEXT);')
  await db.run('INSERT INTO t (v) VALUES (?)', ['ciphertext-placeholder'])
  const res = await db.query('SELECT COUNT(*) AS n FROM t')
  await db.close()
  await sqlite.closeConnection('spike', false)
  return `SQLite OK. Rows stored so far: ${res.values?.[0]?.n}`
}

// Spike 3: can the WebView create a passkey with the PRF extension?
async function spikePasskey(): Promise<string> {
  if (!window.PublicKeyCredential) throw new Error('WebAuthn is not available in this WebView')
  const cred = (await navigator.credentials.create({
    publicKey: {
      rp: { name: 'Krypteia Spike' },
      user: { id: rand(16), name: 'spike', displayName: 'spike' },
      challenge: rand(32),
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      extensions: { prf: {} } as any,
    },
  })) as PublicKeyCredential | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ext = cred?.getClientExtensionResults() as any
  return `Passkey created. PRF supported: ${String(ext?.prf?.enabled)}`
}

export default function App() {
  const [results, setResults] = useState<Result[]>([])

  const run = async (name: string, fn: () => Promise<string>) => {
    try {
      const detail = await fn()
      setResults((r) => [{ name, ok: true, detail }, ...r])
    } catch (e) {
      setResults((r) => [{ name, ok: false, detail: String(e) }, ...r])
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui', color: '#E6ECFF', background: '#0A1128', minHeight: '100vh' }}>
      <h2>Krypteia Phase 0 Spikes</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => run('Crypto', spikeCrypto)}>1. Crypto</button>
        <button onClick={() => run('SQLite', spikeSqlite)}>2. SQLite</button>
        <button onClick={() => run('Passkey', spikePasskey)}>3. Passkey</button>
      </div>
      {results.map((r, i) => (
        <p key={i} style={{ color: r.ok ? '#3DDC97' : '#FF5C6C' }}>
          <b>{r.name}:</b> {r.ok ? 'PASS' : 'FAIL'}. {r.detail}
        </p>
      ))}
    </div>
  )
}
