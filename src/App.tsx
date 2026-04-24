import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import './App.css'
import { CalendarView } from './components/CalendarView'
import { EventEditorModal } from './components/EventEditorModal'
import { HomeView } from './components/HomeView'
import { ImportView } from './components/ImportView'
import { OpsView } from './components/OpsView'
import { ScheduleView } from './components/ScheduleView'
import { SettingsView } from './components/SettingsView'
import { TabNav } from './components/TabNav'
import { addImportRecord, clearEvents, clearImportRecords, getAllEvents, getImportRecords, replaceEvents, replaceImportRecords, saveEvents } from './lib/db'
import { exportBackupJson, importBackupJson } from './lib/backup'
import { sortByStart } from './lib/date'
import { disablePushForDevice, enablePushForDevice, getDispatchLogs, getOrCreateDeviceId, getPushSubscribed, sendTestPush, syncDeviceReminders, type PushDispatchLog } from './lib/push'
import type { AppTab, CourseEvent, ImportRecord } from './types'

type ThemeMode = 'light' | 'dark'

type PendingDelete = {
  event: CourseEvent
}

type TransitionDirection = 'forward' | 'backward'

const TAB_ORDER: AppTab[] = ['home', 'schedule', 'calendar', 'import', 'settings', 'ops']

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
  const [pushLogs, setPushLogs] = useState<PushDispatchLog[]>([])
  const [pushLogsLoading, setPushLogsLoading] = useState(false)
  const [reminderMinutes, setReminderMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('schedule-reminder-minutes')
    return saved ? Number.parseInt(saved, 10) : 30
  })

  const [semesters, setSemesters] = useState<{name: string; startDate: string; endDate: string}[]>([])

  const showOps = useMemo(() => {
    if (typeof window === 'undefined') return false
    const fromQuery = new URLSearchParams(window.location.search).get('ops') === '1'
    const fromStorage = localStorage.getItem('schedule-show-ops') === '1'
    return fromQuery || fromStorage
  }, [])
  const navTabs = useMemo(
    () =>
      showOps
        ? [
            { id: 'home' as AppTab, label: '首页' },
            { id: 'schedule' as AppTab, label: '课表' },
            { id: 'calendar' as AppTab, label: '日历' },
            { id: 'import' as AppTab, label: '导入' },
            { id: 'settings' as AppTab, label: '设置' },
            { id: 'ops' as AppTab, label: '运维' },
          ]
        : [
            { id: 'home' as AppTab, label: '首页' },
            { id: 'schedule' as AppTab, label: '课表' },
            { id: 'calendar' as AppTab, label: '日历' },
            { id: 'import' as AppTab, label: '导入' },
            { id: 'settings' as AppTab, label: '设置' },
          ],
    [showOps],
  )
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
    localStorage.setItem('schedule-reminder-minutes', String(reminderMinutes))
  }, [reminderMinutes])

  const currentSemester = useMemo(() => {
    const now = dayjs()
    for (const sem of semesters) {
      const start = dayjs(sem.startDate)
      const end = dayjs(sem.endDate)
      if (now.isAfter(start.subtract(1, 'day')) {
        if (now.isBefore(end.add(1, 'day')) {
          return sem
        }
      }
    }
    return null
  }, [semesters])

  const currentSemesterInfo = useMemo(() => {
    if (!currentSemester) {
      return { count: 0, uniqueCourses: 0 }
    }
    const semesterCourses = events.filter(event => {
      const sem = semesters.find(s => {
        const start = dayjs(s.startDate)
        const end = dayjs(s.endDate)
        const eventStart = dayjs(event.start)
        return eventStart.isAfter(start.subtract(1, 'day')) && eventStart.isBefore(end.add(1, 'day'))
      })
      return !!sem
    })
    const uniqueTitles = new Set(semesterCourses.map(e => e.title))
    return {
      count: semesterCourses.length,
      uniqueCourses: uniqueTitles.size,
    }
  }, [events, semesters, currentSemester])

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

  async function handleRefreshPushLogs() {
    setPushLogsLoading(true)
    try {
      const logs = await getDispatchLogs(30)
      setPushLogs(logs)
    } catch {
      // keep existing logs on failure
    } finally {
      setPushLogsLoading(false)
    }
  }

  function handleTabChange(tab: AppTab) {
    if (tab === 'ops' && !showOps) {
      return
    }
    setActiveTab(tab)
    if (tab === 'settings' || tab === 'ops') {
      void handleRefreshPushLogs()
    }
  }

  const eventsByStartKey = useMemo(() => {
    return new Set(events.map((event) => `${event.uid || event.title}|${event.start}`))
  }, [events])

  const conflictEvents = useMemo(() => {
    const conflicts: CourseEvent[][] = []
    const sorted = sortByStart(events)
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i]
        const b = sorted[j]
        const aStart = dayjs(a.start)
        const aEnd = dayjs(a.end)
        const bStart = dayjs(b.start)
        const bEnd = dayjs(b.end)
        if (aStart.isBefore(bEnd) && bStart.isBefore(aEnd)) {
          const existing = conflicts.find(
            (group) => group.some((e) => e.id === a.id || e.id === b.id),
          )
          if (existing) {
            if (!existing.some((e) => e.id === a.id)) existing.push(a)
            if (!existing.some((e) => e.id === b.id)) existing.push(b)
          } else {
            conflicts.push([a, b])
          }
        }
      }
    }
    return conflicts
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

    const semesterName = extractSemesterFromFileName(sourceName)

    let semesterStart: string | undefined
    let semesterEnd: string | undefined
    if (semesterName) {
      const allCourseDates = [...events, ...deduped]
        .filter(e => extractSemesterFromFileName(sourceName) === semesterName)
        .map(e => dayjs(e.start))
        .filter(d => d.isValid())

      if (allCourseDates.length > 0) {
        semesterStart = allCourseDates.reduce((min, d) => d.isBefore(min) ? d : min).startOf('day').toISOString()
        semesterEnd = allCourseDates.reduce((max, d) => d.isAfter(max) ? d : max).endOf('day').toISOString()
      } else {
        const newDates = deduped.map(e => dayjs(e.start)).filter(d => d.isValid())
        if (newDates.length > 0) {
          semesterStart = newDates.reduce((min, d) => d.isBefore(min) ? d : min).startOf('day').toISOString()
          semesterEnd = newDates.reduce((max, d) => d.isAfter(max) ? d : max).endOf('day').add(4, 'month').toISOString()
        }
      }

      const existingSemester = semesters.find(s => s.name === semesterName)
      if (!existingSemester && semesterName && semesterStart && semesterEnd) {
        setSemesters(prev => [...prev, { name: semesterName, startDate: semesterStart, endDate: semesterEnd }])
      }
    }

    const eventsWithSemester = deduped.map(event => ({
      ...event,
      semesterId: semesterName || undefined,
    }))

    const next = sortByStart([...events, ...eventsWithSemester])
    await saveEvents(eventsWithSemester)

    const record: ImportRecord = {
      id: crypto.randomUUID(),
      sourceName: sourceName || '未命名导入',
      importedAt: new Date().toISOString(),
      totalParsed: incoming.length,
      inserted: eventsWithSemester.length,
      skippedAsDuplicate: incoming.length - eventsWithSemester.length,
      semesterId: semesterName || undefined,
    }

    await addImportRecord(record)
    setEvents(next)
    setRecords((prev) => [...prev, record])
    setActiveTab('schedule')
  }

