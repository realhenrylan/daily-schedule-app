# 课程日历 PWA（ICS 导入）

这是一个可在 iPhone Safari 中使用、可添加到主屏幕的课表/日历网页应用。项目基于 `React + TypeScript + Vite`，支持导入 `.ics` 文件并本地保存课程数据。

## 功能范围（MVP）

- 导入 `.ics` 日历文件
- 解析事件并生成课程记录
- 导入去重（基于 `uid/title + start`）
- 首页（今日课程 + 本周统计）
- 周课表视图
- 月历网格视图 + 当天课程列表
- 本地存储（IndexedDB）
- PWA 基础能力（manifest + service worker）

## 技术栈

- React 19 + TypeScript
- Vite 8
- dayjs（日期时间处理）
- idb（IndexedDB 封装）
- 自定义 ICS 解析逻辑（支持 EXDATE、时区和 recurring 展开）

## 项目结构

- `src/types.ts`：核心类型定义（`CourseEvent`、`ImportRecord`）
- `src/lib/db.ts`：IndexedDB 读写
- `src/lib/ics.ts`：ICS 解析与重复规则展开（基础）
- `src/lib/date.ts`：日期工具函数
- `src/components/`：页面模块组件
  - `HomeView.tsx`
  - `ScheduleView.tsx`
  - `CalendarView.tsx`
  - `ImportView.tsx`
  - `SettingsView.tsx`
  - `TabNav.tsx`
- `public/manifest.webmanifest`：PWA Manifest
- `public/sw.js`：Service Worker

## 本地运行

```bash
npm install
npm run dev
```

访问默认地址（通常为 `http://localhost:5173`）。

## 构建

```bash
npm run build
npm run preview
```

## 在 iPhone 上使用

1. 在同一网络下打开开发地址（或部署后的 HTTPS 地址）
2. 用 Safari 打开页面
3. 点击“分享” -> “添加到主屏幕”
4. 从主屏幕图标进入即可获得接近 App 的体验

## 当前实现说明

- 解析器支持 `VEVENT` 常见字段：`SUMMARY`、`DTSTART`、`DTEND`、`LOCATION`、`DESCRIPTION`、`UID`、`RRULE`、`EXDATE`
- 采用 `ical.js` 进行 iCalendar 解析和 recurring 展开，支持时区时间（含 `TZID`）
- 对 recurring 事件做最大展开数量保护，避免异常规则导致性能问题
- 日历页为“月历网格 + 选中日期课程列表”的组合交互

## 后续可扩展

- 月历网格视图
- 导出 `.ics`
- 云同步（登录 + 后端）
- 更强的重复规则与排除日期（`EXDATE`）
