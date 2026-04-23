export type AppTab = 'home' | 'schedule' | 'calendar' | 'import' | 'settings'

export type WeekdayCode = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'

export interface CourseEvent {
  id: string
  uid?: string
  title: string
  start: string
  end: string
  location?: string
  note?: string
  color?: string
  recurrenceRule?: string
  createdAt: string
  updatedAt: string
}

export interface ImportRecord {
  id: string
  sourceName: string
  importedAt: string
  totalParsed: number
  inserted: number
  skippedAsDuplicate: number
}

export interface ImportResult {
  parsed: CourseEvent[]
  inserted: number
  skippedAsDuplicate: number
}

export interface BackupPayload {
  version: 1
  exportedAt: string
  events: CourseEvent[]
  records: ImportRecord[]
}
