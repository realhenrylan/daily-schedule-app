# 课程日历 PWA（ICS 导入）

这是一个可在 iPhone Safari 中使用、可添加到主屏幕的课表/日历网页应用。项目基于 `React + TypeScript + Vite`，支持导入 `.ics` 文件并本地保存课程数据。

## 功能列表

- [x] 导入 `.ics` 日历文件
- [x] 自动识别学期（根据文件名如 "2026 Summer" 自动推断）
- [x] 解析事件并生成课程记录
- [x] 导入去重（基于 `uid/title + start`）
- [x] 首页（今日课程、本周统计、收藏课程）
- [x] 课程冲突检测
- [x] 周课表视图（支持手势滑动切换周）
- [x] 月历网格视图 + 选中日期课程列表
- [x] 课程颜色区分
- [x] 课程提醒设置（全局 + 单课级别）
- [x] 推送通知支持
- [x] 课程收藏功能
- [x] 快速添加课程
- [x] 深色/浅色主题切换
- [x] 本地存储（IndexedDB）
- [x] PWA 基础能力（manifest + service worker）
- [ ] 导出 `.ics`
- [ ] 云同步（登录 + 后端）

## 技术栈

- React 19 + TypeScript
- Vite 8
- dayjs（日期时间处理）
- idb（IndexedDB 封装）
- 自定义 ICS 解析逻辑（支持 EXDATE、时区和 recurring 展开）

## 项目结构

- `src/types.ts`：核心类型定义（`CourseEvent`、`ImportRecord`）
- `src/lib/db.ts`：IndexedDB 读写
- `src/lib/ics.ts`：ICS 解析与重复规则展开
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
3. 点击"分享" -> "添加到主屏幕"
4. 从主屏幕图标进入即可获得接近 App 的体验

## 当前实现说明

- 解析器支持 `VEVENT` 常见字段：`SUMMARY`、`DTSTART`、`DTEND`、`LOCATION`、`DESCRIPTION`、`UID`、`RRULE`、`EXDATE`
- 采用 `ical.js` 进行 iCalendar 解析和 recurring 展开，支持时区时间（含 `TZID`）
- 对 recurring 事件做最大展开数量保护，避免异常规则导致性能问题
- 日历页为"月历网格 + 选中日期课程列表"的组合交互
- 学期根据 ICS 文件名自动识别，支持中英文季节（春/夏/秋/冬、Spring/Summer/Fall/Winter）

## 更新日志

### v1.1.0 (2025-01-xx)
- 自动识别学期：根据 ICS 文件名（如 "2026 Summer"）推断学期名称和时间范围
- 学期自动切换：顶部显示当前学期、课程数和课程门数
- 底部导航优化：去掉小横条，使用更简约的选中态
- 日历课程列表：用不同颜色区分课程
- 课程冲突检测：首页显示今日有冲突的课程警告
- 手势操作：周课表支持左右滑动切换周视图
- 课程收藏：点击星标收藏常用课程
- 快速添加：首页底部快捷添加按钮
- 推送支持：全局 + 单课级别提醒时间设置

### v1.0.0 (2024-xx-xx)
- 初始版本，支持 ICS 导入、本地存储、周/月视图、推送通知
