import type { VercelRequest, VercelResponse } from '@vercel/node'
import { pushMessage, readJson, ensureVapidConfigured } from '../_shared.js'
import { getSubscriptions, withRedisGuard, requirePost } from '../_store.js'

type Body = {
  deviceId: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) {
    return
  }

  if (!ensureVapidConfigured(res)) {
    return
  }

  await withRedisGuard(res, async () => {
    const body = readJson<Body>(req)
    if (!body?.deviceId) {
      res.status(400).json({ error: 'Invalid payload' })
      return
    }

    const subscriptions = await getSubscriptions()
    const item = subscriptions[body.deviceId]
    if (!item) {
      res.status(404).json({ error: 'No subscription for this device' })
      return
    }

    await pushMessage(item.subscription as unknown as import('web-push').PushSubscription, {
      title: '课程日历',
      body: '这是一条测试通知，说明 Web Push 已可用。',
      url: '/',
    })

    res.status(200).json({ ok: true })
  })
}
