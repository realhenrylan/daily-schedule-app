import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDispatchLogs, withRedisGuard } from '../_store.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  await withRedisGuard(res, async () => {
    const rawLimit = Number(req.query.limit)
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(100, rawLimit)) : 30
    const logs = await getDispatchLogs(limit)
    res.status(200).json({ ok: true, logs })
  })
}