function extractSemesterFromFileName(fileName: string): string | null {
    const lowerFileName = fileName.toLowerCase()

    const yearMatch = lowerFileName.match(/(20\d{2})/g)
    let year = ''
    if (yearMatch && yearMatch.length > 0) {
      year = yearMatch[0]
    }

    let season = ''
    if (lowerFileName.includes('summer') || lowerFileName.includes('夏季')) {
      season = '夏'
    } else if (lowerFileName.includes('spring') || lowerFileName.includes('春季')) {
      season = '春'
    } else if (lowerFileName.includes('fall') || lowerFileName.includes('autumn') || lowerFileName.includes('秋季')) {
      season = '秋'
    } else if (lowerFileName.includes('winter') || lowerFileName.includes('冬季')) {
      season = '冬'
    }

    if (year || season) {
      return `${year}${season}`
    }

    const chinesePatterns = [
      /(\d{4}[年-]?\d{1,2}[学期季]?)/,
      /(\d{4}-\d{4}[学年]?)/,
      /(秋|春|夏|冬)/,
    ]
    for (const pattern of chinesePatterns) {
      const match = fileName.match(pattern)
      if (match) {
        return match[0]
      }
    }

    return null
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

  async function handleToggleFavorite(eventId: string) {
    const event = events.find((e) => e.id === eventId)
    if (!event) return
    const updated = { ...event, isFavorite: !event.isFavorite, updatedAt: new Date().toISOString() }
    await replaceEvents(events.map((e) => (e.id === eventId ? updated : e)))
    setEvents((prev) => sortByStart(prev.map((e) => (e.id === eventId ? updated : e))))
  }

  function handleQuickAdd() {
    const now = dayjs()
    const newEvent: CourseEvent = {
      id: crypto.randomUUID(),
      title: '',
      start: now.startOf('hour').add(1, 'hour').toISOString(),
      end: now.startOf('hour').add(2, 'hour').toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    setEditingEvent(newEvent)
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
      const eventsWithReminder = eventsRef.current.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        reminderMinutes: event.reminderMinutes ?? reminderMinutes,
      }))
      await syncDeviceReminders(deviceId, eventsWithReminder, reminderMinutes)
      setPushEnabled(true)
      setPushStatusText('推送已开启')
      await handleRefreshPushLogs()
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
      const eventsWithReminder = eventsRef.current.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        reminderMinutes: event.reminderMinutes ?? reminderMinutes,
      }))
      await syncDeviceReminders(deviceId, eventsWithReminder, reminderMinutes)
      setPushStatusText('已同步提醒计划')
      await handleRefreshPushLogs()
    } catch {
      setPushStatusText('同步提醒失败')
    }
  }

  async function handleTestPush() {
    try {
      const deviceId = getOrCreateDeviceId()
      await sendTestPush(deviceId)
      setPushStatusText('测试通知已发送')
      await handleRefreshPushLogs()
    } catch (error) {
      const message = error instanceof Error ? error.message : '测试通知发送失败'
      setPushStatusText(`测试通知发送失败：${message}`)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <h1>课程日历</h1>
          <p>
            {currentSemester ? (
              <>{currentSemester.name} · {currentSemesterInfo.count}节课 · {currentSemesterInfo.uniqueCourses}门课</>
            ) : (
              <>无学期 · 0节课</>
            )}
          </p>
        </div>
        <div className="topbar-right">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            aria-label="切换深浅色主题"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <TabNav activeTab={activeTab} onChange={handleTabChange} tabs={navTabs} />

      <main className="content" data-transition-direction={transitionDirection}>
        <section className="filter-bar view-stage" aria-label="搜索与筛选">
          <div className="filter-row">
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="搜索课程..."
            />
            <button type="button" onClick={() => { setSearchText(''); setFilterDate('') }}>
              清除
            </button>
          </div>
          <div className="filter-row">
            <input
              type="date"
              value={filterDate}
              onChange={(event) => setFilterDate(event.target.value)}
              style={{ flex: 'none', width: '160px' }}
            />
            <small style={{ lineHeight: '40px' }}>
              {filteredEvents.length} 条
            </small>
          </div>
        </section>

        {isLoading ? <section className="panel view-stage">加载中...</section> : null}
        {!isLoading && activeTab === 'home' ? <div className="view-stage"><HomeView events={filteredEvents} conflictEvents={conflictEvents} onToggleFavorite={handleToggleFavorite} onAddEvent={handleQuickAdd} /></div> : null}
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
              reminderMinutes={reminderMinutes}
              onReminderMinutesChange={setReminderMinutes}
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
        {!isLoading && activeTab === 'ops' && showOps ? (
          <div className="view-stage">
            <OpsView logs={pushLogs} loading={pushLogsLoading} onRefresh={handleRefreshPushLogs} />
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
          defaultReminderMinutes={reminderMinutes}
          onClose={() => setEditingEvent(null)}
          onSave={handleSaveEditedEvent}
          onDelete={handleDeleteEvent}
        />
      ) : null}
    </div>
  )
}

export default App
