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

const REMINDER_OPTIONS = [
  { value: 5, label: '5 分钟' },
  { value: 10, label: '10 分钟' },
  { value: 15, label: '15 分钟' },
  { value: 30, label: '30 分钟' },
  { value: 60, label: '1 小时' },
]

export function SettingsView(props: SettingsViewProps) {
  const { records, pushEnabled, pushStatusText, reminderMinutes, onReminderMinutesChange, onEnablePush, onDisablePush, onSyncPush, onTestPush, onClearAll, onExportBackup, onImportBackup } = props

  return (
    <div>
      <section className="panel">
        <h2>设置</h2>
        <div className="push-panel">
          <h3>推送提醒</h3>
          <p className="push-status">{pushStatusText}</p>
          <div className="reminder-setting">
            <span className="reminder-label">提前提醒时间</span>
            <div className="reminder-options">
              {REMINDER_OPTIONS.map((option) => {
                const isActive = reminderMinutes === option.value
                const className = isActive ? 'reminder-option active' : 'reminder-option'
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={className}
                    onClick={() => onReminderMinutesChange(option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
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
        </div>
      </section>

      <section className="panel">
        <h3>数据管理</h3>
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
      </section>

      <section className="panel">
        <h3>导入记录</h3>
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
      </section>

      <section className="panel">
        <button type="button" className="danger" onClick={() => void onClearAll()}>清空所有课程数据</button>
      </section>
    </div>
  )
}
