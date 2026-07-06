/**
 * Patches FrontEnd/vercel.json CSP connect-src from VITE_API_URL before `vite build`.
 * Each Vercel project sets its own backend URL — this keeps CSP aligned with axios.
 *
 * Run automatically via package.json "prebuild".
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const vercelPath = join(root, 'vercel.json')

function loadEnvLocal() {
  const envPath = join(root, '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && process.env[key] == null) process.env[key] = val
  }
}

function apiOrigin() {
  loadEnvLocal()
  const raw = process.env.VITE_API_URL?.trim()
  if (!raw) {
    console.warn('[sync-csp] VITE_API_URL not set — connect-src will omit backend origin')
    return null
  }
  try {
    return new URL(raw).origin
  } catch {
    console.warn('[sync-csp] Invalid VITE_API_URL:', raw)
    return null
  }
}

function buildConnectSrc(origin) {
  const parts = ["'self'"]
  if (origin) parts.push(origin)
  // Local preview / dev against localhost backend
  parts.push('http://localhost:8080')
  parts.push('https://accounts.google.com')
  return parts.join(' ')
}

const origin = apiOrigin()
const connectSrc = buildConnectSrc(origin)

const vercel = JSON.parse(readFileSync(vercelPath, 'utf8'))
const headerBlock = vercel.headers?.find(h => h.source === '/(.*)')
const cspHeader = headerBlock?.headers?.find(h => h.key === 'Content-Security-Policy')

if (!cspHeader?.value) {
  console.error('[sync-csp] Content-Security-Policy header not found in vercel.json')
  process.exit(1)
}

if (!/connect-src[^;]+/.test(cspHeader.value)) {
  console.error('[sync-csp] connect-src directive not found in CSP string')
  process.exit(1)
}

cspHeader.value = cspHeader.value.replace(
  /connect-src[^;]+/,
  `connect-src ${connectSrc}`,
)
writeFileSync(vercelPath, JSON.stringify(vercel, null, 2) + '\n', 'utf8')

console.log('[sync-csp] connect-src updated:', connectSrc)
