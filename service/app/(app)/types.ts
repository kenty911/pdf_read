export type PanelState = 'upload' | 'processing' | 'completed' | 'failed'

export interface JobJSON {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error: string | null
  original_filename: string | null
  created_at: string | null
  updated_at: string | null
  total_lines: number | null
  current_line: number | null
}
