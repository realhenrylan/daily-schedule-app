import * as webpush from 'web-push'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const publicKey = process.env.VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

let vapidReady = false
let vapidInitError: string | null = null

function initVapid(): boolean {
  if (vapidReady) {
    return true
  }

  if (!publicKey || !privateKey) {
    vapidInitError = 'Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY'
    return false
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey)
    vapidReady = true
    vapidInitError = null
    return true
  } catch (error) {
    vapidInitError = error instanceof Error ? error.message : 'Unknown VAPID init error'
    return false
  }
}

export function ensureVapidConfigured(res: VercelResponse): boolean {
  if (!initVapid()) {
    res.status(500).json({ error: `Invalid VAPID configuration: ${vapidInitError}` })
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
