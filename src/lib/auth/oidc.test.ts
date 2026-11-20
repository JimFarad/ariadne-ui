import { describe, expect, it } from 'vitest'
import { codeChallenge } from '@/lib/auth/oidc'

describe('PKCE code challenge (S256)', () => {
  it('matches the RFC 7636 test vector', async () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
    const challenge = await codeChallenge(verifier)
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  })

  it('produces a 43-character base64url string', async () => {
    const verifier = 'a'.repeat(64)
    const challenge = await codeChallenge(verifier)
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })
})
