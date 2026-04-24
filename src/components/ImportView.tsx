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
  const [isImporting, setIsImporting] = useState(false)

  const existingKeys = useMemo(() => {
    return new Set(existingEvents.map((event) => `${event.uid || event.title}|${event.start}`))
  }, [existingEvents])

  const dedupPreview = useMemo(() => {
    return preview.filter((event) => !existingKeys.has(`${event.uid || event.title}|${event.start}`))
  }, [preview, existingKeys])

  async function onPickFile(file: File) {
    try {
      setIsImporting(true)
      const content = await file.text()
      const parsed = parseIcsToEvents(content)
      setSourceName(file.name)
      setPreview(parsed)
      setError('')
    } catch (err) {
      const detail = err instanceof Error ? err.message : '未知错误'
      setError(`解析失败：${detail}`)
      setPreview([])
    } finally {
      setIsImporting(false)
    }
  }

  async function handleConfirm() {
    if (dedupPreview.length === 0) return
    setIsImporting(true)
    try {
      await onConfirmImport(dedupPreview, sourceName)
      setPreview([])
      setSourceName('')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <section className="panel">
      <h2>导入课程</h2>
      <p className="muted">从学校教务系统或其他日历导出 .ics 文件</p>

      <label className="file-picker" style={{ width: '100%', justifyContent: 'center' }}>
        {isImporting ? '解析中...' : '📁 选择 ICS 文件'}
        <input
          type="file"
          accept=".ics,text/calendar"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void onPickFile(file)
            }
          }}
          disabled={isImporting}
        />
      </label>

      {error ? (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            background: 'var(--danger)',
            color: 'white',
            borderRadius: '10px',
            fontSize: '14px',
          }}
        >
          ⚠️ {error}
        </div>
      ) : null}

      {preview.length > 0 && (
        <>
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: 'var(--accent-light)',
              borderRadius: '12px',
            }}
          >
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              <strong style={{ fontSize: '18px', color: 'var(--accent)' }}>{dedupPreview.length}</strong> 条可导入
              {preview.length - dedupPreview.length > 0 && (
                <span className="muted">（{preview.length - dedupPreview.length} 条重复已跳过）</span>
              )}
            </div>
          </div>

          {dedupPreview.length > 0 && (
            <button
              type="button"
              className="primary"
              onClick={() => void handleConfirm()}
              disabled={isImporting}
              style={{
                width: '100%',
                height: '50px',
                marginTop: '12px',
                border: 'none',
                borderRadius: '12px',
                background: 'var(--accent)',
                color: 'white',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              {isImporting ? '导入中...' : `确认导入 ${dedupPreview.length} 条`}
            </button>
          )}

          <div className="list" style={{ marginTop: '16px' }}>
            <div className="card" style={{ background: 'var(--surface)', marginBottom: '8px' }}>
              <small className="muted">
                预览前 {Math.min(dedupPreview.length, 20)} 条（共 {dedupPreview.length} 条）
              </small>
            </div>
            {dedupPreview.slice(0, 20).map((event) => (
              <article className="card" key={event.id}>
                <header>
                  <strong>{event.title}</strong>
                  <span>{dayjs(event.start).format('M/D HH:mm')}</span>
                </header>
                {event.location ? <p>📍 {event.location}</p> : null}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
