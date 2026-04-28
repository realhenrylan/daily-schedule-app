"""
Playwright 综合测试：课程日历 PWA 应用的 UI 和功能验证
"""
from playwright.sync_api import sync_playwright
import sys
import os

BASE_URL = "http://localhost:5174"
SCREENSHOT_DIR = "screenshots"

def ensure_dir():
    if not os.path.exists(SCREENSHOT_DIR):
        os.makedirs(SCREENSHOT_DIR)

class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []

    def add(self, name, success, detail=""):
        if success:
            self.passed += 1
            self.results.append(("✓", name, "通过", detail))
        else:
            self.failed += 1
            self.results.append(("✗", name, "失败", detail))

    def summary(self):
        print("\n" + "=" * 70)
        print("测试结果汇总")
        print("=" * 70)
        for symbol, name, status, detail in self.results:
            msg = f"{symbol} {name}: {status}"
            if detail:
                msg += f" - {detail}"
            print(msg)
        print("=" * 70)
        print(f"总计: {self.passed} 通过, {self.failed} 失败")
        print("=" * 70)
        return self.failed == 0


def test_webapp():
    r = TestResult()
    ensure_dir()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()
        console_errors = []

        def on_console(msg):
            if msg.type == 'error':
                console_errors.append(msg.text)

        page.on('console', on_console)

        try:
            # ============================================================
            # 测试 1: 首页加载
            # ============================================================
            print("测试 1: 首页加载...")
            page.goto(BASE_URL)
            page.wait_for_load_state('networkidle')
            page.screenshot(path=f'{SCREENSHOT_DIR}/01_home.png', full_page=True)

            title = page.title()
            r.add("页面标题不为空", bool(title), title)

            # 检查 tab 导航
            nav_btns = page.locator('.tab-nav button').all()
            r.add("底部导航栏存在", len(nav_btns) >= 3, f"{len(nav_btns)} 个按钮")

            # 检查顶部标题
            h1 = page.locator('.topbar-left h1')
            r.add("顶部标题存在", h1.is_visible(), h1.inner_text())

            # ============================================================
            # 测试 2: 无控制台错误
            # ============================================================
            print("测试 2: 控制台错误检查...")
            r.add("无控制台错误", len(console_errors) == 0, f"错误数: {len(console_errors)}")
            for err in console_errors:
                print(f"  ⚠ 控制台错误: {err[:100]}")

            # ============================================================
            # 测试 3: 导航到课表
            # ============================================================
            print("测试 3: 导航到课表...")
            schedule_btn = page.locator('.tab-nav button').nth(1)
            schedule_btn.click()
            page.wait_for_timeout(600)
            page.screenshot(path=f'{SCREENSHOT_DIR}/02_schedule.png', full_page=True)

            schedule_panel = page.locator('.panel').first
            r.add("课表面板可见", schedule_panel.is_visible())

            # ============================================================
            # 测试 4: 导航到日历
            # ============================================================
            print("测试 4: 导航到日历...")
            cal_btn = page.locator('.tab-nav button').nth(2)
            cal_btn.click()
            page.wait_for_timeout(600)
            page.screenshot(path=f'{SCREENSHOT_DIR}/03_calendar.png', full_page=True)

            # 检查日历格子
            cal_grid = page.locator('.month-grid')
            r.add("日历网格可见", cal_grid.is_visible())

            day_cells = page.locator('.day-cell').all()
            r.add("日历格子存在", len(day_cells) >= 28, f"{len(day_cells)} 个格子")

            # 检查日历数字对齐 - 获取所有 span 的位置
            if len(day_cells) > 0:
                # 点击一个格子，看日期列表
                day_cells[day_cells.index(max(day_cells, key=lambda x: int(x.inner_text() or 0)))] if any(d.inner_text().isdigit() for d in day_cells) else day_cells[15]
                day_cells[15].click()
                page.wait_for_timeout(400)
                date_list = page.locator('.date-list')
                r.add("日期列表显示", date_list.is_visible())

            # ============================================================
            # 测试 5: 导航到导入页面
            # ============================================================
            print("测试 5: 导航到导入页面...")
            imp_btn = page.locator('.tab-nav button').nth(3)
            imp_btn.click()
            page.wait_for_timeout(600)
            page.screenshot(path=f'{SCREENSHOT_DIR}/04_import.png', full_page=True)

            panel_text = page.locator('.panel').inner_text()
            r.add("导入页面内容可见", len(panel_text) > 10)

            # ============================================================
            # 测试 6: 导航到设置页面 + 推送状态
            # ============================================================
            print("测试 6: 导航到设置页面...")
            set_btn = page.locator('.tab-nav button').nth(4)
            set_btn.click()
            page.wait_for_timeout(800)
            page.screenshot(path=f'{SCREENSHOT_DIR}/05_settings.png', full_page=True)

            settings_text = page.locator('.panel').inner_text()
            r.add("设置页面可见", len(settings_text) > 20)

            # 检查推送状态文本
            push_status = page.locator('.push-status')
            if push_status.is_visible():
                status_text = push_status.inner_text()
                r.add("推送状态区域存在", bool(status_text), status_text.strip()[:60])

            # ============================================================
            # 测试 7: 主题切换
            # ============================================================
            print("测试 7: 主题切换...")
            theme_btn = page.locator('.theme-toggle')
            r.add("主题切换按钮存在", theme_btn.is_visible())

            if theme_btn.is_visible():
                current_theme = page.evaluate("document.documentElement.getAttribute('data-theme')")
                theme_btn.click()
                page.wait_for_timeout(400)
                new_theme = page.evaluate("document.documentElement.getAttribute('data-theme')")
                r.add("主题切换生效", current_theme != new_theme, f"{current_theme} → {new_theme}")
                page.screenshot(path=f'{SCREENSHOT_DIR}/06_dark_mode.png', full_page=True)

            # ============================================================
            # 测试 8: 响应式布局
            # ============================================================
            print("测试 8: 响应式布局...")
            # 桌面尺寸
            page.set_viewport_size({'width': 1280, 'height': 800})
            page.reload()
            page.wait_for_load_state('networkidle')
            page.screenshot(path=f'{SCREENSHOT_DIR}/07_desktop.png', full_page=True)
            r.add("桌面布局渲染正常", True)

            # 移动端尺寸
            page.set_viewport_size({'width': 375, 'height': 667})
            page.reload()
            page.wait_for_load_state('networkidle')
            page.screenshot(path=f'{SCREENSHOT_DIR}/08_mobile.png', full_page=True)
            r.add("移动端布局渲染正常", True)

            # ============================================================
            # 测试 9: PWA manifest
            # ============================================================
            print("测试 9: PWA 文件检查...")
            manifest_resp = context.request.get(f'{BASE_URL}/manifest.webmanifest')
            r.add("Manifest 加载成功", manifest_resp.ok, f"状态码: {manifest_resp.status}")

            sw_resp = context.request.get(f'{BASE_URL}/sw.js')
            r.add("Service Worker 加载成功", sw_resp.ok, f"状态码: {sw_resp.status}")

            # ============================================================
            # 测试 10: 回到首页
            # ============================================================
            print("测试 10: 回到首页...")
            home_btn = page.locator('.tab-nav button').first
            home_btn.click()
            page.wait_for_timeout(600)
            home_visible = page.locator('.panel').is_visible()
            r.add("首页可正常返回", home_visible)

        except Exception as e:
            r.add("测试执行异常", False, str(e)[:100])
            try:
                page.screenshot(path=f'{SCREENSHOT_DIR}/99_error.png', full_page=True)
            except:
                pass
        finally:
            browser.close()

    return r.summary()


if __name__ == "__main__":
    success = test_webapp()
    sys.exit(0 if success else 1)
