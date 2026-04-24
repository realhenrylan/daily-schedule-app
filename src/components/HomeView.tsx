import dayjs from 'dayjs'
import type { CourseEvent } from '../types'
import { formatTimeRange, sortByStart } from '../lib/date'

interface HomeViewProps {
  events: CourseEvent[]
}

export function HomeView({ events }: HomeViewProps) {
  const now = dayjs()
  const todayEvents = sortByStart(events.filter((event) => dayjs(event.start).isSame(now, 'day')))

  const weekStart = now.startOf('week').add(1, 'day')
  const weekEnd = weekStart.add(6, 'day').endOf('day')

  const weekEvents = events.filter((event) => {
    const start = dayjs(event.start)
    return start.isAfter(weekStart.subtract(1, 'ms')) && start.isBefore(weekEnd.add(1, 'ms'))
  })

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
            padding: '8px 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>{todayEvents.length}</div>
          <div style={{ fontSize: '11px', opacity: 0.9 }}>节课</div>
        </div>
      </div>

      {todayEvents.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📚</div>
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
              {event.location ? <p>📍 {event.location}</p> : null}
              {event.note ? <small>{event.note}</small> : null}
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
    </section>
  )
}
