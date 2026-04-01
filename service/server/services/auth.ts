import { createHmac, timingSafeEqual } from 'node:crypto'

export const COOKIE_NAME = 'user_id'
export const GUEST_MAX_AGE = 315_360_000 // ~10年
export const MEMBER_MAX_AGE = 30 * 24 * 60 * 60 // 30日

function secret(): string {
  const s = process.env.COOKIE_SECRET
  if (!s) throw new Error('COOKIE_SECRET is not set')
  return s
}

export function sign(userId: string): string {
  const hmac = createHmac('sha256', secret()).update(userId).digest('base64url')
  return `${userId}.${hmac}`
}

export function verify(token: string): string | null {
  const dot = token.lastIndexOf('.')
  if (dot === -1) return null
  const userId = token.slice(0, dot)
  const expected = Buffer.from(sign(userId))
  const actual = Buffer.from(token)
  if (expected.length !== actual.length) return null
  try {
    return timingSafeEqual(expected, actual) ? userId : null
  } catch {
    return null
  }
}
