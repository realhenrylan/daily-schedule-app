import type { ImportRecord } from '../types'
import type { PushDispatchLog } from '../lib/push'

interface SettingsViewProps {
  records: ImportRecord[]
  pushEnabled: boolean
  pushStatusText: string
  pushLogs: PushDispatchLog[]
  pushLogsLoading: boolean
  onEnablePush: () => Promise<void>
  onDisablePush: () => Promise<void>
  onSyncPush: () => Promise<void>
  onTestPush: () => Promise<void>
  onRefreshPushLogs: () => Promise<void>
  onClearAll: () => Promise<void>
  onExportBackup: () => void
  onImportBackup: (file: File) => Promise<void>
}

export function SettingsView({
  records,
  pushEnabled,
  pushStatusText,
  pushLogs,
  pushLogsLoading,
  onEnablePush,
  onDisablePush,
  onSyncPush,
  onTestPush,
  onRefreshPushLogs,
  onClearAll,
  onExportBackup,
  onImportBackup,
}: SettingsViewProps) {
  return (
    <section className="panel">
      <h2>设置</h2>
      <p className="muted">当前已导入 {records.length} 次。</p>

      <div className="push-panel">
        <h3>课程推送提醒</h3>
        <p className="muted">{pushStatusText}</p>
        <div className="schedule-actions schedule-actions-secondary">
          {pushEnabled ? (
            <button type="button" onClick={() => void onDisablePush()}>
              关闭推送
            </button>
          ) : (
            <button type="button" onClick={() => void onEnablePush()}>
              开启推送
            </button>
          )}
          <button type="button" onClick={() => void onSyncPush()}>
            同步提醒
          </button>
          <button type="button" onClick={() => void onTestPush()}>
            发送测试通知
          </button>
        </div>

        <div className="push-log-header">
          <h4>最近派发日志</h4>
          <button type="button" onClick={() => void onRefreshPushLogs()}>
            刷新日志
          </button>
        </div>
        {pushLogsLoading ? <p className="muted">日志加载中...</p> : null}
        {!pushLogsLoading && pushLogs.length === 0 ? <p className="muted">暂无日志</p> : null}
        {pushLogs.length > 0 ? (
          <div className="list push-log-list">
            {pushLogs.map((log) => (
              <article className="card" key={log.id}>
                <header>
                  <strong>{log.title || '系统'}</strong>
                  <span>{new Date(log.at).toLocaleString()}</span>
                </header>
                <small>
                  [{log.level}] {log.result}
                  {typeof log.retryCount === 'number' ? ` · 重试 ${log.retryCount} 次` : ''}
                </small>
                {log.detail ? <p>{log.detail}</p> : null}
              </article>
            ))}
          </div>
        ) : null}
      </div>

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
