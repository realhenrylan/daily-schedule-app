import { openDB } from 'idb'
import type { CourseEvent, ImportRecord } from '../types'

// IndexedDB 数据库配置
const DB_NAME = 'schedule-pwa-db'
const DB_VERSION = 1
const EVENTS_STORE = 'events'
const IMPORTS_STORE = 'imports'

/**
 * 初始化 IndexedDB 数据库
 * 创建事件存储和导入记录存储，并建立索引
 */
const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // 创建事件存储，以 id 为主键
    const eventStore = db.createObjectStore(EVENTS_STORE, { keyPath: 'id' })
    eventStore.createIndex('uid', 'uid', { unique: false })
    eventStore.createIndex('start', 'start', { unique: false })

    // 创建导入记录存储
    const importStore = db.createObjectStore(IMPORTS_STORE, { keyPath: 'id' })
    importStore.createIndex('importedAt', 'importedAt', { unique: false })
  },
})

/**
 * 获取所有课程事件
 */
export async function getAllEvents(): Promise<CourseEvent[]> {
  const db = await dbPromise
  return db.getAll(EVENTS_STORE)
}

/**
 * 保存新的课程事件（增量保存，不会删除已有事件）
 */
export async function saveEvents(events: CourseEvent[]): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(EVENTS_STORE, 'readwrite')
  for (const event of events) {
    await tx.store.put(event)
  }
  await tx.done
}

/**
 * 替换所有课程事件（清空后重新保存）
 */
export async function replaceEvents(events: CourseEvent[]): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(EVENTS_STORE, 'readwrite')
  await tx.store.clear()
  for (const event of events) {
    await tx.store.put(event)
  }
  await tx.done
}

/**
 * 清空所有课程事件
 */
export async function clearEvents(): Promise<void> {
  const db = await dbPromise
  await db.clear(EVENTS_STORE)
}

/**
 * 清空所有导入记录
 */
export async function clearImportRecords(): Promise<void> {
  const db = await dbPromise
  await db.clear(IMPORTS_STORE)
}

/**
 * 替换所有导入记录
 */
export async function replaceImportRecords(records: ImportRecord[]): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(IMPORTS_STORE, 'readwrite')
  await tx.store.clear()
  for (const record of records) {
    await tx.store.put(record)
  }
  await tx.done
}

/**
 * 获取所有导入记录
 */
export async function getImportRecords(): Promise<ImportRecord[]> {
  const db = await dbPromise
  return db.getAll(IMPORTS_STORE)
}

/**
 * 添加单条导入记录
 */
export async function addImportRecord(record: ImportRecord): Promise<void> {
  const db = await dbPromise
  await db.put(IMPORTS_STORE, record)
}
