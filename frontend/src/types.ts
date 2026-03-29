export type PanelState = 'upload' | 'processing' | 'completed' | 'failed'

export interface Job {
  id: string
  status: 'processing' | 'completed' | 'failed'
  error: string | null
  original_filename: string | null
  created_at: string | null
}
