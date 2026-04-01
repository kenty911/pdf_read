'use client'

import {
  activate,
  forgotPassword,
  login,
  register,
  resetPassword,
} from '@/actions/auth'
import { useEffect, useRef, useState } from 'react'

type ModalView = 'login' | 'register' | 'activate' | 'forgot' | 'reset'

interface Props {
  initialView: 'login' | 'register'
  onClose: () => void
  onSuccess: () => void
}

export default function AuthModal({ initialView, onClose, onSuccess }: Props) {
  const [view, setView] = useState<ModalView>(initialView)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleRegister = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await register(email, password)
      if (!res.ok) {
        setError(res.error ?? '登録に失敗しました')
        return
      }
      setView('activate')
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await activate(email, code)
      if (!res.ok) {
        setError(res.error ?? '認証に失敗しました')
        return
      }
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await login(email, password)
      if (!res.ok) {
        setError(res.error ?? 'ログインに失敗しました')
        return
      }
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await forgotPassword(email)
      if (!res.ok) {
        setError(res.error ?? 'エラーが発生しました')
        return
      }
      setCode('')
      setNewPassword('')
      setView('reset')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await resetPassword(email, code, newPassword)
      if (!res.ok) {
        setError(res.error ?? 'エラーが発生しました')
        return
      }
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (next: 'login' | 'register') => {
    setView(next)
    setError('')
    setPassword('')
    setCode('')
    setNewPassword('')
  }

  const goToForgot = () => {
    setView('forgot')
    setError('')
    setCode('')
    setNewPassword('')
  }

  return (
    <div
      ref={backdropRef}
      role="presentation"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose()
      }}
      onKeyDown={(e) => {
        if (
          e.target === backdropRef.current &&
          (e.key === 'Enter' || e.key === ' ')
        )
          onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="閉じる"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <title>閉じる</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {view === 'activate' && (
          <CodeInputView
            title="確認コードを入力"
            description={
              <>
                <span className="font-medium text-gray-700">{email}</span>{' '}
                に6桁のコードを送信しました。
              </>
            }
            submitLabel="会員登録を完了"
            code={code}
            error={error}
            loading={loading}
            onCodeChange={setCode}
            onSubmit={handleActivate}
            onResend={() => {
              setError('')
              handleRegister()
            }}
          />
        )}

        {view === 'forgot' && (
          <div>
            <button
              type="button"
              onClick={() => switchTab('login')}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4"
            >
              ← ログインに戻る
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              パスワードを再設定
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              登録済みのメールアドレスに確認コードを送信します。
            </p>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="forgot-email"
                >
                  メールアドレス
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example@example.com"
                  autoComplete="email"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleForgot()
                  }}
                />
              </div>
              {error && <ErrorBox message={error} />}
              <button
                type="button"
                onClick={handleForgot}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading ? '送信中...' : '確認コードを送信'}
              </button>
            </div>
          </div>
        )}

        {view === 'reset' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              新しいパスワードを設定
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              <span className="font-medium text-gray-700">{email}</span>{' '}
              に送信したコードと新しいパスワードを入力してください。
            </p>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="reset-code"
                >
                  確認コード
                </label>
                <input
                  id="reset-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000000"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="reset-password"
                >
                  新しいパスワード{' '}
                  <span className="text-xs text-gray-400">（8文字以上）</span>
                </label>
                <input
                  id="reset-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleReset()
                  }}
                />
              </div>
              {error && <ErrorBox message={error} />}
              <button
                type="button"
                onClick={handleReset}
                disabled={
                  loading || code.length !== 6 || newPassword.length < 8
                }
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading ? '処理中...' : 'パスワードを再設定'}
              </button>
              <p className="text-center text-xs text-gray-400">
                コードが届かない場合は{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError('')
                    handleForgot()
                  }}
                  disabled={loading}
                  className="text-blue-600 hover:underline disabled:opacity-50"
                >
                  再送信
                </button>
              </p>
            </div>
          </div>
        )}

        {(view === 'login' || view === 'register') && (
          <>
            <div className="flex border-b border-gray-200 mb-6">
              {(['register', 'login'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => switchTab(v)}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors ${view === v ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {v === 'register' ? '会員登録' : 'ログイン'}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="auth-email"
                >
                  メールアドレス
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="auth-password"
                >
                  パスワード{' '}
                  {view === 'register' && (
                    <span className="ml-1 text-xs text-gray-400">
                      （8文字以上）
                    </span>
                  )}
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  autoComplete={
                    view === 'register' ? 'new-password' : 'current-password'
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter')
                      view === 'register' ? handleRegister() : handleLogin()
                  }}
                />
              </div>
              {view === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={goToForgot}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    パスワードを忘れた
                  </button>
                </div>
              )}
              {error && <ErrorBox message={error} />}
              <button
                type="button"
                onClick={view === 'register' ? handleRegister : handleLogin}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading
                  ? '処理中...'
                  : view === 'register'
                    ? '確認コードを送信'
                    : 'ログイン'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
      {message}
    </p>
  )
}

interface CodeInputViewProps {
  title: string
  description: React.ReactNode
  submitLabel: string
  code: string
  error: string
  loading: boolean
  onCodeChange: (v: string) => void
  onSubmit: () => void
  onResend: () => void
}

function CodeInputView({
  title,
  description,
  submitLabel,
  code,
  error,
  loading,
  onCodeChange,
  onSubmit,
  onResend,
}: CodeInputViewProps) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-500 mb-5">{description}</p>
      <div className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="auth-code"
          >
            確認コード
          </label>
          <input
            id="auth-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ''))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="000000"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmit()
            }}
          />
        </div>
        {error && <ErrorBox message={error} />}
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || code.length !== 6}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
        >
          {loading ? '確認中...' : submitLabel}
        </button>
        <p className="text-center text-xs text-gray-400">
          コードが届かない場合は{' '}
          <button
            type="button"
            onClick={onResend}
            disabled={loading}
            className="text-blue-600 hover:underline disabled:opacity-50"
          >
            再送信
          </button>
        </p>
      </div>
    </div>
  )
}
