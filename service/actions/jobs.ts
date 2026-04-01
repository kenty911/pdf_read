'use server'

import { writeFile } from 'node:fs/promises'
import { Job } from '@/server/models/Job'
import { createConversionJob } from '@/server/services/k8s'
import { ensureUploadDir } from '@/server/services/storage'
import { requireUserId } from './auth'

export async function uploadPDF(
  formData: FormData,
): Promise<{ ok: boolean; jobId?: string; error?: string }> {
  const userId = await requireUserId()
  const file = formData.get('file')
  if (!(file instanceof File))
    return { ok: false, error: 'ファイルが選択されていません' }
  if (!file.name.toLowerCase().endsWith('.pdf'))
    return { ok: false, error: 'PDFファイルを選択してください' }

  const existing = await Job.findByUser(userId)
  const busy = existing.some(
    (j) => j.status === 'pending' || j.status === 'processing',
  )
  if (busy)
    return {
      ok: false,
      error: '変換中のジョブがあります。完了後に再度お試しください',
    }

  const job = await Job.create(userId, file.name, '')
  const pdfPath = await ensureUploadDir(job.id)
  await writeFile(pdfPath, Buffer.from(await file.arrayBuffer()))
  await job.setPdfPath(pdfPath)
  await createConversionJob(job.id)
  return { ok: true, jobId: job.id }
}

export async function getJobs(): Promise<ReturnType<Job['toJSON']>[]> {
  const userId = await requireUserId()
  const jobList = await Job.findByUser(userId)
  return jobList.map((j) => j.toJSON())
}

export async function getJobStatus(
  jobId: string,
): Promise<ReturnType<Job['toJSON']> | null> {
  const userId = await requireUserId()
  const job = await Job.findById(jobId)
  if (!job || job.userId !== userId) return null
  return job.toJSON()
}

export async function retryJob(
  jobId: string,
): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId()
  const job = await Job.findById(jobId)
  if (!job || job.userId !== userId)
    return { ok: false, error: 'ジョブが見つかりません' }
  if (job.status !== 'failed')
    return { ok: false, error: '失敗したジョブのみ再試行できます' }
  await job.markProcessing()
  await createConversionJob(job.id)
  return { ok: true }
}
