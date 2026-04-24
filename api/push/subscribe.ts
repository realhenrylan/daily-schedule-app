import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readJson } from '../_shared.js'
import { getSubscriptions, setSubscriptions, withRedisGuard, requirePost, type SubscriptionRecord } from '../_store.js'

type Body = {
  deviceId: string
  subscription: PushSubscriptionJSON
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) {
    return
  }

  await withRedisGuard(res, async () => {
    const body = readJson<Body>(req)
    if (!body?.deviceId || !body?.subscription?.endpoint) {
      res.status(400).json({ error: 'Invalid payload' })
      return
    }

    const map = await getSubscriptions()
    const record: SubscriptionRecord = {
      deviceId: body.deviceId,
      subscription: body.subscription,
      updatedAt: new Date().toISOString(),
    }
    map[body.deviceId] = record
    await setSubscriptions(map)

    res.status(200).json({ ok: true })
  })
}
