import { useState } from 'react'
import dayjs from 'dayjs'
import type { CourseEvent } from '../types'

interface EventEditorModalProps {
  event: CourseEvent
  onClose: () => void
  onSave: (event: CourseEvent) => Promise<void>
  onDelete: (eventId: string) => Promise<void>
}

const PRESET_COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

function toLocalInputValue(iso: string): string {
  const d = dayjs(iso)
  return d.format('YYYY-MM-DDTHH:mm')
}

export function EventEditorModal({ event, onClose, onSave, onDelete }: EventEditorModalProps) {
  const [draft, setDraft] = useState<CourseEvent>(event)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave({ ...draft, updatedAt: new Date().toISOString() })
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('确认删除这条课程吗？该操作不可撤销。')) {
      return
    }
    await onDelete(event.id)
    onClose()
  }

  return (
    <div className="modal-mask" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <header className="modal-header">
          <h3>编辑课程</h3>
          <button type="button" onClick={onClose}>
            ✕
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            课程名
            <input
              required
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="输入课程名称"
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ gridColumn: '1 / -1' }}>
              开始时间
              <input
                type="datetime-local"
                value={toLocalInputValue(draft.start)}
                onChange={(e) => setDraft((prev) => ({ ...prev, start: dayjs(e.target.value).toISOString() }))}
              />
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
              结束时间
              <input
                type="datetime-local"
                value={toLocalInputValue(draft.end)}
                onChange={(e) => setDraft((prev) => ({ ...prev, end: dayjs(e.target.value).toISOString() }))}
              />
            </label>
          </div>

          <label>
            地点
            <input
              value={draft.location || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="上课地点（选填）"
            />
          </label>

          <label>
            备注
            <textarea
              value={draft.note || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="添加备注（选填）"
              rows={2}
            />
          </label>

          <div>
            <p style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--text-secondary)' }}>颜色标签</p>
            <div className="color-picker">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-chip ${draft.color === color ? 'active' : ''}`}
                  style={{ background: color }}
                  onClick={() => setDraft((prev) => ({ ...prev, color }))}
                  aria-label={`选择颜色 ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={() => void handleDelete()} style={{ background: 'var(--bg)', color: 'var(--danger)' }}>
              删除
            </button>
            <button type="submit" className="primary" disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
