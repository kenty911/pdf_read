import { randomUUID } from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { type JobStatus, jobs } from '../db/schema'

type JobRow = typeof jobs.$inferSelect

export class Job {
  readonly id: string
  readonly userId: string
  status: JobStatus
  originalFilename: string | null
  pdfPath: string | null
  mp3Path: string | null
  errorMessage: string | null
  totalLines: number | null
  currentLine: number
  readonly createdAt: Date
  updatedAt: Date

  private constructor(row: JobRow) {
    this.id = row.id
    this.userId = row.userId
    this.status = row.status
    this.originalFilename = row.originalFilename ?? null
    this.pdfPath = row.pdfPath ?? null
    this.mp3Path = row.mp3Path ?? null
    this.errorMessage = row.errorMessage ?? null
    this.totalLines = row.totalLines ?? null
    this.currentLine = row.currentLine ?? 0
    this.createdAt = row.createdAt
    this.updatedAt = row.updatedAt
  }

  static async findById(id: string): Promise<Job | null> {
    const [row] = await db.select().from(jobs).where(eq(jobs.id, id))
    return row ? new Job(row) : null
  }

  static async findByUser(userId: string): Promise<Job[]> {
    const rows = await db
      .select()
      .from(jobs)
      .where(eq(jobs.userId, userId))
      .orderBy(desc(jobs.createdAt))
    return rows.map((r) => new Job(r))
  }

  static async create(userId: string, originalFilename: string, pdfPath: string): Promise<Job> {
    const id = randomUUID()
    const now = new Date()
    await db.insert(jobs).values({ id, userId, originalFilename, pdfPath, createdAt: now, updatedAt: now })
    return (await Job.findById(id))!
  }

  async setPdfPath(pdfPath: string): Promise<void> {
    const now = new Date()
    await db.update(jobs).set({ pdfPath, updatedAt: now }).where(eq(jobs.id, this.id))
    this.pdfPath = pdfPath
    this.updatedAt = now
  }

  async markProcessing(): Promise<void> {
    const now = new Date()
    await db.update(jobs).set({ status: 'processing', updatedAt: now }).where(eq(jobs.id, this.id))
    this.status = 'processing'
    this.updatedAt = now
  }

  async markCompleted(mp3Path: string): Promise<void> {
    const now = new Date()
    await db.update(jobs).set({ status: 'completed', mp3Path, updatedAt: now }).where(eq(jobs.id, this.id))
    this.status = 'completed'
    this.mp3Path = mp3Path
    this.updatedAt = now
  }

  async markFailed(error: string): Promise<void> {
    const now = new Date()
    await db.update(jobs).set({ status: 'failed', errorMessage: error, updatedAt: now }).where(eq(jobs.id, this.id))
    this.status = 'failed'
    this.errorMessage = error
    this.updatedAt = now
  }

  async updateProgress(currentLine: number, totalLines?: number): Promise<void> {
    const now = new Date()
    await db.update(jobs).set({
      currentLine,
      updatedAt: now,
      ...(totalLines !== undefined ? { totalLines } : {}),
    }).where(eq(jobs.id, this.id))
    this.currentLine = currentLine
    if (totalLines !== undefined) this.totalLines = totalLines
    this.updatedAt = now
  }

  toJSON() {
    return {
      id: this.id,
      status: this.status,
      error: this.errorMessage,
      original_filename: this.originalFilename,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
      total_lines: this.totalLines,
      current_line: this.currentLine,
    }
  }
}
