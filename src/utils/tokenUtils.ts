/**
 * JWT Token Utilities
 * Decode and extract claims from JWT tokens
 */

export interface TokenClaims {
  user_id: string
  organization_id: string
  project_id: string
  session_id: string
  type: string
  ai_edit: boolean
  exp?: number
  iat?: number
}

/**
 * Decode a JWT token and extract its payload
 * Note: This does NOT verify the signature, only extracts the claims
 */
export function decodeToken(token: string): TokenClaims | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('[TokenUtils] Invalid JWT format')
      return null
    }

    const payload = parts[1]
    // Handle base64url encoding (replace - with + and _ with /)
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64)
    const claims = JSON.parse(decoded)

    return claims as TokenClaims
  } catch (error) {
    console.error('[TokenUtils] Failed to decode token:', error)
    return null
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  const claims = decodeToken(token)
  if (!claims || !claims.exp) {
    return true
  }

  // exp is in seconds, Date.now() is in milliseconds
  return Date.now() >= claims.exp * 1000
}

/**
 * Get a specific claim from the token
 */
export function getTokenClaim<K extends keyof TokenClaims>(token: string, claim: K): TokenClaims[K] | null {
  const claims = decodeToken(token)
  if (!claims) {
    return null
  }
  return claims[claim] ?? null
}
