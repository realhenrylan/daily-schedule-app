const VAPID_PUBLIC_KEY_ENDPOINT = '/api/push/public-key'
const SUBSCRIBE_ENDPOINT = '/api/push/subscribe'
const UNSUBSCRIBE_ENDPOINT = '/api/push/unsubscribe'
const SYNC_ENDPOINT = '/api/push/sync'
const TEST_ENDPOINT = '/api/push/test'
const DEVICE_ID_STORAGE_KEY = 'schedule-device-id'

export interface ReminderEventInput {
  id: string
  title: string
  start: string
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

async function ensureRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('当前浏览器不支持 Service Worker')
  }
  return navigator.serviceWorker.ready
}

async function ensurePermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('当前浏览器不支持通知')
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  return Notification.requestPermission()
}

async function getVapidPublicKey(): Promise<string> {
  const res = await fetch(VAPID_PUBLIC_KEY_ENDPOINT)
  if (!res.ok) {
    throw new Error('无法获取推送公钥，请检查服务端配置')
  }
  const data = (await res.json()) as { publicKey: string }
  if (!data.publicKey) {
    throw new Error('服务端未配置 VAPID 公钥')
  }
  return data.publicKey
}

export async function enablePushForDevice(deviceId: string): Promise<void> {
  const permission = await ensurePermission()
  if (permission !== 'granted') {
    throw new Error('通知权限未授予')
  }

  const registration = await ensureRegistration()
  const publicKey = await getVapidPublicKey()

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const res = await fetch(SUBSCRIBE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, subscription }),
  })

  if (!res.ok) {
    throw new Error('订阅推送失败')
  }
}

export async function disablePushForDevice(deviceId: string): Promise<void> {
  const registration = await ensureRegistration()
  const subscription = await registration.pushManager.getSubscription()
  if (subscription) {
    await subscription.unsubscribe()
  }

  await fetch(UNSUBSCRIBE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId }),
  })
}

export async function syncDeviceReminders(deviceId: string, events: ReminderEventInput[], leadMinutes: number): Promise<void> {
  const res = await fetch(SYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, events, leadMinutes }),
  })

  if (!res.ok) {
    throw new Error('同步提醒失败')
  }
}

export async function sendTestPush(deviceId: string): Promise<void> {
  const res = await fetch(TEST_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId }),
  })
  if (!res.ok) {
    throw new Error('测试推送发送失败')
  }
}

export async function getPushSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  return Boolean(subscription)
}

export function getOrCreateDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY)
  if (existing) {
    return existing
  }
  const created = crypto.randomUUID()
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, created)
  return created
}
