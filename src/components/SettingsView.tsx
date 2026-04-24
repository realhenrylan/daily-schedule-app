import type { ImportRecord } from '../types'

interface SettingsViewProps {
  records: ImportRecord[]
  pushEnabled: boolean
  pushStatusText: string
  onEnablePush: () => Promise<void>
  onDisablePush: () => Promise<void>
  onSyncPush: () => Promise<void>
  onTestPush: () => Promise<void>
  onClearAll: () => Promise<void>
  onExportBackup: () => void
  onImportBackup: (file: File) => Promise<void>
}

export function SettingsView({
  records,
  pushEnabled,
  pushStatusText,
  onEnablePush,
  onDisablePush,
  onSyncPush,
  onTestPush,
  onClearAll,
  onExportBackup,
  onImportBackup,
}: SettingsViewProps) {
  return (
    <>
      <section className="panel">
        <h2>设置</h2>

        <div className="push-panel">
          <h3>推送提醒</h3>
          <p className="push-status">{pushStatusText}</p>
          <div className="push-buttons" style={{ display: 'grid', gridTemplateColumns: pushEnabled ? 'repeat(3, 1fr)' : '1fr', gap: '8px' }}>
            {pushEnabled ? (
              <>
                <button type="button" onClick={() => void onSyncPush()}>
                  同步
                </button>
                <button type="button" onClick={() => void onTestPush()}>
                  测试
                </button>
                <button type="button" className="danger" onClick={() => void onDisablePush()}>
                  关闭
                </button>
              </>
            ) : (
              <button type="button" className="primary" onClick={() => void onEnablePush()}>
                开启推送
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>数据管理</h3>
        <p className="muted">共导入 {records.length} 次课程数据</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={onExportBackup}
            style={{
              width: '100%',
              height: '48px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '16px',
              fontWeight: 500,
            }}
          >
            导出备份
          </button>
          <label className="file-picker" style={{ width: '100%', justifyContent: 'center' }}>
            导入备份
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
        <button type="button" className="danger" onClick={() => void onClearAll()}>
          清空所有课程数据
        </button>
      </section>
    </>
  )
}
