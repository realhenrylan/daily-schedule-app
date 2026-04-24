import type { VercelRequest, VercelResponse } from '@vercel/node'
import dayjs from 'dayjs'
import { pushMessage, ensureVapidConfigured } from '../_shared'
import { getReminders, getSubscriptions, setReminders, withRedisGuard } from '../_store'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (!ensureVapidConfigured(res)) {
    return
  }

  await withRedisGuard(res, async () => {
    const reminders = await getReminders()
    const subscriptions = await getSubscriptions()
    const now = dayjs()

    const due = reminders.filter((item) => !item.sent && dayjs(item.notifyAt).isBefore(now.add(1, 'minute')))

    let sentCount = 0
    for (const item of due) {
      const target = subscriptions[item.deviceId]
      if (!target?.subscription?.endpoint) {
        continue
      }

      try {
        await pushMessage(target.subscription as unknown as import('web-push').PushSubscription, {
          title: `课程提醒：${item.title}`,
          body: `将在 ${item.leadMinutes} 分钟后开始（${dayjs(item.start).format('HH:mm')}）`,
          url: '/',
        })
        item.sent = true
        sentCount += 1
      } catch {
        // ignore single send failure
      }
    }

    await setReminders(reminders)
    res.status(200).json({ ok: true, sent: sentCount, due: due.length })
  })
}
