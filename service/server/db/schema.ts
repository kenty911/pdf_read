import {
  boolean,
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  varchar,
} from 'drizzle-orm/mysql-core'

export const jobStatusValues = ['pending', 'processing', 'completed', 'failed'] as const
export type JobStatus = (typeof jobStatusValues)[number]

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  isVerified: boolean('is_verified').notNull().default(false),
  createdAt: datetime('created_at').notNull(),
})

export const pendingRegistrations = mysqlTable('pending_registrations', {
  email: varchar('email', { length: 255 }).primaryKey(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  expiresAt: datetime('expires_at').notNull(),
  createdAt: datetime('created_at').notNull(),
})

export const passwordResetCodes = mysqlTable('password_reset_codes', {
  email: varchar('email', { length: 255 }).primaryKey(),
  code: varchar('code', { length: 6 }).notNull(),
  expiresAt: datetime('expires_at').notNull(),
  createdAt: datetime('created_at').notNull(),
})

export const jobs = mysqlTable(
  'jobs',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),
    status: mysqlEnum('status', jobStatusValues).notNull().default('pending'),
    originalFilename: varchar('original_filename', { length: 255 }),
    pdfPath: varchar('pdf_path', { length: 512 }),
    mp3Path: varchar('mp3_path', { length: 512 }),
    errorMessage: text('error_message'),
    totalLines: int('total_lines'),
    currentLine: int('current_line').default(0),
    createdAt: datetime('created_at').notNull(),
    updatedAt: datetime('updated_at').notNull(),
  },
  (t) => [index('ix_jobs_user_id').on(t.userId)],
)
