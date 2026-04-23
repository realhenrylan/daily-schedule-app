import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import type { CourseEvent } from '../types'
import { parseIcsToEvents } from '../lib/ics'

interface ImportViewProps {
  existingEvents: CourseEvent[]
  onConfirmImport: (incoming: CourseEvent[], sourceName: string) => Promise<void>
}

export function ImportView({ existingEvents, onConfirmImport }: ImportViewProps) {
  const [sourceName, setSourceName] = useState('')
  const [preview, setPreview] = useState<CourseEvent[]>([])
  const [error, setError] = useState('')

  const existingKeys = useMemo(() => {
    return new Set(existingEvents.map((event) => `${event.uid || event.title}|${event.start}`))
  }, [existingEvents])

  const dedupPreview = useMemo(() => {
    return preview.filter((event) => !existingKeys.has(`${event.uid || event.title}|${event.start}`))
  }, [preview, existingKeys])

  async function onPickFile(file: File) {
    try {
      const content = await file.text()
      const parsed = parseIcsToEvents(content)
      setSourceName(file.name)
      setPreview(parsed)
      setError('')
    } catch (err) {
      const detail = err instanceof Error ? err.message : '未知错误'
      setError(`导入失败：${detail}`)
      setPreview([])
    }
  }

  return (
    <section className="panel">
      <h2>导入 ICS</h2>
      <label className="file-picker">
        选择 .ics 文件
        <input
          type="file"
          accept=".ics,text/calendar"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void onPickFile(file)
            }
          }}
        />
      </label>

      {error ? <p className="error">{error}</p> : null}

      <p className="muted">
        预览：共 {preview.length} 条，去重后可导入 {dedupPreview.length} 条。
      </p>

      {dedupPreview.length > 0 ? (
        <button type="button" onClick={() => void onConfirmImport(dedupPreview, sourceName)}>
          确认导入
        </button>
      ) : null}

      <div className="list">
        {dedupPreview.slice(0, 30).map((event) => (
          <article className="card" key={event.id}>
            <header>
              <strong>{event.title}</strong>
              <span>{dayjs(event.start).format('MM/DD HH:mm')}</span>
            </header>
            {event.location ? <p>{event.location}</p> : null}
            {event.recurrenceRule ? <small>重复：{event.recurrenceRule}</small> : null}
          </article>
        ))}
      </div>
    </section>
  )
}
