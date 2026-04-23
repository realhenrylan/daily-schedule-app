import { useEffect, useMemo, useState } from 'react'
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
import type { AppTab, CourseEvent, ImportRecord } from './types'

type ThemeMode = 'light' | 'dark'

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home')
  const [events, setEvents] = useState<CourseEvent[]>([])
  const [records, setRecords] = useState<ImportRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<CourseEvent | null>(null)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('schedule-theme')
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

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

  const eventsByStartKey = useMemo(() => {
    return new Set(events.map((event) => `${event.uid || event.title}|${event.start}`))
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

      <main className="content">
        {isLoading ? <section className="panel view-stage">加载中...</section> : null}
        {!isLoading && activeTab === 'home' ? <div className="view-stage"><HomeView events={events} /></div> : null}
        {!isLoading && activeTab === 'schedule' ? <div className="view-stage"><ScheduleView events={events} onEditEvent={setEditingEvent} /></div> : null}
        {!isLoading && activeTab === 'calendar' ? <div className="view-stage"><CalendarView events={events} onEditEvent={setEditingEvent} /></div> : null}
        {!isLoading && activeTab === 'import' ? (
          <div className="view-stage"><ImportView existingEvents={events} onConfirmImport={handleConfirmImport} /></div>
        ) : null}
        {!isLoading && activeTab === 'settings' ? (
          <div className="view-stage">
            <SettingsView
              records={records}
              onClearAll={handleClearAll}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
            />
          </div>
        ) : null}
      </main>

      {editingEvent ? (
        <EventEditorModal
          key={editingEvent.id}
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={handleSaveEditedEvent}
        />
      ) : null}
    </div>
  )
}

export default App
