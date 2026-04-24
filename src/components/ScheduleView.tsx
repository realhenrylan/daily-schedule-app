import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import type { CourseEvent } from '../types'
import { getWeekDays, isSameDate, sortByStart, startOfWeek } from '../lib/date'
import { useSwipe } from '../lib/useSwipe'

interface ScheduleViewProps {
  events: CourseEvent[]
  onEditEvent: (event: CourseEvent) => void
}

export function ScheduleView({ events, onEditEvent }: ScheduleViewProps) {
  const [weekCursor, setWeekCursor] = useState(() => startOfWeek(dayjs()))

  const days = useMemo(() => getWeekDays(weekCursor), [weekCursor])
  const today = dayjs()
  const todayKey = today.format('YYYY-MM-DD')

  const weekTsList = useMemo(() => {
    const unique = new Set(events.map((event) => startOfWeek(dayjs(event.start)).startOf('day').valueOf()))
    return [...unique].sort((a, b) => a - b)
  }, [events])

  const currentWeekTs = weekCursor.startOf('day').valueOf()
  const hasEventsThisWeek = weekTsList.includes(currentWeekTs)

  const prevEventWeekTs = useMemo(() => {
    for (let i = weekTsList.length - 1; i >= 0; i -= 1) {
      if (weekTsList[i] < currentWeekTs) return weekTsList[i]
    }
    return null
  }, [weekTsList, currentWeekTs])

  const nextEventWeekTs = useMemo(() => {
    for (let i = 0; i < weekTsList.length; i += 1) {
      if (weekTsList[i] > currentWeekTs) return weekTsList[i]
    }
    return null
  }, [weekTsList, currentWeekTs])

  const weekLabel = useMemo(() => {
    const start = days[0]
    const end = days[6]
    if (start.month() === end.month()) {
      return `${start.month() + 1}月${start.date()}日 - ${end.date()}日`
    }
    return `${start.month() + 1}/${start.date()} - ${end.month() + 1}/${end.date()}`
  }, [days])

  const { handlers: swipeHandlers } = useSwipe({
    onSwipeLeft: () => setWeekCursor((prev) => prev.add(7, 'day')),
    onSwipeRight: () => setWeekCursor((prev) => prev.subtract(7, 'day')),
    threshold: 60,
  })

  function goToPrevWeek() {
    setWeekCursor((prev) => prev.subtract(7, 'day'))
  }

  function goToNextWeek() {
    setWeekCursor((prev) => prev.add(7, 'day'))
  }

  function goToPrevEventWeek() {
    if (prevEventWeekTs !== null) {
      setWeekCursor(dayjs(prevEventWeekTs))
    } else if (weekTsList.length > 0) {
      setWeekCursor(dayjs(weekTsList[weekTsList.length - 1]))
    }
  }

  function goToNextEventWeek() {
    if (nextEventWeekTs !== null) {
      setWeekCursor(dayjs(nextEventWeekTs))
    } else if (weekTsList.length > 0) {
      setWeekCursor(dayjs(weekTsList[0]))
    }
  }

  function goToThisWeek() {
    setWeekCursor(startOfWeek(today))
  }

  return (
    <section className="panel">
      <header className="schedule-header">
        <h2>课表</h2>
      </header>

      <div className="schedule-week-nav">
        <button type="button" onClick={goToPrevWeek}>
          ‹
        </button>
        <span>{weekLabel}</span>
        <button type="button" onClick={goToNextWeek}>
          ›
        </button>
      </div>

      <div className="schedule-quick-nav">
        <button type="button" onClick={goToPrevEventWeek}>
          上一有课周
        </button>
        <button type="button" onClick={goToThisWeek} className="today-btn">
          本周
        </button>
        <button type="button" onClick={goToNextEventWeek}>
          下一有课周
        </button>
      </div>

      {!hasEventsThisWeek && weekTsList.length > 0 && (
        <p className="muted" style={{ textAlign: 'center', marginTop: '8px' }}>
          当前周没有课程
        </p>
      )}

      <div className="week-grid" {...swipeHandlers}>
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
