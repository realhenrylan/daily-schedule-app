import type { VercelRequest, VercelResponse } from '@vercel/node'

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

function ensureRedis(res: VercelResponse): boolean {
  if (!REDIS_URL || !REDIS_TOKEN) {
    res.status(500).json({ error: 'Missing Upstash Redis configuration' })
    return false
  }
  return true
}

async function redisRequest<T>(command: string[]): Promise<T> {
  const response = await fetch(`${REDIS_URL}/${command.join('/')}`, {
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Redis request failed: ${response.status} ${text}`)
  }

  const data = (await response.json()) as { result: T }
  return data.result
}

export type SubscriptionRecord = {
  deviceId: string
  subscription: PushSubscriptionJSON
  updatedAt: string
}

export type ReminderRecord = {
  id: string
  deviceId: string
  eventId: string
  title: string
  start: string
  notifyAt: string
  leadMinutes: number
  sent: boolean
}

const SUBS_KEY = 'schedule:push:subscriptions'
const REMINDERS_KEY = 'schedule:push:reminders'

export async function getSubscriptions(): Promise<Record<string, SubscriptionRecord>> {
  const raw = await redisRequest<string | null>(['get', SUBS_KEY])
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, SubscriptionRecord>
  } catch {
    return {}
  }
}

export async function setSubscriptions(data: Record<string, SubscriptionRecord>): Promise<void> {
  await redisRequest(['set', SUBS_KEY, JSON.stringify(data)])
}

export async function getReminders(): Promise<ReminderRecord[]> {
  const raw = await redisRequest<string | null>(['get', REMINDERS_KEY])
  if (!raw) return []
  try {
    return JSON.parse(raw) as ReminderRecord[]
  } catch {
    return []
  }
}

export async function setReminders(data: ReminderRecord[]): Promise<void> {
  await redisRequest(['set', REMINDERS_KEY, JSON.stringify(data)])
}

export async function withRedisGuard(res: VercelResponse, fn: () => Promise<void>) {
  if (!ensureRedis(res)) {
    return
  }

  try {
    await fn()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
}

export function requirePost(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Method Not Allowed' })
    return false
  }
  return true
}
