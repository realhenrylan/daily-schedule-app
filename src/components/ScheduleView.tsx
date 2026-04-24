import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import type { CourseEvent } from '../types'
import { formatTimeRange, getWeekDays, isSameDate, sortByStart, startOfWeek } from '../lib/date'

interface ScheduleViewProps {
  events: CourseEvent[]
  onEditEvent: (event: CourseEvent) => void
}

export function ScheduleView({ events, onEditEvent }: ScheduleViewProps) {
  const [weekCursor, setWeekCursor] = useState(() => startOfWeek(dayjs()))

  const days = useMemo(() => getWeekDays(weekCursor), [weekCursor])
  const today = dayjs()
  const todayKey = today.format('YYYY-MM-DD')

  const weekLabel = useMemo(() => {
    const start = days[0]
    const end = days[6]
    if (start.month() === end.month()) {
      return `${start.month() + 1}月${start.date()}日 - ${end.date()}日`
    }
    return `${start.month() + 1}/${start.date()} - ${end.month() + 1}/${end.date()}`
  }, [days])

  return (
    <section className="panel">
      <header className="schedule-header">
        <h2>课表</h2>
      </header>

      <div className="schedule-week-nav">
        <button type="button" onClick={() => setWeekCursor((prev) => prev.subtract(7, 'day'))}>
          ‹
        </button>
        <span>{weekLabel}</span>
        <button type="button" onClick={() => setWeekCursor((prev) => prev.add(7, 'day'))}>
          ›
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
        <button
          type="button"
          onClick={() => setWeekCursor(startOfWeek(today))}
          style={{
            border: 'none',
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          回到本周
        </button>
      </div>

      <div className="week-grid">
        {days.map((day) => {
          const dayKey = day.format('YYYY-MM-DD')
          const dayEvents = sortByStart(events.filter((event) => isSameDate(event.start, day)))
          const isToday = dayKey === todayKey

          return (
            <div key={dayKey} className={`day-col ${isToday ? 'today' : ''}`}>
              <h3>
                {day.format('ddd')}
                <span>{day.format('MM/DD')}</span>
              </h3>
              {dayEvents.length === 0 ? (
                <div className="empty" style={{ padding: '8px 4px', fontSize: '12px' }}>
                  -
                </div>
              ) : (
                dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="event-block"
                    style={{ borderLeftColor: event.color || 'var(--accent)' }}
                    onClick={() => onEditEvent(event)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onEditEvent(event)
                      }
                    }}
                  >
                    <strong>{event.title}</strong>
                    <span>{dayjs(event.start).format('HH:mm')}</span>
                  </div>
                ))
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
