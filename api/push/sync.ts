import type { VercelRequest, VercelResponse } from '@vercel/node'
import dayjs from 'dayjs'
import { readJson } from '../_shared'
import { getReminders, setReminders, withRedisGuard, requirePost, type ReminderRecord } from '../_store'

type EventInput = {
  id: string
  title: string
  start: string
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
        const notifyAt = dayjs(event.start).subtract(leadMinutes, 'minute')
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
          leadMinutes,
          sent: false,
        } satisfies ReminderRecord
      })
      .filter((item): item is ReminderRecord => item !== null)

    await setReminders([...kept, ...next])
    res.status(200).json({ ok: true, count: next.length })
  })
}
