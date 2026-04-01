'use server'

import { randomUUID } from 'node:crypto'
import { PasswordResetCode } from '@/server/models/PasswordResetCode'
import { PendingRegistration } from '@/server/models/PendingRegistration'
import { User } from '@/server/models/User'
import {
  COOKIE_NAME,
  GUEST_MAX_AGE,
  MEMBER_MAX_AGE,
  sign,
  verify,
} from '@/server/services/auth'
import {
  sendActivationEmail,
  sendPasswordResetEmail,
} from '@/server/services/email'
import { verifyRecaptcha } from '@/server/services/recaptcha'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// ── Cookie ヘルパー ──────────────────────────────────────────
async function setGuestCookie(userId: string) {
  const jar = await cookies()
  jar.set(COOKIE_NAME, sign(userId), {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: GUEST_MAX_AGE,
    path: '/',
  })
}

async function setMemberCookie(userId: string) {
  const jar = await cookies()
  jar.set(COOKIE_NAME, sign(userId), {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: MEMBER_MAX_AGE,
    path: '/',
  })
}

// ── ユーザーID取得 ───────────────────────────────────────────
export async function getUserId(): Promise<string | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (!token) return null
  return verify(token)
}

export async function requireUserId(): Promise<string> {
  const userId = await getUserId()
  if (!userId) redirect('/')
  return userId
}

// ── 認証情報取得 ─────────────────────────────────────────────
export async function getMe(): Promise<{
  type: 'guest' | 'member'
  email: string | null
}> {
  const userId = await getUserId()
  if (!userId) return { type: 'guest', email: null }
  const user = await User.findById(userId)
  if (!user) return { type: 'guest', email: null }
  return { type: user.isVerified ? 'member' : 'guest', email: user.email }
}

// ── reCAPTCHA → ゲストユーザー発行 ──────────────────────────
export async function verifyAndCreateGuest(
  recaptchaToken: string,
): Promise<{ ok: boolean; error?: string }> {
  const ok = await verifyRecaptcha(recaptchaToken)
  if (!ok) return { ok: false, error: 'reCAPTCHA の検証に失敗しました' }
  const userId = randomUUID()
  await setGuestCookie(userId)
  return { ok: true }
}

// ── 会員登録 ─────────────────────────────────────────────────
export async function register(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!email.includes('@'))
    return { ok: false, error: 'メールアドレスが無効です' }
  if (password.length < 8)
    return { ok: false, error: 'パスワードは8文字以上です' }
  const existing = await User.findByEmail(email)
  if (existing)
    return { ok: false, error: 'このメールアドレスは既に登録されています' }
  const passwordHash = await User.hashPassword(password)
  const code = PendingRegistration.generateCode()
  await PendingRegistration.upsert(email, passwordHash, code)
  await sendActivationEmail(email, code)
  return { ok: true }
}

// ── アクティベーション ────────────────────────────────────────
export async function activate(
  email: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const pending = await PendingRegistration.findByEmail(email)
  if (!pending) return { ok: false, error: 'コードが無効です' }
  if (pending.isExpired())
    return { ok: false, error: 'コードの有効期限が切れています' }
  if (pending.code !== code) return { ok: false, error: 'コードが一致しません' }
  const user = await User.create(email, pending.passwordHash)
  await user.verify()
  await pending.delete()
  await setMemberCookie(user.id)
  return { ok: true }
}

// ── ログイン ─────────────────────────────────────────────────
export async function login(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await User.findByEmail(email)
  if (!user || !(await user.checkPassword(password))) {
    return { ok: false, error: 'メールアドレスまたはパスワードが違います' }
  }
  await setMemberCookie(user.id)
  return { ok: true }
}

// ── ログアウト ───────────────────────────────────────────────
export async function logout(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE_NAME)
}

// ── パスワードリセット（コード送信）──────────────────────────
export async function forgotPassword(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await User.findByEmail(email)
  if (user) {
    const code = PasswordResetCode.generateCode()
    await PasswordResetCode.upsert(email, code)
    await sendPasswordResetEmail(email, code)
  }
  return { ok: true } // メール存在確認を防ぐため常にOK
}

// ── パスワードリセット（適用）────────────────────────────────
export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  if (newPassword.length < 8)
    return { ok: false, error: 'パスワードは8文字以上です' }
  const reset = await PasswordResetCode.findByEmail(email)
  if (!reset || reset.code !== code)
    return { ok: false, error: 'コードが無効です' }
  if (reset.isExpired())
    return { ok: false, error: 'コードの有効期限が切れています' }
  const user = await User.findByEmail(email)
  if (!user) return { ok: false, error: 'ユーザーが見つかりません' }
  await user.setPassword(newPassword)
  await reset.delete()
  return { ok: true }
}
