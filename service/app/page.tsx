import { getUserId } from '@/actions/auth'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const userId = await getUserId()
  if (userId) redirect('/app')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">PDF to MP3</h1>
      <p className="text-gray-500 mb-8 text-center max-w-md">
        PDFファイルをアップロードして、日本語音声のMP3ファイルに変換します。
      </p>
      <a
        href="/app"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
      >
        はじめる
      </a>
    </main>
  )
}
