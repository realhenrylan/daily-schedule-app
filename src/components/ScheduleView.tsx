import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import type { CourseEvent } from '../types'
import { formatTimeRange, getWeekDays, isSameDate, sortByStart, startOfWeek } from '../lib/date'

interface ScheduleViewProps {
  events: CourseEvent[]
  onEditEvent: (event: CourseEvent) => void
}

function previousWeekStart(ts: number): number {
  return dayjs(ts).subtract(7, 'day').startOf('day').valueOf()
}

function nextWeekStart(ts: number): number {
  return dayjs(ts).add(7, 'day').startOf('day').valueOf()
}

export function ScheduleView({ events, onEditEvent }: ScheduleViewProps) {
  const [weekCursor, setWeekCursor] = useState(() => startOfWeek(dayjs()))

  const weekTsList = useMemo(() => {
    const unique = new Set(events.map((event) => startOfWeek(dayjs(event.start)).startOf('day').valueOf()))
    return [...unique].sort((a, b) => a - b)
  }, [events])

  const days = useMemo(() => getWeekDays(weekCursor), [weekCursor])
  const rangeLabel = `${days[0].format('MM/DD')} - ${days[6].format('MM/DD')}`

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

  const firstWeekTs = weekTsList[0] ?? null
  const lastWeekTs = weekTsList[weekTsList.length - 1] ?? null

  function jumpPrevEventWeek() {
    if (weekTsList.length === 0) {
      setWeekCursor((prev) => prev.subtract(7, 'day'))
      return
    }

    let target = prevEventWeekTs ?? lastWeekTs
    if (target === null) {
      target = previousWeekStart(currentWeekTs)
    }

    if (target === currentWeekTs) {
      target = previousWeekStart(currentWeekTs)
    }

    setWeekCursor(dayjs(target))
  }

  function jumpNextEventWeek() {
    if (weekTsList.length === 0) {
      setWeekCursor((prev) => prev.add(7, 'day'))
      return
    }

    let target = nextEventWeekTs ?? firstWeekTs
    if (target === null) {
      target = nextWeekStart(currentWeekTs)
    }

    if (target === currentWeekTs) {
      target = nextWeekStart(currentWeekTs)
    }

    setWeekCursor(dayjs(target))
  }

  return (
    <section className="panel">
      <header className="schedule-header">
        <h2>课表</h2>
        <div className="schedule-actions">
          <button type="button" onClick={() => setWeekCursor((prev) => prev.subtract(7, 'day'))}>
            上一周
          </button>
          <strong>{rangeLabel}</strong>
          <button type="button" onClick={() => setWeekCursor((prev) => prev.add(7, 'day'))}>
            下一周
          </button>
          <button type="button" onClick={() => setWeekCursor(startOfWeek(dayjs()))}>
            回到本周
          </button>
        </div>
      </header>

      <div className="schedule-actions schedule-actions-secondary">
        <label className="date-jump">
          跳转日期
          <input
            type="date"
            value={weekCursor.format('YYYY-MM-DD')}
            onChange={(event) => setWeekCursor(startOfWeek(dayjs(event.target.value)))}
          />
        </label>

        <button type="button" onClick={jumpPrevEventWeek}>
          上一有课周
        </button>
        <button type="button" onClick={jumpNextEventWeek}>
          下一有课周
        </button>
      </div>

      <details className="schedule-debug">
        <summary>跳转调试信息</summary>
        <div>
          <p>当前周起始：{dayjs(currentWeekTs).format('YYYY-MM-DD')}</p>
          <p>有课周数量：{weekTsList.length}</p>
          <p>上一有课周：{prevEventWeekTs ? dayjs(prevEventWeekTs).format('YYYY-MM-DD') : '无'}</p>
          <p>下一有课周：{nextEventWeekTs ? dayjs(nextEventWeekTs).format('YYYY-MM-DD') : '无'}</p>
        </div>
      </details>

      {!hasEventsThisWeek ? (
        <p className="muted">当前周没有课程，可使用“上一有课周 / 下一有课周”快速跳转。</p>
      ) : null}

      <div className="week-grid">
        {days.map((day) => {
          const dayEvents = sortByStart(events.filter((event) => isSameDate(event.start, day)))

          return (
            <div key={day.toISOString()} className="day-col">
              <h3>
                {day.format('ddd')} <span>{day.format('MM/DD')}</span>
              </h3>
              {dayEvents.length === 0 ? (
                <div className="empty small">无课程</div>
              ) : (
                dayEvents.map((event) => (
                  <article key={event.id} className="event-block" style={{ borderLeftColor: event.color || '#4F46E5' }}>
                    <div className="event-row">
                      <strong>{event.title}</strong>
                      <button type="button" className="edit-inline-btn" onClick={() => onEditEvent(event)}>
                        编辑
                      </button>
                    </div>
                    <span>{formatTimeRange(event)}</span>
                    {event.location ? <small>{event.location}</small> : null}
                  </article>
                ))
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
