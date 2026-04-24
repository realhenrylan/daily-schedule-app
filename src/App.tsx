import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import './App.css'
import { CalendarView } from './components/CalendarView'
import { EventEditorModal } from './components/EventEditorModal'
import { HomeView } from './components/HomeView'
import { ImportView } from './components/ImportView'
import { ScheduleView } from './components/ScheduleView'
import { SettingsView } from './components/SettingsView'
import { TabNav } from './components/TabNav'
import { addImportRecord, clearEvents, clearImportRecords, getAllEvents, getImportRecords, replaceEvents, replaceImportRecords, saveEvents } from './lib/db'
import { exportBackupJson, importBackupJson } from './lib/backup'
import { sortByStart } from './lib/date'
import { disablePushForDevice, enablePushForDevice, getOrCreateDeviceId, getPushSubscribed, sendTestPush, syncDeviceReminders } from './lib/push'
import type { AppTab, CourseEvent, ImportRecord } from './types'

type ThemeMode = 'light' | 'dark'

type PendingDelete = {
  event: CourseEvent
}

type TransitionDirection = 'forward' | 'backward'

const TAB_ORDER: AppTab[] = ['home', 'schedule', 'calendar', 'import', 'settings']

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home')
  const [events, setEvents] = useState<CourseEvent[]>([])
  const [records, setRecords] = useState<ImportRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<CourseEvent | null>(null)
  const [searchText, setSearchText] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [transitionDirection, setTransitionDirection] = useState<TransitionDirection>('forward')
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushStatusText, setPushStatusText] = useState('推送未开启')
  const deleteTimerRef = useRef<number | null>(null)
  const eventsRef = useRef<CourseEvent[]>([])
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('schedule-theme')
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const previousTabRef = useRef<AppTab>(activeTab)

  useEffect(() => {
    async function load() {
      const [storedEvents, importRecords] = await Promise.all([getAllEvents(), getImportRecords()])
      setEvents(sortByStart(storedEvents))
      setRecords(importRecords)
      setIsLoading(false)
    }

    void load()
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('schedule-theme', theme)
  }, [theme])

  useEffect(() => {
    const prev = previousTabRef.current
    const prevIndex = TAB_ORDER.indexOf(prev)
    const nextIndex = TAB_ORDER.indexOf(activeTab)
    setTransitionDirection(nextIndex >= prevIndex ? 'forward' : 'backward')
    previousTabRef.current = activeTab
  }, [activeTab])

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current !== null) {
        window.clearTimeout(deleteTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    async function checkPush() {
      try {
        const subscribed = await getPushSubscribed()
        setPushEnabled(subscribed)
        setPushStatusText(subscribed ? '推送已开启，可接收课程提醒' : '推送未开启')
      } catch {
        setPushStatusText('当前设备不支持推送')
      }
    }

    void checkPush()
  }, [])

  const eventsByStartKey = useMemo(() => {
    return new Set(events.map((event) => `${event.uid || event.title}|${event.start}`))
  }, [events])

  const filteredEvents = useMemo(() => {
    const kw = searchText.trim().toLowerCase()
    return sortByStart(
      events.filter((event) => {
        const hitKeyword =
          kw.length === 0 ||
          event.title.toLowerCase().includes(kw) ||
          (event.location || '').toLowerCase().includes(kw) ||
          (event.note || '').toLowerCase().includes(kw)

        const hitDate = !filterDate || dayjs(event.start).isSame(dayjs(filterDate), 'day')
        return hitKeyword && hitDate
      }),
    )
  }, [events, searchText, filterDate])

  useEffect(() => {
    eventsRef.current = events
  }, [events])

  async function handleConfirmImport(incoming: CourseEvent[], sourceName: string): Promise<void> {
    const deduped = incoming.filter((event) => !eventsByStartKey.has(`${event.uid || event.title}|${event.start}`))

    if (deduped.length === 0) {
      return
    }

    const next = sortByStart([...events, ...deduped])
    await saveEvents(deduped)

    const record: ImportRecord = {
      id: crypto.randomUUID(),
      sourceName: sourceName || '未命名导入',
      importedAt: new Date().toISOString(),
      totalParsed: incoming.length,
      inserted: deduped.length,
      skippedAsDuplicate: incoming.length - deduped.length,
    }

    await addImportRecord(record)
    setEvents(next)
    setRecords((prev) => [...prev, record])
    setActiveTab('schedule')
  }

  async function handleClearAll() {
    await Promise.all([clearEvents(), clearImportRecords()])
    setEvents([])
    setRecords([])
  }

  function handleExportBackup() {
    exportBackupJson(events, records)
  }

  async function handleImportBackup(file: File) {
    const restored = await importBackupJson(file)
    await Promise.all([replaceEvents(restored.events), replaceImportRecords(restored.records)])
    setEvents(sortByStart(restored.events))
    setRecords(restored.records)
    setActiveTab('schedule')
  }

  async function handleSaveEditedEvent(updated: CourseEvent) {
    const nextEvents = sortByStart(events.map((item) => (item.id === updated.id ? updated : item)))
    await replaceEvents(nextEvents)
    setEvents(nextEvents)
  }

  async function handleDeleteEvent(eventId: string) {
    const removed = eventsRef.current.find((item) => item.id === eventId)
    if (!removed) {
      return
    }

    const nextEvents = sortByStart(eventsRef.current.filter((item) => item.id !== eventId))
    setEvents(nextEvents)

    setPendingDelete({ event: removed })

    if (deleteTimerRef.current !== null) {
      window.clearTimeout(deleteTimerRef.current)
    }

    deleteTimerRef.current = window.setTimeout(() => {
      void replaceEvents(nextEvents)
      setPendingDelete(null)
      deleteTimerRef.current = null
    }, 5000)
  }

  async function handleUndoDelete() {
    if (!pendingDelete) {
      return
    }

    if (deleteTimerRef.current !== null) {
      window.clearTimeout(deleteTimerRef.current)
      deleteTimerRef.current = null
    }

    const restored = sortByStart([...eventsRef.current, pendingDelete.event])
    setEvents(restored)
    await replaceEvents(restored)
    setPendingDelete(null)
  }

  async function handleEnablePush() {
    try {
      const deviceId = getOrCreateDeviceId()
      await enablePushForDevice(deviceId)
      await syncDeviceReminders(
        deviceId,
        eventsRef.current.map((event) => ({ id: event.id, title: event.title, start: event.start })),
        30,
      )
      setPushEnabled(true)
      setPushStatusText('推送已开启，默认课前 30 分钟提醒')
    } catch (error) {
      const message = error instanceof Error ? error.message : '开启推送失败'
      setPushStatusText(`开启失败：${message}`)
    }
  }

  async function handleDisablePush() {
    try {
      const deviceId = getOrCreateDeviceId()
      await disablePushForDevice(deviceId)
      setPushEnabled(false)
      setPushStatusText('推送已关闭')
    } catch {
      setPushStatusText('关闭推送失败')
    }
  }

  async function handleSyncPush() {
    try {
      const deviceId = getOrCreateDeviceId()
      await syncDeviceReminders(
        deviceId,
        eventsRef.current.map((event) => ({ id: event.id, title: event.title, start: event.start })),
        30,
      )
      setPushStatusText('已同步提醒计划')
    } catch {
      setPushStatusText('同步提醒失败')
    }
  }

  async function handleTestPush() {
    try {
      const deviceId = getOrCreateDeviceId()
      await sendTestPush(deviceId)
      setPushStatusText('测试通知已发送')
    } catch (error) {
      const message = error instanceof Error ? error.message : '测试通知发送失败'
      setPushStatusText(`测试通知发送失败：${message}`)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>课程日历</h1>
          <p>iPhone 可添加到主屏幕的课表 PWA</p>
        </div>
        <div className="topbar-controls">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            aria-label="切换深浅色主题"
          >
            {theme === 'dark' ? '切换浅色' : '切换深色'}
          </button>
          <div className="topbar-stats">
            <span>课程总数 {events.length}</span>
            <span>导入记录 {records.length}</span>
          </div>
        </div>
      </header>

      <TabNav activeTab={activeTab} onChange={setActiveTab} />

      <main className="content" data-transition-direction={transitionDirection}>
        <section className="panel filter-bar view-stage" aria-label="搜索与筛选">
          <label>
            搜索课程
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="按课程名/地点/备注筛选"
            />
          </label>
          <label>
            指定日期
            <input type="date" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} />
          </label>
          <button type="button" onClick={() => { setSearchText(''); setFilterDate('') }}>
            清空筛选
          </button>
          <small>
            当前显示 {filteredEvents.length} / {events.length} 条
          </small>
        </section>

        {isLoading ? <section className="panel view-stage">加载中...</section> : null}
        {!isLoading && activeTab === 'home' ? <div className="view-stage"><HomeView events={filteredEvents} /></div> : null}
        {!isLoading && activeTab === 'schedule' ? <div className="view-stage"><ScheduleView events={filteredEvents} onEditEvent={setEditingEvent} /></div> : null}
        {!isLoading && activeTab === 'calendar' ? <div className="view-stage"><CalendarView events={filteredEvents} onEditEvent={setEditingEvent} /></div> : null}
        {!isLoading && activeTab === 'import' ? (
          <div className="view-stage"><ImportView existingEvents={events} onConfirmImport={handleConfirmImport} /></div>
        ) : null}
        {!isLoading && activeTab === 'settings' ? (
          <div className="view-stage">
            <SettingsView
              records={records}
              pushEnabled={pushEnabled}
              pushStatusText={pushStatusText}
              onEnablePush={handleEnablePush}
              onDisablePush={handleDisablePush}
              onSyncPush={handleSyncPush}
              onTestPush={handleTestPush}
              onClearAll={handleClearAll}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
            />
          </div>
        ) : null}
      </main>

      {pendingDelete ? (
        <div className="undo-toast" role="status" aria-live="polite">
          <span>已删除「{pendingDelete.event.title}」</span>
          <button type="button" onClick={() => void handleUndoDelete()}>
            撤销
          </button>
        </div>
      ) : null}

      {editingEvent ? (
        <EventEditorModal
          key={editingEvent.id}
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={handleSaveEditedEvent}
          onDelete={handleDeleteEvent}
        />
      ) : null}
    </div>
  )
}

export default App
