'use client'

import { getJobStatus, getJobs, retryJob, uploadPDF } from '@/actions/jobs'
import { useCallback, useState } from 'react'
import CompletedPanel from './components/CompletedPanel'
import FailedPanel from './components/FailedPanel'
import HistoryList from './components/HistoryList'
import ProcessingPanel from './components/ProcessingPanel'
import UploadPanel from './components/UploadPanel'
import type { JobJSON, PanelState } from './types'

const POLL_INTERVAL_MS = 3000

interface Props {
  initialJobs: JobJSON[]
}

export default function AppClient({ initialJobs }: Props) {
  const [panel, setPanel] = useState<PanelState>('upload')
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [currentJob, setCurrentJob] = useState<JobJSON | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [history, setHistory] = useState<JobJSON[]>(initialJobs)

  const loadHistory = useCallback(async () => {
    const jobs = await getJobs()
    setHistory(jobs)
  }, [])

  const pollStatus = useCallback(
    async (jobId: string) => {
      while (true) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
        try {
          const data = await getJobStatus(jobId)
          if (!data) return
          setCurrentJob(data)
          if (data.status === 'completed') {
            setPanel('completed')
            loadHistory()
            return
          }
          if (data.status === 'failed') {
            setErrorMsg(data.error ?? '不明なエラーが発生しました')
            setPanel('failed')
            loadHistory()
            return
          }
        } catch {
          /* continue */
        }
      }
    },
    [loadHistory],
  )

  const handleConvert = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const result = await uploadPDF(formData)
    if (!result.ok)
      throw new Error(result.error ?? 'アップロードに失敗しました')
    if (!result.jobId) throw new Error('アップロード結果にjobIdがありません')
    setCurrentJobId(result.jobId)
    setPanel('processing')
    pollStatus(result.jobId)
  }

  const handleJobRetry = async () => {
    if (!currentJobId) return
    try {
      const result = await retryJob(currentJobId)
      if (!result.ok) throw new Error(result.error ?? '再実行に失敗しました')
      setPanel('processing')
      pollStatus(currentJobId)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '再実行に失敗しました')
    }
  }

  const resetToUpload = () => {
    setCurrentJobId(null)
    setCurrentJob(null)
    setPanel('upload')
  }

  return (
    <>
      {panel === 'upload' && <UploadPanel onConvert={handleConvert} />}
      {panel === 'processing' && <ProcessingPanel job={currentJob} />}
      {panel === 'completed' && currentJobId && (
        <CompletedPanel jobId={currentJobId} onReset={resetToUpload} />
      )}
      {panel === 'failed' && (
        <FailedPanel
          error={errorMsg}
          onRetry={resetToUpload}
          onResume={currentJobId ? handleJobRetry : undefined}
        />
      )}
      <HistoryList jobs={history} />
    </>
  )
}
