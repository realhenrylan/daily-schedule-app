import type { VercelRequest, VercelResponse } from '@vercel/node'
import dayjs from 'dayjs'
import { readJson } from '../_shared.js'
import { getReminders, setReminders, withRedisGuard, requirePost, type ReminderRecord } from '../_store.js'

type EventInput = {
  id: string
  title: string
  start: string
  /** 单课级别的提醒提前分钟数，优先级高于全局 leadMinutes */
  reminderMinutes?: number
}

type Body = {
  deviceId: string
  events: EventInput[]
  leadMinutes: number
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) {
    return
  }

  await withRedisGuard(res, async () => {
    const body = readJson<Body>(req)
    const leadMinutes = Number.isFinite(body?.leadMinutes) ? Math.max(1, Math.min(180, body.leadMinutes)) : 30

    if (!body?.deviceId || !Array.isArray(body.events)) {
      res.status(400).json({ error: 'Invalid payload' })
      return
    }

    const existing = await getReminders()
    const kept = existing.filter((item) => item.deviceId !== body.deviceId || item.sent)

    const now = dayjs()
    const next: ReminderRecord[] = body.events
      .map((event) => {
        // 单课级别 reminderMinutes 优先，无则使用全局 leadMinutes
        const effectiveLead = (event.reminderMinutes != null && Number.isFinite(event.reminderMinutes))
          ? Math.max(1, Math.min(180, event.reminderMinutes))
          : leadMinutes
        const notifyAt = dayjs(event.start).subtract(effectiveLead, 'minute')
        if (!notifyAt.isValid() || notifyAt.isBefore(now)) {
          return null
        }

        return {
          id: `${body.deviceId}:${event.id}:${notifyAt.toISOString()}`,
          deviceId: body.deviceId,
          eventId: event.id,
          title: event.title,
          start: event.start,
          notifyAt: notifyAt.toISOString(),
          leadMinutes: effectiveLead,
          sent: false,
        } satisfies ReminderRecord
      })
      .filter((item): item is ReminderRecord => item !== null)

    await setReminders([...kept, ...next])
    res.status(200).json({ ok: true, count: next.length })
  })
}
