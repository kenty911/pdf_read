import { randomInt } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { pendingRegistrations } from '../db/schema'

type Row = typeof pendingRegistrations.$inferSelect

export class PendingRegistration {
  readonly email: string
  readonly passwordHash: string
  readonly code: string
  readonly expiresAt: Date
  readonly createdAt: Date

  private constructor(row: Row) {
    this.email = row.email
    this.passwordHash = row.passwordHash
    this.code = row.code
    this.expiresAt = row.expiresAt
    this.createdAt = row.createdAt
  }

  static generateCode(): string {
    return String(randomInt(100000, 999999))
  }

  static async upsert(
    email: string,
    passwordHash: string,
    code: string,
  ): Promise<PendingRegistration> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000)
    await db
      .insert(pendingRegistrations)
      .values({ email, passwordHash, code, expiresAt, createdAt: now })
      .onDuplicateKeyUpdate({ set: { passwordHash, code, expiresAt } })
    const row = await PendingRegistration.findByEmail(email)
    if (!row) {
      throw new Error(`PendingRegistration not found after upsert: ${email}`)
    }
    return row
  }

  static async findByEmail(email: string): Promise<PendingRegistration | null> {
    const [row] = await db
      .select()
      .from(pendingRegistrations)
      .where(eq(pendingRegistrations.email, email))
    return row ? new PendingRegistration(row) : null
  }

  async delete(): Promise<void> {
    await db
      .delete(pendingRegistrations)
      .where(eq(pendingRegistrations.email, this.email))
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt
  }
}
