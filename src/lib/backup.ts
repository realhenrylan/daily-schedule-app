import { readFileAsText } from '../utils/file'
import type { BackupPayload, CourseEvent, ImportRecord, Semester } from '../types'

export function exportBackupJson(events: CourseEvent[], records: ImportRecord[], semesters: Semester[] = [], activeSemesterId: string | null = null): void {
  const payload: BackupPayload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    events,
    records,
    semesters,
    activeSemesterId: activeSemesterId || undefined,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `schedule-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function isCourseEventArray(value: unknown): value is CourseEvent[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === 'object' && item !== null && 'id' in item && 'title' in item && 'start' in item)
  )
}

function isImportRecordArray(value: unknown): value is ImportRecord[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === 'object' && item !== null && 'id' in item && 'sourceName' in item)
  )
}

export async function importBackupJson(file: File): Promise<{ events: CourseEvent[]; records: ImportRecord[] }> {
  const text = await readFileAsText(file)
  const data = JSON.parse(text) as { version?: number; events?: unknown; records?: unknown }

  if (!data || typeof data.version !== 'number') {
    throw new Error('备份文件版本不支持')
  }

  if (data.version !== 1 && data.version !== 2) {
    throw new Error('备份文件版本不支持')
  }

  if (!isCourseEventArray(data.events) || !isImportRecordArray(data.records)) {
    throw new Error('备份文件结构无效')
  }

  return {
    events: data.events,
    records: data.records,
  }
}
