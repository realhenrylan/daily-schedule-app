import type { VercelRequest, VercelResponse } from '@vercel/node'
import type webpushType from 'web-push'

const publicKey = process.env.VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

let vapidReady = false
let vapidInitError: string | null = null
let webpushModule: typeof webpushType | null = null

async function getWebPushModule(): Promise<typeof webpushType> {
  if (webpushModule) {
    return webpushModule
  }

  const loaded = (await import('web-push')) as unknown as {
    default?: typeof webpushType
  } & typeof webpushType

  const candidate = (loaded.default || loaded) as typeof webpushType

  if (typeof candidate.setVapidDetails !== 'function' || typeof candidate.sendNotification !== 'function') {
    throw new Error('web-push module shape is invalid')
  }

  webpushModule = candidate
  return webpushModule
}

async function initVapid(): Promise<boolean> {
  if (vapidReady) {
    return true
  }

  if (!publicKey || !privateKey) {
    vapidInitError = 'Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY'
    return false
  }

  try {
    const webpush = await getWebPushModule()
    webpush.setVapidDetails(subject, publicKey, privateKey)
    vapidReady = true
    vapidInitError = null
    return true
  } catch (error) {
    vapidInitError = error instanceof Error ? error.message : 'Unknown VAPID init error'
    return false
  }
}

export async function ensureVapidConfigured(res: VercelResponse): Promise<boolean> {
  if (!(await initVapid())) {
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

export async function pushMessage(subscription: webpushType.PushSubscription, payload: unknown) {
  const webpush = await getWebPushModule()
  await webpush.sendNotification(subscription, JSON.stringify(payload), {
    TTL: 60,
    urgency: 'high',
  })
}
