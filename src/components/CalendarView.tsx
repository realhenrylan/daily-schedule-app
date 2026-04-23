import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import type { CourseEvent } from '../types'
import { formatTimeRange, sortByStart } from '../lib/date'

interface CalendarViewProps {
  events: CourseEvent[]
  onEditEvent: (event: CourseEvent) => void
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

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
        <h2>月历</h2>
        <div className="calendar-actions">
          <button type="button" onClick={() => setMonthCursor((prev) => prev.subtract(1, 'month'))}>
            上月
          </button>
          <strong>{monthCursor.format('YYYY 年 M 月')}</strong>
          <button type="button" onClick={() => setMonthCursor((prev) => prev.add(1, 'month'))}>
            下月
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
              {count > 0 ? <small>{count} 节</small> : null}
            </button>
          )
        })}
      </div>

      <section className="list date-list">
        <h3>{dayjs(selectedDate).format('YYYY/MM/DD ddd')} 的课程</h3>
        {selectedEvents.length === 0 ? (
          <div className="empty">当天没有课程</div>
        ) : (
          selectedEvents.map((event) => (
            <article key={event.id} className="card">
              <header>
                <strong>{event.title}</strong>
                <span>{formatTimeRange(event)}</span>
              </header>
              {event.location ? <p>{event.location}</p> : null}
              {event.note ? <small>{event.note}</small> : null}
              <div className="event-actions">
                <button type="button" className="edit-inline-btn" onClick={() => onEditEvent(event)}>
                  编辑课程
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </section>
  )
}
