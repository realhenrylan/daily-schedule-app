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

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home')
  const [events, setEvents] = useState<CourseEvent[]>([])
  const [records, setRecords] = useState<ImportRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<CourseEvent | null>(null)

  useEffect(() => {
    async function load() {
      const [storedEvents, importRecords] = await Promise.all([getAllEvents(), getImportRecords()])
      setEvents(sortByStart(storedEvents))
      setRecords(importRecords)
      setIsLoading(false)
    }

    void load()
  }, [])

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
      </header>

      <TabNav activeTab={activeTab} onChange={setActiveTab} />

      <main className="content">
        {isLoading ? <section className="panel">加载中...</section> : null}
        {!isLoading && activeTab === 'home' ? <HomeView events={events} /> : null}
        {!isLoading && activeTab === 'schedule' ? <ScheduleView events={events} onEditEvent={setEditingEvent} /> : null}
        {!isLoading && activeTab === 'calendar' ? <CalendarView events={events} onEditEvent={setEditingEvent} /> : null}
        {!isLoading && activeTab === 'import' ? (
          <ImportView existingEvents={events} onConfirmImport={handleConfirmImport} />
        ) : null}
        {!isLoading && activeTab === 'settings' ? (
          <SettingsView
            records={records}
            onClearAll={handleClearAll}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
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
