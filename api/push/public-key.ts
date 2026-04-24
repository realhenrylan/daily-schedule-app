import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureVapidConfigured, getPublicKey } from '../_shared'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  if (!ensureVapidConfigured(res)) {
    return
  }

  res.status(200).json({ publicKey: getPublicKey() })
}
