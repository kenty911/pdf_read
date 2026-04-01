import { randomInt } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { passwordResetCodes } from '../db/schema'

type Row = typeof passwordResetCodes.$inferSelect

export class PasswordResetCode {
  readonly email: string
  readonly code: string
  readonly expiresAt: Date
  readonly createdAt: Date

  private constructor(row: Row) {
    this.email = row.email
    this.code = row.code
    this.expiresAt = row.expiresAt
    this.createdAt = row.createdAt
  }

  static generateCode(): string {
    return String(randomInt(100000, 999999))
  }

  static async upsert(email: string, code: string): Promise<PasswordResetCode> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000)
    await db
      .insert(passwordResetCodes)
      .values({ email, code, expiresAt, createdAt: now })
      .onDuplicateKeyUpdate({ set: { code, expiresAt } })
    return (await PasswordResetCode.findByEmail(email))!
  }

  static async findByEmail(email: string): Promise<PasswordResetCode | null> {
    const [row] = await db
      .select()
      .from(passwordResetCodes)
      .where(eq(passwordResetCodes.email, email))
    return row ? new PasswordResetCode(row) : null
  }

  async delete(): Promise<void> {
    await db.delete(passwordResetCodes).where(eq(passwordResetCodes.email, this.email))
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt
  }
}
