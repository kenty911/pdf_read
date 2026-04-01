'use client'

import { logout } from '@/actions/auth'
import { useState } from 'react'
import AuthModal from './components/AuthModal'
import PlayerBar from './components/PlayerBar'
import { PlayerProvider } from './context/PlayerContext'

interface Props {
  userInfo: { type: 'guest' | 'member'; email: string | null }
  children: React.ReactNode
}

export default function AppShell({ userInfo, children }: Props) {
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null)

  return (
    <PlayerProvider>
      <div className="bg-gray-50 min-h-screen flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-800">PDF to MP3</span>
          <div className="flex items-center gap-3">
            {userInfo.type === 'member' ? (
              <>
                <span className="text-sm text-gray-500 hidden sm:block">
                  {userInfo.email}
                </span>
                <form action={logout}>
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
            {userInfo.type === 'guest' && (
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
            {children}
          </div>
        </main>

        <PlayerBar />
      </div>

      {authModal && (
        <AuthModal
          initialView={authModal}
          onClose={() => setAuthModal(null)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </PlayerProvider>
  )
}
