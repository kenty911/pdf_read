import { useCallback, useEffect, useState } from 'react'
import AuthModal from './components/AuthModal'
import CompletedPanel from './components/CompletedPanel'
import FailedPanel from './components/FailedPanel'
import HistoryList from './components/HistoryList'
import PlayerBar from './components/PlayerBar'
import ProcessingPanel from './components/ProcessingPanel'
import UploadPanel from './components/UploadPanel'
import { PlayerProvider } from './context/PlayerContext'
import type { Job, PanelState, UserInfo } from './types'

const POLL_INTERVAL_MS = 3000

export default function App() {
  const [panel, setPanel] = useState<PanelState>('upload')
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [currentJob, setCurrentJob] = useState<Job | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [history, setHistory] = useState<Job[]>([])
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null)

  const loadHistory = useCallback(async () => {
    try {
      const resp = await fetch('/api/jobs')
      if (!resp.ok) return
      setHistory(await resp.json())
    } catch {
      // ignore
    }
  }, [])

  const loadUserInfo = useCallback(async () => {
    try {
      const resp = await fetch('/api/auth/me')
      if (!resp.ok) return
      setUserInfo(await resp.json())
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    loadHistory()
    loadUserInfo()
  }, [loadHistory, loadUserInfo])

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
        setCurrentJob(data)
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
    setCurrentJob(null)
    setPanel('upload')
  }

  const handleJobRetry = async () => {
    if (!currentJobId) return
    try {
      const resp = await fetch(`/api/jobs/${currentJobId}/retry`, { method: 'POST' })
      if (!resp.ok) {
        const data = await resp.json()
        throw new Error(data.error || '再実行に失敗しました')
      }
      setPanel('processing')
      pollStatus(currentJobId)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '再実行に失敗しました')
    }
  }

  const handleAuthSuccess = () => {
    window.location.reload()
  }

  return (
    <PlayerProvider>
      <div className="bg-gray-50 min-h-screen flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-800">PDF to MP3</span>
          <div className="flex items-center gap-3">
            {userInfo?.type === 'member' ? (
              <>
                <span className="text-sm text-gray-500 hidden sm:block">{userInfo.email}</span>
                <form action="/api/logout" method="post">
                  <button
                    type="submit"
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    ログアウト
                  </button>
                </form>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setAuthModal('login')}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  ログイン
                </button>
                <button
                  type="button"
                  onClick={() => setAuthModal('register')}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors"
                >
                  会員登録
                </button>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-12">
          <div className="max-w-lg mx-auto">
            {userInfo?.type === 'guest' && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
                現在ゲストとして利用中です。{' '}
                <button
                  type="button"
                  onClick={() => setAuthModal('register')}
                  className="font-semibold underline"
                >
                  会員登録
                </button>{' '}
                すると複数端末からデータにアクセスできます。
              </div>
            )}
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
          </div>
        </main>

        <PlayerBar />
      </div>

      {authModal && (
        <AuthModal
          initialView={authModal}
          onClose={() => setAuthModal(null)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </PlayerProvider>
  )
}
