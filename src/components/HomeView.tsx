import dayjs from 'dayjs'
import type { CourseEvent } from '../types'
import { formatTimeRange, sortByStart } from '../lib/date'

interface HomeViewProps {
  events: CourseEvent[]
  conflictEvents: CourseEvent[][]
  onToggleFavorite: (eventId: string) => void
  onAddEvent: () => void
}

export function HomeView({ events, conflictEvents, onToggleFavorite, onAddEvent }: HomeViewProps) {
  const now = dayjs()
  const todayEvents = sortByStart(events.filter((event) => dayjs(event.start).isSame(now, 'day')))

  const weekStart = now.startOf('week').add(1, 'day')
  const weekEnd = weekStart.add(6, 'day').endOf('day')

  const weekEvents = events.filter((event) => {
    const start = dayjs(event.start)
    return start.isAfter(weekStart.subtract(1, 'ms')) && start.isBefore(weekEnd.add(1, 'ms'))
  })

  const todayConflicts = conflictEvents.filter((group) =>
    group.some((event) => dayjs(event.start).isSame(now, 'day')),
  )

  const favoriteEvents = sortByStart(events.filter((event) => event.isFavorite))

  return (
    <section className="panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div>
          <h2>今日课程</h2>
          <p className="muted">
            {now.format('M月D日')} · {now.format('ddd')}
          </p>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            background: 'var(--accent)',
            color: 'white',
            borderRadius: '12px',
            padding: '10px 18px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1 }}>{todayEvents.length}</div>
          <div style={{ fontSize: '11px', opacity: 0.85 }}>节课</div>
        </div>
      </div>

      {todayConflicts.length > 0 && (
        <div className="conflict-warning">
          <span className="conflict-icon">⚠️</span>
          <span>今日有 {todayConflicts.length} 组课程时间冲突</span>
        </div>
      )}

      {todayEvents.length === 0 ? (
        <div className="empty">
          <div>今天没有课程安排</div>
          <p className="muted" style={{ marginTop: '8px' }}>
            本周共 {weekEvents.length} 节课
          </p>
        </div>
      ) : (
        <div className="list">
          {todayEvents.map((event) => (
            <article key={event.id} className="card">
              <header>
                <strong>{event.title}</strong>
                <span>{formatTimeRange(event)}</span>
              </header>
              {event.location ? <p>{event.location}</p> : null}
              {event.note ? <small>{event.note}</small> : null}
              <button
                type="button"
                className="favorite-btn"
                onClick={() => onToggleFavorite(event.id)}
              >
                {event.isFavorite ? '★' : '☆'}
              </button>
            </article>
          ))}
        </div>
      )}

      {weekEvents.length > 0 && todayEvents.length > 0 && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <p className="muted" style={{ textAlign: 'center' }}>
            本周共 {weekEvents.length} 节课
          </p>
        </div>
      )}

      <button type="button" className="quick-add-btn" onClick={onAddEvent}>
        + 添加课程
      </button>

      {favoriteEvents.length > 0 && (
        <div className="favorite-section">
          <h3>收藏课程</h3>
          <div className="favorite-list">
            {favoriteEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="favorite-item">
                <span>{event.title}</span>
                <button type="button" onClick={() => onToggleFavorite(event.id)}>移除</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
