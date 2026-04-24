const TAB_ICONS: Record<string, string> = {
  home: '🏠',
  schedule: '📅',
  calendar: '📆',
  import: '📥',
  settings: '⚙️',
  ops: '🔧',
}

const defaultTabs: { id: 'home' | 'schedule' | 'calendar' | 'import' | 'settings'; label: string }[] = [
  { id: 'home', label: '首页' },
  { id: 'schedule', label: '课表' },
  { id: 'calendar', label: '日历' },
  { id: 'import', label: '导入' },
  { id: 'settings', label: '设置' },
]

interface TabNavProps {
  activeTab: string
  onChange: (tab: string) => void
  tabs?: { id: string; label: string }[]
}

export function TabNav({ activeTab, onChange, tabs = defaultTabs }: TabNavProps) {
  return (
    <nav className="tab-nav" aria-label="主导航">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-btn ${tab.id === activeTab ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="icon">{TAB_ICONS[tab.id] || '📌'}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
