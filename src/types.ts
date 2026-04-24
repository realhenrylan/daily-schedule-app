export type AppTab = 'home' | 'schedule' | 'calendar' | 'import' | 'settings' | 'ops'

export type WeekdayCode = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'

export interface Semester {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

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
  reminderMinutes?: number
  semesterId?: string
  isFavorite?: boolean
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
  semesterId?: string
}

export interface ImportResult {
  parsed: CourseEvent[]
  inserted: number
  skippedAsDuplicate: number
}

export interface BackupPayload {
  version: 2
  exportedAt: string
  events: CourseEvent[]
  records: ImportRecord[]
  semesters: Semester[]
  activeSemesterId?: string
}
