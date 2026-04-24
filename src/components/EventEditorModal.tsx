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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await onSave({ ...draft, updatedAt: new Date().toISOString() })
    onClose()
  }

  async function handleDelete() {
    if (!window.confirm('确认删除这条课程吗？该操作不可撤销。')) {
      return
    }
    await onDelete(event.id)
    onClose()
  }

  return (
    <div className="modal-mask" role="dialog" aria-modal="true">
      <div className="modal-card">
        <header className="modal-header">
          <h3>编辑课程</h3>
          <button type="button" onClick={onClose}>
            关闭
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            课程名
            <input
              required
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            />
          </label>

          <label>
            开始时间
            <input
              type="datetime-local"
              value={toLocalInputValue(draft.start)}
              onChange={(e) => setDraft((prev) => ({ ...prev, start: dayjs(e.target.value).toISOString() }))}
            />
          </label>

          <label>
            结束时间
            <input
              type="datetime-local"
              value={toLocalInputValue(draft.end)}
              onChange={(e) => setDraft((prev) => ({ ...prev, end: dayjs(e.target.value).toISOString() }))}
            />
          </label>

          <label>
            地点
            <input
              value={draft.location || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
            />
          </label>

          <label>
            备注
            <input
              value={draft.note || ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))}
            />
          </label>

          <div>
            <p>颜色</p>
            <div className="color-picker">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={draft.color === color ? 'color-chip active' : 'color-chip'}
                  style={{ background: color }}
                  onClick={() => setDraft((prev) => ({ ...prev, color }))}
                  aria-label={`选择颜色 ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="danger" onClick={() => void handleDelete()}>
              删除课程
            </button>
            <button type="submit">保存</button>
          </div>
        </form>
      </div>
    </div>
  )
}
