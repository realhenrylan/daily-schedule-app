import webpush from 'web-push'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const publicKey = process.env.VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey)
}

export function ensureVapidConfigured(res: VercelResponse): boolean {
  if (!publicKey || !privateKey) {
    res.status(500).json({ error: 'Missing VAPID configuration' })
    return false
  }
  return true
}

export function getPublicKey(): string {
  return publicKey || ''
}

export function readJson<T>(req: VercelRequest): T {
  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as T
  }
  return req.body as T
}

export async function pushMessage(subscription: webpush.PushSubscription, payload: unknown) {
  await webpush.sendNotification(subscription, JSON.stringify(payload), {
    TTL: 60,
    urgency: 'high',
  })
}
