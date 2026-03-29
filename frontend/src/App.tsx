import { useCallback, useEffect, useState } from 'react'
import CompletedPanel from './components/CompletedPanel'
import FailedPanel from './components/FailedPanel'
import HistoryList from './components/HistoryList'
import ProcessingPanel from './components/ProcessingPanel'
import UploadPanel from './components/UploadPanel'
import type { Job, PanelState } from './types'

const POLL_INTERVAL_MS = 3000

export default function App() {
  const [panel, setPanel] = useState<PanelState>('upload')
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [history, setHistory] = useState<Job[]>([])

  const loadHistory = useCallback(async () => {
    try {
      const resp = await fetch('/api/jobs')
      if (!resp.ok) return
      setHistory(await resp.json())
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleConvert = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const resp = await fetch('/api/jobs', { method: 'POST', body: formData })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error || 'アップロードに失敗しました')
    setCurrentJobId(data.job_id)
    setPanel('processing')
    pollStatus(data.job_id)
  }

  const pollStatus = async (jobId: string) => {
    while (true) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      try {
        const resp = await fetch(`/api/jobs/${jobId}/status`)
        const data: Job = await resp.json()
        if (data.status === 'completed') {
          setPanel('completed')
          loadHistory()
          return
        }
        if (data.status === 'failed') {
          setErrorMsg(data.error || '不明なエラーが発生しました')
          setPanel('failed')
          loadHistory()
          return
        }
      } catch {
        // continue polling
      }
    }
  }

  const resetToUpload = () => {
    setCurrentJobId(null)
    setPanel('upload')
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-800">PDF to MP3</span>
        <form action="/api/logout" method="post">
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700 underline">
            ログアウト
          </button>
        </form>
      </header>

      <main className="flex-1 px-4 py-12">
        <div className="max-w-lg mx-auto">
          {panel === 'upload' && <UploadPanel onConvert={handleConvert} />}
          {panel === 'processing' && <ProcessingPanel />}
          {panel === 'completed' && currentJobId && (
            <CompletedPanel jobId={currentJobId} onReset={resetToUpload} />
          )}
          {panel === 'failed' && <FailedPanel error={errorMsg} onRetry={resetToUpload} />}
          <HistoryList jobs={history} />
        </div>
      </main>
    </div>
  )
}
