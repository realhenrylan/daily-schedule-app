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

  const weekCount = events.filter((event) => {
    const start = dayjs(event.start)
    return start.isAfter(weekStart.subtract(1, 'ms')) && start.isBefore(weekEnd.add(1, 'ms'))
  }).length

  return (
    <section className="panel">
      <h2>今日课程</h2>
      <p className="muted">今天共 {todayEvents.length} 节课，本周共 {weekCount} 条安排。</p>

      <div className="list">
        {todayEvents.length === 0 ? (
          <div className="empty">今天没有课程安排</div>
        ) : (
          todayEvents.map((event) => (
            <article key={event.id} className="card">
              <header>
                <strong>{event.title}</strong>
                <span>{formatTimeRange(event)}</span>
              </header>
              {event.location ? <p>{event.location}</p> : null}
              {event.note ? <small>{event.note}</small> : null}
            </article>
          ))
        )}
      </div>
    </section>
  )
}
