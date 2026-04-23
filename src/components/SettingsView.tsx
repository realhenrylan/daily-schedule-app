import type { ImportRecord } from '../types'

interface SettingsViewProps {
  records: ImportRecord[]
  onClearAll: () => Promise<void>
  onExportBackup: () => void
  onImportBackup: (file: File) => Promise<void>
}

export function SettingsView({ records, onClearAll, onExportBackup, onImportBackup }: SettingsViewProps) {
  return (
    <section className="panel">
      <h2>设置</h2>
      <p className="muted">当前已导入 {records.length} 次。</p>

      <div className="schedule-actions schedule-actions-secondary">
        <button type="button" onClick={onExportBackup}>
          导出备份（JSON）
        </button>
        <label className="file-picker">
          导入备份（JSON）
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                void onImportBackup(file)
              }
              event.currentTarget.value = ''
            }}
          />
        </label>
      </div>

      <button type="button" className="danger" onClick={() => void onClearAll()}>
        清空本地课程数据
      </button>

      <div className="list">
        {records.slice().reverse().map((record) => (
          <article className="card" key={record.id}>
            <header>
              <strong>{record.sourceName}</strong>
              <span>{new Date(record.importedAt).toLocaleString()}</span>
            </header>
            <small>
              解析 {record.totalParsed} 条，新增 {record.inserted} 条，跳过重复 {record.skippedAsDuplicate} 条
            </small>
          </article>
        ))}
      </div>
    </section>
  )
}
