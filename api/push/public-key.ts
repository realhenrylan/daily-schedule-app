import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureVapidConfigured, getPublicKey } from '../_shared.js'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (!(await ensureVapidConfigured(res))) {
    return
  }

  res.status(200).json({ publicKey: getPublicKey() })
}
