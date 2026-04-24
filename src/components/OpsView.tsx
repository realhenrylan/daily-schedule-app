import type { PushDispatchLog } from '../lib/push'

interface OpsViewProps {
  logs: PushDispatchLog[]
  loading: boolean
  onRefresh: () => Promise<void>
}

export function OpsView({ logs, loading, onRefresh }: OpsViewProps) {
  return (
    <section className="panel">
      <h2>运维日志</h2>
      <p className="muted">仅用于排查推送与后端任务状态，普通用户无需查看。</p>

      <div className="schedule-actions schedule-actions-secondary">
        <button type="button" onClick={() => void onRefresh()}>
          刷新日志
        </button>
      </div>

      {loading ? <p className="muted">日志加载中...</p> : null}
      {!loading && logs.length === 0 ? <p className="muted">暂无日志</p> : null}

      {logs.length > 0 ? (
        <div className="list push-log-list">
          {logs.map((log) => (
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
    </section>
  )
}
