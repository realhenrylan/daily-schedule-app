import type { AppTab } from '../types'

const defaultTabs: { id: AppTab; label: string }[] = [
  { id: 'home', label: '首页' },
  { id: 'schedule', label: '课表' },
  { id: 'calendar', label: '日历' },
  { id: 'import', label: '导入' },
  { id: 'settings', label: '设置' },
]

interface TabNavProps {
  activeTab: AppTab
  onChange: (tab: AppTab) => void
  tabs?: { id: AppTab; label: string }[]
}

export function TabNav({ activeTab, onChange, tabs = defaultTabs }: TabNavProps) {
  return (
    <nav className="tab-nav" aria-label="主导航" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={tab.id === activeTab ? 'tab-btn active' : 'tab-btn'}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
