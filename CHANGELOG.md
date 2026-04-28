# 更新日志

所有重要的版本更新和功能更改都会记录在此文件中。

## [Unreleased] - 当前版本

### ✨ 新增功能

- **Favicon 图标设计**
  - 设计并替换了简约的蓝色日历 favicon（SVG 格式）
  - 图标采用 iOS 风格圆角方形 + 白色日历线条，匹配 App 整体设计语言
  - 新增 `apple-touch-icon` 支持，添加到 iPhone 主屏幕时显示一致图标
  - 同步更新 `theme-color` 为 `#0071e3`（与 App CSS 主题色一致）

### 🐛 Bug 修复

- **日历日期数字对齐修复**
  - 修复了日历视图中日期数字不整齐的问题
  - 当某些日期有课程数量标记而有些没有时，数字位置保持一致
  - 将 `.day-cell` 改为从顶部对齐并添加统一顶部间距

- **代码质量修复**
  - 修复了 `extractSemesterFromFileName` 函数在 `App.tsx` 中的重复定义问题
  - 移除了嵌套在 `handleConfirmImport` 函数内的重复函数定义
  - 优化了代码结构，将辅助函数移到合适的作用域

### 🔒 安全增强

- **备份系统安全性**
  - 添加了备份文件大小限制（5MB），防止恶意大文件导致浏览器崩溃
  - 添加了文件大小验证和友好的错误提示
  - 防止 DoS 攻击

### 📝 代码质量

- **注释完善**
  - 为 `src/lib/ics.ts` 中的核心函数添加了详细的 JSDoc 注释：
    - `colorFromTitle()` - 课程颜色哈希生成
    - `normalizeDate()` - 日期标准化
    - `eventId()` - 事件 ID 生成
    - `toCourseEvent()` - 事件对象转换
    - `unfoldIcs()` - ICS 文件展开
  - 为 `src/lib/db.ts` 中的数据库操作函数添加了 JSDoc 注释：
    - `getAllEvents()` - 获取所有事件
    - `saveEvents()` - 保存新事件
    - `replaceEvents()` - 替换所有事件
    - `clearEvents()` - 清空事件
    - `addImportRecord()` - 添加导入记录
  - 为 `src/App.tsx` 中的 `extractSemesterFromFileName()` 添加了 JSDoc 注释

### ✅ 测试

- 新增了 `test_optimizations.py` 专项测试脚本
- 验证所有代码优化和修复的正确性
- 所有测试均已通过

### 🔧 构建验证

- TypeScript 编译通过 ✅
- ESLint 代码检查通过 ✅
- Vite 生产构建成功 ✅
- 应用功能测试通过 ✅

---

## 历史版本

### [已发布版本]

请查看 Git 提交历史以了解完整的版本变更记录。

---

## 版本规范

本项目使用[语义化版本](https://semver.org/lang/zh-CN/)：

- **主版本号**：不兼容的重大 API 更改
- **次版本号**：向后兼容的功能新增
- **修订号**：向后兼容的 Bug 修复

## 维护说明

- 每个 Pull Request 必须包含对应的功能或修复说明
- 重大更改需要更新本文档
- 所有代码必须通过 ESLint 和 TypeScript 类型检查
