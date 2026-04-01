import { getJobs } from '@/actions/jobs'
import AppClient from './AppClient'

export default async function AppPage() {
  const jobs = await getJobs()
  return <AppClient initialJobs={jobs} />
}
