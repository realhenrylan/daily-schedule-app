import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import type { CourseEvent } from '../types'
import { formatTimeRange, sortByStart } from '../lib/date'

interface CalendarViewProps {
  events: CourseEvent[]
  onEditEvent: (event: CourseEvent) => void
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

const COURSE_COLORS = [
  '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'
]

function getCourseColor(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length]
}

export function CalendarView({ events, onEditEvent }: CalendarViewProps) {
  const today = dayjs()
  const [monthCursor, setMonthCursor] = useState(today.startOf('month'))
  const [selectedDate, setSelectedDate] = useState(today.format('YYYY-MM-DD'))

  const grouped = useMemo(() => {
    return sortByStart(events).reduce<Record<string, CourseEvent[]>>((acc, event) => {
      const key = dayjs(event.start).format('YYYY-MM-DD')
      acc[key] ??= []
      acc[key].push(event)
      return acc
    }, {})
  }, [events])

  const cells = useMemo(() => {
    const monthStart = monthCursor.startOf('month')
    const gridStart = monthStart.startOf('week')
    return Array.from({ length: 42 }, (_, idx) => gridStart.add(idx, 'day'))
  }, [monthCursor])

  const selectedEvents = grouped[selectedDate] ?? []

  return (
    <section className="panel">
      <header className="calendar-header">
        <h2>日历</h2>
        <div className="calendar-actions">
          <button type="button" onClick={() => setMonthCursor((prev) => prev.subtract(1, 'month'))}>
            ‹
          </button>
          <strong style={{ minWidth: '100px', textAlign: 'center' }}>{monthCursor.format('YYYY年M月')}</strong>
          <button type="button" onClick={() => setMonthCursor((prev) => prev.add(1, 'month'))}>
            ›
          </button>
        </div>
      </header>

      <div className="month-grid">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="weekday-cell">
            {label}
          </div>
        ))}

        {cells.map((date) => {
          const key = date.format('YYYY-MM-DD')
          const inCurrentMonth = date.isSame(monthCursor, 'month')
          const isToday = date.isSame(today, 'day')
          const isSelected = key === selectedDate
          const count = grouped[key]?.length ?? 0

          return (
            <button
              key={key}
              type="button"
              className={[
                'day-cell',
                inCurrentMonth ? '' : 'faded',
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setSelectedDate(key)}
            >
              <span>{date.date()}</span>
              {count > 0 ? <small>{count}</small> : null}
            </button>
          )
        })}
      </div>

      <section className="date-list">
        <h3>{dayjs(selectedDate).format('M月D日')}</h3>
        {selectedEvents.length === 0 ? (
          <div className="empty" style={{ padding: '24px' }}>
            当天没有课程
          </div>
        ) : (
          selectedEvents.map((event) => {
            const color = event.color || getCourseColor(event.title)
            return (
              <article
                key={event.id}
                className="card"
                style={{ borderLeftColor: color }}
                onClick={() => onEditEvent(event)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onEditEvent(event)
                  }
                }}
              >
                <header>
                  <strong style={{ color }}>{event.title}</strong>
                  <span>{formatTimeRange(event)}</span>
                </header>
                {event.location ? <p>{event.location}</p> : null}
                {event.note ? <small>{event.note}</small> : null}
              </article>
            )
          })
        )}
      </section>
    </section>
  )
}
