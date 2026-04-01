'use client'

import { type DragEvent, useRef, useState } from 'react'

interface Props {
  onConvert: (file: File) => Promise<void>
}

export default function UploadPanel({ onConvert }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const setFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('PDFファイルを選択してください')
      return
    }
    setSelectedFile(file)
    setError('')
  }

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0])
  }

  const handleSubmit = async () => {
    if (!selectedFile) return
    setLoading(true)
    setError('')
    try {
      await onConvert(selectedFile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        PDFをアップロード
      </h2>
      <p className="text-gray-500 mb-6">
        PDFファイルを選択してMP3に変換します。
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`w-full border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
      >
        <svg
          className="mx-auto mb-3 w-10 h-10 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-label="アップロード"
        >
          <title>アップロード</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-gray-600 font-medium">ここにドロップ、または</p>
        <span className="mt-2 inline-block text-blue-600 hover:underline font-semibold">
          ファイルを選択
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
        />
        {selectedFile && (
          <p className="mt-2 text-sm text-gray-500">{selectedFile.name}</p>
        )}
      </button>

      {error && (
        <div className="mt-3 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedFile || loading}
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
      >
        MP3に変換
      </button>
    </div>
  )
}
