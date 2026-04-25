import ICAL from 'ical.js'
import dayjs from 'dayjs'
import type { CourseEvent } from '../types'

// 课程颜色调色板，提供6种颜色用于区分不同课程
const DEFAULT_COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
// 重复事件最大展开次数，防止异常规则导致性能问题
const MAX_OCCURRENCES = 500

/**
 * 根据课程标题生成颜色哈希
 * 使用简单的字符串哈希算法确保同一标题总是生成相同颜色
 */
function colorFromTitle(title: string): string {
  let hash = 0
  for (let i = 0; i < title.length; i += 1) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  return DEFAULT_COLORS[Math.abs(hash) % DEFAULT_COLORS.length]
}

/**
 * 标准化日期为 ISO 格式字符串
 */
function normalizeDate(date: Date): string {
  return dayjs(date).toISOString()
}

/**
 * 生成事件唯一标识符
 * 优先使用 UID，备选使用标题+时间+随机UUID
 */
function eventId(uid: string | undefined, title: string, start: Date): string {
  return uid ? `${uid}-${dayjs(start).valueOf()}` : `${title}-${dayjs(start).valueOf()}-${crypto.randomUUID()}`
}

/**
 * 将解析后的数据转换为 CourseEvent 对象
 * 自动生成 ID、颜色和时间戳
 */
function toCourseEvent(input: {
  uid?: string
  title: string
  start: Date
  end: Date
  location?: string
  note?: string
  recurrenceRule?: string
}): CourseEvent {
  const now = dayjs().toISOString()
  return {
    id: eventId(input.uid, input.title, input.start),
    uid: input.uid,
    title: input.title,
    start: normalizeDate(input.start),
    end: normalizeDate(input.end),
    location: input.location,
    note: input.note,
    color: colorFromTitle(input.title),
    recurrenceRule: input.recurrenceRule,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 展开 ICS 文件中的多行内容
 * ICS 文件规定超过 75 字符的内容需要折叠
 */
function unfoldIcs(content: string): string {
  const normalized = content.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  const out: string[] = []

  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && out.length > 0) {
      out[out.length - 1] += line.slice(1)
    } else {
      out.push(line)
    }
  }

  return out.join('\r\n')
}

function parseIcsDate(value: string): Date | null {
  const raw = value.trim()

  const dateOnly = raw.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (dateOnly) {
    const [, y, m, d] = dateOnly
    return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0)
  }

  const utcDateTime = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/)
  if (utcDateTime) {
    const [, y, m, d, hh, mm, ss] = utcDateTime
    return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss)))
  }

  const localDateTime = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/)
  if (localDateTime) {
    const [, y, m, d, hh, mm, ss] = localDateTime
    return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss), 0)
  }

  const localDateTimeNoSec = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})$/)
  if (localDateTimeNoSec) {
    const [, y, m, d, hh, mm] = localDateTimeNoSec
    return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), 0, 0)
  }

  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function buildExdateMatchers(component: ICAL.Component): {
  exactTimestamps: Set<number>
  allDayKeys: Set<string>
} {
  const exactTimestamps = new Set<number>()
  const allDayKeys = new Set<string>()

  const exdateProps = component.getAllProperties('exdate')
  for (const prop of exdateProps) {
    const values = prop.getValues() as ICAL.Time[]
    for (const value of values) {
      const asDate = value.toJSDate()
      if (value.isDate) {
        allDayKeys.add(dayjs(asDate).format('YYYY-MM-DD'))
      } else {
        exactTimestamps.add(asDate.getTime())
      }
    }
  }

  return { exactTimestamps, allDayKeys }
}

function isExcluded(start: Date, matchers: { exactTimestamps: Set<number>; allDayKeys: Set<string> }): boolean {
  return (
    matchers.exactTimestamps.has(start.getTime()) ||
    matchers.allDayKeys.has(dayjs(start).format('YYYY-MM-DD'))
  )
}

function readRecurrenceRule(component: ICAL.Component): string | undefined {
  const rruleValue = component.getFirstPropertyValue('rrule')
  return rruleValue ? String(rruleValue) : undefined
}

function estimateRecurringUntil(start: Date, ruleText: string | undefined): dayjs.Dayjs {
  if (!ruleText) {
    return dayjs(start).add(180, 'day')
  }

  const untilMatch = ruleText.match(/UNTIL=([^;]+)/)
  if (untilMatch?.[1]) {
    const until = parseIcsDate(untilMatch[1])
    if (until) {
      return dayjs(until)
    }
  }

  const countMatch = ruleText.match(/COUNT=(\d+)/)
  if (countMatch?.[1]) {
    const count = Number.parseInt(countMatch[1], 10)
    const safeCount = Number.isFinite(count) ? Math.min(count, 200) : 60
    return dayjs(start).add(safeCount * 7, 'day')
  }

  return dayjs(start).add(365, 'day')
}

function parseByday(ruleText: string | undefined): string[] {
  if (!ruleText) return []
  const match = ruleText.match(/BYDAY=([^;]+)/)
  return match?.[1]?.split(',').map((d) => d.trim()) ?? []
}

function parseInterval(ruleText: string | undefined): number {
  if (!ruleText) return 1
  const match = ruleText.match(/INTERVAL=(\d+)/)
  const value = match?.[1] ? Number.parseInt(match[1], 10) : 1
  return Number.isFinite(value) && value > 0 ? value : 1
}

function parseCount(ruleText: string | undefined): number {
  if (!ruleText) return 16
  const match = ruleText.match(/COUNT=(\d+)/)
  const value = match?.[1] ? Number.parseInt(match[1], 10) : 16
  return Number.isFinite(value) ? value : 16
}

