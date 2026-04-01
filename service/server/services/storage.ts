import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

function dataDir(): string {
  return process.env.DATA_DIR ?? '/data'
}

export function getUploadPath(jobId: string): string {
  return join(dataDir(), 'uploads', jobId, 'input.pdf')
}

export function getOutputPath(jobId: string): string {
  return join(dataDir(), 'outputs', jobId, 'output.mp3')
}

export async function ensureUploadDir(jobId: string): Promise<string> {
  const dir = join(dataDir(), 'uploads', jobId)
  await mkdir(dir, { recursive: true })
  return join(dir, 'input.pdf')
}
