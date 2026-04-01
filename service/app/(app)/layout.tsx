import { redirect } from 'next/navigation'
import { getMe, getUserId } from '@/actions/auth'
import { runMigrations } from '@/server/db/migrate'
import AppShell from './AppShell'

let migrated = false
async function ensureMigrated() {
  if (migrated) return
  await runMigrations()
  migrated = true
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await ensureMigrated()
  const userId = await getUserId()
  if (!userId) redirect('/')
  const me = await getMe()
  return <AppShell userInfo={me}>{children}</AppShell>
}
