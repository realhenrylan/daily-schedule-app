import type { VercelRequest, VercelResponse } from '@vercel/node'
import dayjs from 'dayjs'
import { pushMessage, ensureVapidConfigured } from '../_shared.js'
import { getReminders, getSubscriptions, prependDispatchLog, setReminders, withRedisGuard, type DispatchLog, type ReminderRecord } from '../_store.js'

function checkCronSecret(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    res.status(500).json({ error: 'Missing CRON_SECRET' })
    return false
  }

  const provided = req.headers.authorization?.replace('Bearer ', '')
  if (provided !== expected) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }

  return true
}

function nextRetryAtByCount(now: dayjs.Dayjs, retryCount: number): string {
  const steps = [1, 5, 15, 30, 60]
  const idx = Math.max(0, Math.min(steps.length - 1, retryCount - 1))
  return now.add(steps[idx], 'minute').toISOString()
}

function isDue(item: ReminderRecord, now: dayjs.Dayjs): boolean {
  if (item.sent || item.failed) return false
  if (item.nextRetryAt) {
    return dayjs(item.nextRetryAt).isBefore(now.add(1, 'minute'))
  }
  return dayjs(item.notifyAt).isBefore(now.add(1, 'minute'))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!checkCronSecret(req, res)) {
      return
    }

    if (!(await ensureVapidConfigured(res))) {
      return
    }

    await withRedisGuard(res, async () => {
      const reminders = await getReminders()
      const subscriptions = await getSubscriptions()
      const now = dayjs()

      const due = reminders.filter((item) => isDue(item, now))

      let sentCount = 0
      let retriedCount = 0
      let failedCount = 0
      const logs: DispatchLog[] = []

      for (const item of due) {
        const target = subscriptions[item.deviceId]
        if (!target?.subscription?.endpoint) {
          item.retryCount = (item.retryCount || 0) + 1
          item.lastError = 'No subscription for this device'
          if (item.retryCount >= 5) {
            item.failed = true
            failedCount += 1
            logs.push({
              id: crypto.randomUUID(),
              at: now.toISOString(),
              level: 'error',
              title: item.title,
              result: 'failed',
              detail: item.lastError,
              retryCount: item.retryCount,
            })
          } else {
            item.nextRetryAt = nextRetryAtByCount(now, item.retryCount)
            retriedCount += 1
            logs.push({
              id: crypto.randomUUID(),
              at: now.toISOString(),
              level: 'warn',
              title: item.title,
              result: 'retry_scheduled',
              detail: item.lastError,
              retryCount: item.retryCount,
            })
          }
          continue
        }

        try {
          await pushMessage(target.subscription as unknown as import('web-push').PushSubscription, {
            title: `课程提醒：${item.title}`,
            body: `将在 ${item.leadMinutes} 分钟后开始（${dayjs(item.start).format('HH:mm')}）`,
            url: '/',
          })
          item.sent = true
          item.nextRetryAt = undefined
          item.lastError = undefined
          sentCount += 1
          logs.push({
            id: crypto.randomUUID(),
            at: now.toISOString(),
            level: 'info',
            title: item.title,
            result: 'sent',
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Push send failed'
          item.retryCount = (item.retryCount || 0) + 1
          item.lastError = message
          if (item.retryCount >= 5) {
            item.failed = true
            failedCount += 1
            logs.push({
              id: crypto.randomUUID(),
              at: now.toISOString(),
              level: 'error',
              title: item.title,
              result: 'failed',
              detail: message,
              retryCount: item.retryCount,
            })
          } else {
            item.nextRetryAt = nextRetryAtByCount(now, item.retryCount)
            retriedCount += 1
            logs.push({
              id: crypto.randomUUID(),
              at: now.toISOString(),
              level: 'warn',
              title: item.title,
              result: 'retry_scheduled',
              detail: message,
              retryCount: item.retryCount,
            })
          }
        }
      }

      await setReminders(reminders)
      for (const log of logs) {
        await prependDispatchLog(log)
      }

      res.status(200).json({ ok: true, sent: sentCount, due: due.length, retried: retriedCount, failed: failedCount })
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown dispatch error'
    res.status(500).json({ error: `Dispatch crash: ${message}` })
  }
}
