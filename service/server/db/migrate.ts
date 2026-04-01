import { migrate } from 'drizzle-orm/mysql2/migrator'
import { db } from './client'

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: 'server/db/migrations' })
}
