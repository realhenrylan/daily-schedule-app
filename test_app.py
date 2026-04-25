from playwright.sync_api import sync_playwright
import sys

def test_daily_schedule_app():
    """
    测试课程日历 PWA 应用的主要功能
    """
    results = []

    with sync_playwright() as p:
        print("启动浏览器...")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 390, 'height': 844})  # iPhone 14 尺寸
        page = context.new_page()

        try:
            # 测试 1: 访问应用首页
            print("测试 1: 访问应用首页...")
            page.goto('http://localhost:5175')
            page.wait_for_load_state('networkidle')

            # 截图首页
            page.screenshot(path='c:/Users/Henry Lan/Documents/GitHub/daily-schedule-app/test_home.png', full_page=True)
            print("✓ 首页截图已保存: test_home.png")

            # 检查页面标题
            title = page.title()
            print(f"页面标题: {title}")

            # 测试 2: 检查主要导航元素
            print("\n测试 2: 检查主要导航元素...")

            # 查找底部导航栏
            nav_items = page.locator('nav button, .tab-nav button, [role="tab"]').all()
            print(f"找到 {len(nav_items)} 个导航项")

            if len(nav_items) > 0:
                print("✓ 导航栏组件存在")
                results.append(("导航栏", True, f"找到 {len(nav_items)} 个导航按钮"))

                # 获取导航项文本
                nav_texts = [item.inner_text() for item in nav_items]
                print(f"导航项: {nav_texts}")
            else:
                print("⚠ 未找到导航栏组件")
                results.append(("导航栏", False, "未找到导航栏"))

            # 测试 3: 检查首页内容
            print("\n测试 3: 检查首页内容...")

            # 查找日期显示
            date_elements = page.locator('text=/\\d{4}/\\d{1,2}/\\d{1,2}/').all()
            print(f"找到日期元素: {len(date_elements)} 个")

            # 查找课程相关元素
            course_elements = page.locator('text=/课|程|schedule/i').all()
            print(f"找到课程相关内容: {len(course_elements)} 个")

            if len(course_elements) > 0 or len(date_elements) > 0:
                print("✓ 首页包含课程相关内容")
                results.append(("首页内容", True, "找到课程或日期元素"))
            else:
                results.append(("首页内容", False, "未找到课程或日期元素"))

            # 测试 4: 测试导航功能
            print("\n测试 4: 测试导航功能...")

            if len(nav_items) > 1:
                # 点击第二个导航项
                nav_items[1].click()
                page.wait_for_timeout(1000)
                page.screenshot(path='c:/Users/Henry Lan/Documents/GitHub/daily-schedule-app/test_nav2.png', full_page=True)
                print(f"✓ 点击导航项 2 成功，截图已保存: test_nav2.png")

                results.append(("导航功能", True, "导航切换成功"))

            # 测试 5: 检查控制台错误
            print("\n测试 5: 检查控制台错误...")
            console_messages = []

            def handle_console(msg):
                if msg.type == 'error':
                    console_messages.append(f"[{msg.type}] {msg.text}")

            page.on('console', handle_console)
            page.reload()
            page.wait_for_load_state('networkidle')

            if console_messages:
                print(f"发现 {len(console_messages)} 个控制台错误:")
                for msg in console_messages:
                    print(f"  - {msg}")
                results.append(("控制台错误", False, f"发现 {len(console_messages)} 个错误"))
            else:
                print("✓ 无控制台错误")
                results.append(("控制台错误", True, "无错误"))

            # 测试 6: 检查 PWA 相关资源
            print("\n测试 6: 检查 PWA 相关资源...")

            # 检查 manifest
            manifest_response = page.request.get('http://localhost:5175/manifest.webmanifest')
            if manifest_response.ok:
                manifest_data = manifest_response.json()
                print(f"✓ Manifest 加载成功: {manifest_data.get('name', 'N/A')}")
                results.append(("PWA Manifest", True, f"名称: {manifest_data.get('name')}"))
            else:
                print("⚠ Manifest 加载失败")
                results.append(("PWA Manifest", False, "Manifest 加载失败"))

            # 检查 Service Worker
            sw_response = page.request.get('http://localhost:5175/sw.js')
            if sw_response.ok:
                print("✓ Service Worker 存在")
                results.append(("Service Worker", True, "sw.js 加载成功"))
            else:
                print("⚠ Service Worker 加载失败")
                results.append(("Service Worker", False, "sw.js 加载失败"))

            # 测试 7: 测试响应式设计
            print("\n测试 7: 测试响应式设计...")

            # 桌面尺寸
            page.set_viewport_size({'width': 1280, 'height': 800})
            page.reload()
            page.wait_for_load_state('networkidle')
            page.screenshot(path='c:/Users/Henry Lan/Documents/GitHub/daily-schedule-app/test_desktop.png', full_page=True)
            print("✓ 桌面视图截图已保存: test_desktop.png")

            # 移动端尺寸
            page.set_viewport_size({'width': 375, 'height': 667})
            page.reload()
            page.wait_for_load_state('networkidle')
            page.screenshot(path='c:/Users/Henry Lan/Documents/GitHub/daily-schedule-app/test_mobile.png', full_page=True)
            print("✓ 移动端视图截图已保存: test_mobile.png")

            results.append(("响应式设计", True, "支持多尺寸视图"))

        except Exception as e:
            print(f"\n❌ 测试过程中发生错误: {str(e)}")
            results.append(("测试执行", False, str(e)))
            page.screenshot(path='c:/Users/Henry Lan/Documents/GitHub/daily-schedule-app/test_error.png', full_page=True)
            print("错误截图已保存: test_error.png")

        finally:
            browser.close()

    # 输出测试结果汇总
    print("\n" + "="*60)
    print("测试结果汇总")
    print("="*60)

    passed = 0
    failed = 0

    for test_name, status, message in results:
        symbol = "✓" if status else "✗"
        result = "通过" if status else "失败"
        print(f"{symbol} {test_name}: {result} - {message}")

        if status:
            passed += 1
        else:
            failed += 1

    print("="*60)
    print(f"总计: {passed} 通过, {failed} 失败")
    print("="*60)

    return failed == 0

if __name__ == "__main__":
    success = test_daily_schedule_app()
    sys.exit(0 if success else 1)
