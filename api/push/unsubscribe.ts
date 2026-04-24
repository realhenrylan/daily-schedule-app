import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readJson } from '../_shared'
import { getSubscriptions, setSubscriptions, withRedisGuard, requirePost } from '../_store'

type Body = {
  deviceId: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requirePost(req, res)) {
    return
  }

  await withRedisGuard(res, async () => {
    const body = readJson<Body>(req)
    if (!body?.deviceId) {
      res.status(400).json({ error: 'Invalid payload' })
      return
    }

    const map = await getSubscriptions()
    delete map[body.deviceId]
    await setSubscriptions(map)

    res.status(200).json({ ok: true })
  })
}
