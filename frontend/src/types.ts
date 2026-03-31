export type PanelState = 'upload' | 'processing' | 'completed' | 'failed'

export interface UserInfo {
  type: 'guest' | 'member'
  email: string | null
}

export interface Job {
  id: string
  status: 'processing' | 'completed' | 'failed'
  error: string | null
  original_filename: string | null
  created_at: string | null
  updated_at: string | null
  total_lines: number | null
  current_line: number | null
}
