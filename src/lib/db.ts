import { openDB } from 'idb'
import type { CourseEvent, ImportRecord } from '../types'

const DB_NAME = 'schedule-pwa-db'
const DB_VERSION = 1
const EVENTS_STORE = 'events'
const IMPORTS_STORE = 'imports'

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    const eventStore = db.createObjectStore(EVENTS_STORE, { keyPath: 'id' })
    eventStore.createIndex('uid', 'uid', { unique: false })
    eventStore.createIndex('start', 'start', { unique: false })

    const importStore = db.createObjectStore(IMPORTS_STORE, { keyPath: 'id' })
    importStore.createIndex('importedAt', 'importedAt', { unique: false })
  },
})

export async function getAllEvents(): Promise<CourseEvent[]> {
  const db = await dbPromise
  return db.getAll(EVENTS_STORE)
}

export async function saveEvents(events: CourseEvent[]): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(EVENTS_STORE, 'readwrite')
  for (const event of events) {
    await tx.store.put(event)
  }
  await tx.done
}

export async function replaceEvents(events: CourseEvent[]): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(EVENTS_STORE, 'readwrite')
  await tx.store.clear()
  for (const event of events) {
    await tx.store.put(event)
  }
  await tx.done
}

export async function clearEvents(): Promise<void> {
  const db = await dbPromise
  await db.clear(EVENTS_STORE)
}

export async function clearImportRecords(): Promise<void> {
  const db = await dbPromise
  await db.clear(IMPORTS_STORE)
}

export async function replaceImportRecords(records: ImportRecord[]): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(IMPORTS_STORE, 'readwrite')
  await tx.store.clear()
  for (const record of records) {
    await tx.store.put(record)
  }
  await tx.done
}

export async function getImportRecords(): Promise<ImportRecord[]> {
  const db = await dbPromise
  return db.getAll(IMPORTS_STORE)
}

export async function addImportRecord(record: ImportRecord): Promise<void> {
  const db = await dbPromise
  await db.put(IMPORTS_STORE, record)
}
