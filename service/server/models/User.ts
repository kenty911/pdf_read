import { pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto'
import { randomUUID } from 'node:crypto'
import { promisify } from 'node:util'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { users } from '../db/schema'

const pbkdf2Async = promisify(pbkdf2)

const ITERATIONS = 310_000
const KEY_LEN = 64
const DIGEST = 'sha512'

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const key = await pbkdf2Async(password, salt, ITERATIONS, KEY_LEN, DIGEST)
  return `${salt}:${key.toString('hex')}`
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, storedKey] = stored.split(':')
  if (!salt || !storedKey) return false
  const key = await pbkdf2Async(password, salt, ITERATIONS, KEY_LEN, DIGEST)
  const storedBuf = Buffer.from(storedKey, 'hex')
  return key.length === storedBuf.length && timingSafeEqual(key, storedBuf)
}

type UserRow = typeof users.$inferSelect

export class User {
  readonly id: string
  email: string
  passwordHash: string
  isVerified: boolean
  readonly createdAt: Date

  private constructor(row: UserRow) {
    this.id = row.id
    this.email = row.email
    this.passwordHash = row.passwordHash
    this.isVerified = row.isVerified
    this.createdAt = row.createdAt
  }

  static async findById(id: string): Promise<User | null> {
    const [row] = await db.select().from(users).where(eq(users.id, id))
    return row ? new User(row) : null
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [row] = await db.select().from(users).where(eq(users.email, email))
    return row ? new User(row) : null
  }

  static async create(email: string, passwordHash: string): Promise<User> {
    const id = randomUUID()
    const now = new Date()
    await db.insert(users).values({ id, email, passwordHash, createdAt: now })
    const user = await User.findById(id)
    if (!user) {
      throw new Error(`User not found after insert: ${id}`)
    }
    return user
  }

  static async hashPassword(password: string): Promise<string> {
    return hashPassword(password)
  }

  async verify(): Promise<void> {
    await db
      .update(users)
      .set({ isVerified: true })
      .where(eq(users.id, this.id))
    this.isVerified = true
  }

  async setPassword(password: string): Promise<void> {
    this.passwordHash = await hashPassword(password)
    await db
      .update(users)
      .set({ passwordHash: this.passwordHash })
      .where(eq(users.id, this.id))
  }

  checkPassword(password: string): Promise<boolean> {
    return verifyPassword(password, this.passwordHash)
  }

  toJSON() {
    return { id: this.id, email: this.email, isVerified: this.isVerified }
  }
}
