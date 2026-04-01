import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl)
  throw new Error('Missing required environment variable: DATABASE_URL')

const pool = mysql.createPool(databaseUrl)
export const db = drizzle(pool, { schema, mode: 'default' })
export type DB = typeof db
