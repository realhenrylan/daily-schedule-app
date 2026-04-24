import { useState, type ReactNode } from 'react'
import type { ImportRecord } from '../types'

interface SettingsViewProps {
  records: ImportRecord[]
  pushEnabled: boolean
  pushStatusText: string
  reminderMinutes: number
  onReminderMinutesChange: (minutes: number) => void
  onEnablePush: () => Promise<void>
  onDisablePush: () => Promise<void>
  onSyncPush: () => Promise<void>
  onTestPush: () => Promise<void>
  onClearAll: () => Promise<void>
  onExportBackup: () => void
  onImportBackup: (file: File) => Promise<void>
}

const PRESET_OPTIONS = [
  { value: 5, label: '5 分钟' },
  { value: 10, label: '10 分钟' },
  { value: 15, label: '15 分钟' },
  { value: 30, label: '30 分钟' },
  { value: 60, label: '1 小时' },
]

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

function CollapsibleSection({ title, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="settings-section">
      <button
        type="button"
        className="settings-section-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <span className={`settings-section-arrow ${isOpen ? 'open' : ''}`}>›</span>
      </button>
      {isOpen && <div className="settings-section-content">{children}</div>}
    </div>
  )
}

export function SettingsView(props: SettingsViewProps) {
  const { records, pushEnabled, pushStatusText, reminderMinutes, onReminderMinutesChange, onEnablePush, onDisablePush, onSyncPush, onTestPush, onClearAll, onExportBackup, onImportBackup } = props

  const [customMinutes, setCustomMinutes] = useState('')
  const isPreset = PRESET_OPTIONS.some(opt => opt.value === reminderMinutes)
  const isCustom = !isPreset && reminderMinutes > 0

  const handleCustomChange = (value: string) => {
    setCustomMinutes(value)
    const num = Number.parseInt(value, 10)
    if (value === '') {
      return
    }
    if (Number.isFinite(num) && num > 0 && num <= 1440) {
      onReminderMinutesChange(num)
    }
  }

  const handleCustomBlur = () => {
    const num = Number.parseInt(customMinutes, 10)
    if (!Number.isFinite(num) || num <= 0 || num > 1440) {
      setCustomMinutes('')
    }
  }

  return (
    <div>
      <section className="panel">
        <h2>设置</h2>

        <CollapsibleSection title="推送提醒" defaultOpen>
          <p className="push-status">{pushStatusText}</p>
          <div className="reminder-setting">
            <span className="reminder-label">默认提醒时间</span>
            <div className="reminder-options">
              {PRESET_OPTIONS.map((option) => {
                const isActive = reminderMinutes === option.value
                const className = isActive ? 'reminder-option active' : 'reminder-option'
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={className}
                    onClick={() => {
                      onReminderMinutesChange(option.value)
                      setCustomMinutes('')
                    }}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
            <div className="reminder-custom">
              <span className="reminder-custom-label">自定义</span>
              <div className="reminder-custom-input">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={isCustom ? reminderMinutes : customMinutes}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  onBlur={handleCustomBlur}
                  placeholder="输入分钟"
                  className={isCustom ? 'active' : ''}
                />
                <span className="reminder-custom-suffix">分钟</span>
              </div>
            </div>
          </div>
          <div className="push-buttons">
            {pushEnabled ? (
              <div className="push-buttons-grid">
                <button type="button" onClick={() => void onSyncPush()}>同步</button>
                <button type="button" onClick={() => void onTestPush()}>测试</button>
                <button type="button" className="danger" onClick={() => void onDisablePush()}>关闭</button>
              </div>
            ) : (
              <button type="button" className="primary" onClick={() => void onEnablePush()}>开启推送</button>
            )}
          </div>
          <p className="settings-hint">可在课程编辑中为单个课程设置不同的提醒时间</p>
        </CollapsibleSection>

        <CollapsibleSection title="数据管理">
          <p className="muted">共导入 {records.length} 次课程数据</p>
          <div className="backup-buttons">
            <button type="button" className="backup-btn" onClick={onExportBackup}>导出备份</button>
            <label className="file-picker">
              导入备份
              <input
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  const file = event.target.files && event.target.files[0]
                  if (file) {
                    void onImportBackup(file)
                  }
                  event.currentTarget.value = ''
                }}
              />
            </label>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="导入记录">
          <div className="list">
            {records.length === 0 ? (
              <div className="empty">暂无导入记录</div>
            ) : (
              records.slice().reverse().map((record) => (
                <article className="card" key={record.id}>
                  <header>
                    <strong>{record.sourceName}</strong>
                    <span>{new Date(record.importedAt).toLocaleDateString()}</span>
                  </header>
                  <small>
                    新增 {record.inserted} 条 · 跳过 {record.skippedAsDuplicate} 条
                  </small>
                </article>
              ))
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="危险操作">
          <button type="button" className="danger" onClick={() => void onClearAll()}>清空所有课程数据</button>
        </CollapsibleSection>
      </section>
    </div>
  )
}
