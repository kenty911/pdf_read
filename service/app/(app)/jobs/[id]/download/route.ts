import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { type NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/actions/auth'
import { Job } from '@/server/models/Job'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const job = await Job.findById(id)
  if (!job || job.userId !== userId || job.status !== 'completed' || !job.mp3Path) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  try {
    await stat(job.mp3Path)
  } catch {
    return NextResponse.json({ error: 'file not found' }, { status: 404 })
  }

  const basename = (job.originalFilename ?? 'output').replace(/\.pdf$/i, '')
  const filename = encodeURIComponent(`${basename}.mp3`)
  const stream = createReadStream(job.mp3Path)
  const webStream = ReadableStream.from(stream as unknown as AsyncIterable<Uint8Array>)

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
    },
  })
}
