import requests
import json

def test_basic_functionality():
    """
    基本功能测试（无需浏览器）
    """
    results = []
    base_url = "http://localhost:5175"

    print("="*60)
    print("课程日历 PWA 应用 - 基本功能测试")
    print("="*60)

    # 测试 1: 首页访问
    print("\n测试 1: 访问首页...")
    try:
        response = requests.get(base_url, timeout=5)
        if response.status_code == 200:
            content = response.text
            print(f"✓ 首页加载成功 (状态码: {response.status_code})")

            # 检查关键元素
            checks = {
                "HTML5文档": "<!DOCTYPE html>" in content or "<!doctype html>" in content.lower(),
                "React应用挂载点": 'id="root"' in content or "id=\"root\"" in content,
                "Vite配置": "vite" in content.lower(),
                "标题标签": "<title>" in content
            }

            for check_name, check_result in checks.items():
                symbol = "✓" if check_result else "✗"
                status_text = '通过' if check_result else '失败'
                print(f"  {symbol} {check_name}: {status_text}")
                results.append((check_name, check_result, status_text))

            results.append(("首页访问", True, f"加载成功，{len(content)} 字节"))
        else:
            print(f"✗ 首页加载失败 (状态码: {response.status_code})")
            results.append(("首页访问", False, f"状态码: {response.status_code}"))
    except Exception as e:
        print(f"✗ 首页访问错误: {str(e)}")
        results.append(("首页访问", False, str(e)))

    # 测试 2: PWA Manifest
    print("\n测试 2: 检查 PWA Manifest...")
    try:
        response = requests.get(f"{base_url}/manifest.webmanifest", timeout=5)
        if response.status_code == 200:
            manifest = response.json()
            print(f"✓ Manifest 加载成功")

            manifest_checks = {
                "应用名称": "name" in manifest,
                "短名称": "short_name" in manifest,
                "启动URL": "start_url" in manifest,
                "显示模式": "display" in manifest,
                "主题颜色": "theme_color" in manifest,
                "图标配置": "icons" in manifest and len(manifest["icons"]) > 0
            }

            for check_name, check_result in manifest_checks.items():
                symbol = "✓" if check_result else "✗"
                value = manifest.get(check_name.lower().replace(" ", "_"),
                                   manifest.get(check_name.lower(),
                                               manifest.get("short_name" if check_name == "短名称" else "name", "N/A")))
                if isinstance(value, list):
                    value = f"{len(value)} 个图标"
                print(f"  {symbol} {check_name}: {value}")
                results.append((f"Manifest-{check_name}", check_result, str(value)))

            results.append(("PWA Manifest", True, "完整配置"))
        else:
            print(f"✗ Manifest 加载失败 (状态码: {response.status_code})")
            results.append(("PWA Manifest", False, f"状态码: {response.status_code}"))
    except Exception as e:
        print(f"✗ Manifest 测试错误: {str(e)}")
        results.append(("PWA Manifest", False, str(e)))

    # 测试 3: Service Worker
    print("\n测试 3: 检查 Service Worker...")
    try:
        response = requests.get(f"{base_url}/sw.js", timeout=5)
        if response.status_code == 200:
            sw_content = response.text
            print(f"✓ Service Worker 存在")

            sw_checks = {
                "Service Worker 注册": "'serviceWorker'" in sw_content or "serviceWorker" in sw_content,
                "安装事件": "'install'" in sw_content,
                "激活事件": "'activate'" in sw_content,
                "fetch 事件": "'fetch'" in sw_content
            }

            for check_name, check_result in sw_checks.items():
                symbol = "✓" if check_result else "✗"
                status_text = '通过' if check_result else '失败'
                print(f"  {symbol} {check_name}: {status_text}")
                results.append((f"SW-{check_name}", check_result, status_text))

            results.append(("Service Worker", True, "功能完整"))
        else:
            print(f"✗ Service Worker 加载失败 (状态码: {response.status_code})")
            results.append(("Service Worker", False, f"状态码: {response.status_code}"))
    except Exception as e:
        print(f"✗ Service Worker 测试错误: {str(e)}")
        results.append(("Service Worker", False, str(e)))

    # 测试 4: TypeScript 配置检查
    print("\n测试 4: 检查 TypeScript 配置...")
    import os
    tsconfig_path = "tsconfig.json"
    if os.path.exists(tsconfig_path):
        with open(tsconfig_path, 'r', encoding='utf-8') as f:
            tsconfig = json.load(f)
            print(f"✓ TypeScript 配置文件存在")
            results.append(("TypeScript 配置", True, "配置文件存在"))
    else:
        print(f"✗ TypeScript 配置文件不存在")
        results.append(("TypeScript 配置", False, "配置文件不存在"))

    # 测试 5: 依赖检查
    print("\n测试 5: 检查关键依赖...")
    package_path = "package.json"
    if os.path.exists(package_path):
        with open(package_path, 'r', encoding='utf-8') as f:
            package = json.load(f)
            deps = {**package.get("dependencies", {}), **package.get("devDependencies", {})}

            key_deps = {
                "react": "React",
                "vite": "Vite",
                "typescript": "TypeScript",
                "dayjs": "dayjs",
                "idb": "idb (IndexedDB)"
            }

            all_present = True
            for dep_key, dep_name in key_deps.items():
                if dep_key in deps:
                    version = deps[dep_key]
                    print(f"  ✓ {dep_name}: {version}")
                    results.append((f"依赖-{dep_name}", True, version))
                else:
                    print(f"  ✗ {dep_name}: 未安装")
                    results.append((f"依赖-{dep_name}", False, "未安装"))
                    all_present = False

            if all_present:
                results.append(("关键依赖", True, "所有依赖已安装"))
            else:
                results.append(("关键依赖", False, "部分依赖缺失"))
    else:
        print(f"✗ package.json 不存在")
        results.append(("package.json", False, "配置文件不存在"))

    # 测试 6: 文件结构检查
    print("\n测试 6: 检查关键文件...")
    key_files = [
        ("src/App.tsx", "主应用组件"),
        ("src/main.tsx", "应用入口"),
        ("src/components/HomeView.tsx", "首页视图"),
        ("src/components/ScheduleView.tsx", "课表视图"),
        ("src/components/CalendarView.tsx", "日历视图"),
        ("src/lib/db.ts", "数据库模块"),
        ("src/lib/ics.ts", "ICS 解析模块"),
        ("public/manifest.webmanifest", "PWA Manifest"),
        ("public/sw.js", "Service Worker")
    ]

    all_files_exist = True
    for file_path, description in key_files:
        if os.path.exists(file_path):
            print(f"  ✓ {description}: {file_path}")
            results.append((f"文件-{description}", True, file_path))
        else:
            print(f"  ✗ {description}: {file_path} (不存在)")
            results.append((f"文件-{description}", False, f"缺失: {file_path}"))
            all_files_exist = False

    if all_files_exist:
        results.append(("文件结构", True, "所有关键文件存在"))
    else:
        results.append(("文件结构", False, "部分文件缺失"))

    # 输出汇总
    print("\n" + "="*60)
    print("测试结果汇总")
    print("="*60)

    passed = 0
    failed = 0

    # 按类别分组输出
    categories = {}
    for test_name, status, message in results:
        category = test_name.split("-")[0] if "-" in test_name else "其他"
        if category not in categories:
            categories[category] = []
        categories[category].append((test_name, status, message))

    for category, tests in sorted(categories.items()):
        print(f"\n【{category}】")
        for test_name, status, message in tests:
            symbol = "✓" if status else "✗"
            result = "通过" if status else "失败"
            print(f"  {symbol} {test_name}: {result}")
            if status:
                passed += 1
            else:
                failed += 1

    print("\n" + "="*60)
    print(f"总计: {passed} 通过, {failed} 失败")
    print("="*60)

    # 额外信息
    print("\n📱 应用访问信息:")
    print(f"   开发服务器: {base_url}")
    print(f"   网络访问 (在同一网络中): http://localhost:5175")

    if failed == 0:
        print("\n🎉 所有测试通过！应用已准备好进行进一步测试。")
        return True
    else:
        print(f"\n⚠️ 有 {failed} 项测试失败，建议检查后再进行功能测试。")
        return False

if __name__ == "__main__":
    success = test_basic_functionality()
    exit(0 if success else 1)