function parseFallback(content: string): CourseEvent[] {
  const text = unfoldIcs(content).replace(/\r\n/g, '\n')
  const lines = text.split('\n')
  const parsed: CourseEvent[] = []

  let current: Record<string, string[]> | null = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {}
      continue
    }

    if (line === 'END:VEVENT') {
      if (current) {
        const dtStartRaw = current.DTSTART?.[0]
        const dtEndRaw = current.DTEND?.[0]
        if (dtStartRaw && dtEndRaw) {
          const start = parseIcsDate(dtStartRaw)
          const end = parseIcsDate(dtEndRaw)

          if (start && end) {
            const title = current.SUMMARY?.[0]?.trim() || '未命名课程'
            const uid = current.UID?.[0]
            const location = current.LOCATION?.[0]?.trim()
            const note = current.DESCRIPTION?.[0]?.trim()
            const recurrenceRule = current.RRULE?.[0]

            const exdates = new Set<number>()
            for (const ex of current.EXDATE ?? []) {
              const parts = ex.split(',')
              for (const part of parts) {
                const d = parseIcsDate(part)
                if (d) exdates.add(d.getTime())
              }
            }

            parsed.push(toCourseEvent({ uid, title, start, end, location, note, recurrenceRule }))

            if (recurrenceRule?.includes('FREQ=WEEKLY')) {
              const dayCodeMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
              const durationMs = end.getTime() - start.getTime()
              const interval = parseInterval(recurrenceRule)
              const byDays = parseByday(recurrenceRule)
              const maxCount = Math.min(parseCount(recurrenceRule), 120)
              const until = estimateRecurringUntil(start, recurrenceRule)

              let generated = 1
              let cursor = dayjs(start).add(1, 'day')

              while (generated < maxCount && cursor.isBefore(until.add(1, 'day'))) {
                const code = dayCodeMap[cursor.day()]
                const weekDelta = Math.floor(
                  cursor.startOf('week').diff(dayjs(start).startOf('week'), 'week', true),
                )
                const weekMatched = weekDelta >= 0 && weekDelta % interval === 0
                const dayMatched = byDays.length === 0 ? cursor.day() === dayjs(start).day() : byDays.includes(code)

                if (weekMatched && dayMatched) {
                  const occurrenceStart = cursor
                    .hour(dayjs(start).hour())
                    .minute(dayjs(start).minute())
                    .second(dayjs(start).second())
                    .millisecond(0)
                    .toDate()

                  if (!exdates.has(occurrenceStart.getTime()) && occurrenceStart.getTime() !== start.getTime()) {
                    parsed.push(
                      toCourseEvent({
                        uid,
                        title,
                        start: occurrenceStart,
                        end: new Date(occurrenceStart.getTime() + durationMs),
                        location,
                        note,
                        recurrenceRule,
                      }),
                    )
                    generated += 1
                  }
                }

                cursor = cursor.add(1, 'day')
              }
            }
          }
        }
      }

      current = null
      continue
    }

    if (!current) {
      continue
    }

    const separator = line.indexOf(':')
    if (separator < 1) {
      continue
    }

    const key = line.slice(0, separator).split(';')[0].toUpperCase()
    const value = line.slice(separator + 1).trim()

    current[key] ??= []
    current[key].push(value)
  }

  return parsed.sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf())
}

function parseByIcalJs(content: string): CourseEvent[] {
  const prepared = unfoldIcs(content)
  const jcalData = ICAL.parse(prepared)
  const root = new ICAL.Component(jcalData)
  const vevents = root.getAllSubcomponents('vevent')
  const parsed: CourseEvent[] = []

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent)
    const startTime = event.startDate
    const endTime = event.endDate

    if (!startTime || !endTime) {
      continue
    }

    const title = event.summary?.trim() || '未命名课程'
    const uid = event.uid ?? undefined
    const location = event.location?.trim() || undefined
    const note = event.description?.trim() || undefined
    const recurrenceRule = readRecurrenceRule(vevent)
    const exdateMatchers = buildExdateMatchers(vevent)

    if (!event.isRecurring()) {
      const start = startTime.toJSDate()
      if (!isExcluded(start, exdateMatchers)) {
        parsed.push(
          toCourseEvent({
            uid,
            title,
            start,
            end: endTime.toJSDate(),
            location,
            note,
            recurrenceRule,
          }),
        )
      }
      continue
    }

    const iterator = event.iterator()
    const until = estimateRecurringUntil(startTime.toJSDate(), recurrenceRule)
    let occurrences = 0

    while (occurrences < MAX_OCCURRENCES) {
      const next = iterator.next()
      if (!next) {
        break
      }

      const details = event.getOccurrenceDetails(next)
      const occurrenceStart = details.startDate.toJSDate()
      const occurrenceEnd = details.endDate.toJSDate()

      if (dayjs(occurrenceStart).isAfter(until)) {
        break
      }

      if (isExcluded(occurrenceStart, exdateMatchers)) {
        continue
      }

      parsed.push(
        toCourseEvent({
          uid,
          title,
          start: occurrenceStart,
          end: occurrenceEnd,
          location,
          note,
          recurrenceRule,
        }),
      )

      occurrences += 1
    }
  }

  return parsed.sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf())
}

export function parseIcsToEvents(content: string): CourseEvent[] {
  const text = content.trim()
  if (!text.includes('BEGIN:VCALENDAR') || !text.includes('BEGIN:VEVENT')) {
    throw new Error('文件中未检测到 VCALENDAR/VEVENT')
  }

  try {
    const result = parseByIcalJs(text)
    if (result.length > 0) {
      return result
    }
  } catch {
    // fallback below
  }

  const fallback = parseFallback(text)
  if (fallback.length === 0) {
    throw new Error('未解析到任何课程事件')
  }
  return fallback
}
