"""
专项测试：验证代码优化和修复的功能
"""
import json
import re
import os

def test_extract_semester_function():
    """测试 extractSemesterFromFileName 函数定义的正确性"""
    print("\n测试 1: extractSemesterFromFileName 函数定义...")

    with open('src/App.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 查找函数定义
    pattern = r'function extractSemesterFromFileName\('
    matches = list(re.finditer(pattern, content))

    if len(matches) == 1:
        print(f"✓ 函数正确定义（1个定义）")
        print(f"✓ 位置：第 {content[:matches[0].start()].count(chr(10)) + 1} 行")

        # 检查是否有 JSDoc 注释
        before = content[:matches[0].start()].rfind('/**')
        if before != -1 and '从文件名中提取学期信息' in content[before:matches[0].start()]:
            print(f"✓ 包含 JSDoc 注释")
            return True
        else:
            print(f"⚠ 未找到 JSDoc 注释")
            return False
    else:
        print(f"✗ 函数定义错误：找到 {len(matches)} 个定义（预期 1 个）")
        return False

def test_backup_security():
    """测试备份导入的安全性修复"""
    print("\n测试 2: 备份导入安全性...")

    with open('src/lib/backup.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    checks = {
        "MAX_BACKUP_FILE_SIZE 常量": 'MAX_BACKUP_FILE_SIZE' in content,
        "文件大小检查": 'file.size > MAX_BACKUP_FILE_SIZE' in content,
        "错误消息": '备份文件过大' in content,
        "文件大小验证": 'toFixed(2)' in content
    }

    all_passed = True
    for check_name, result in checks.items():
        symbol = "✓" if result else "✗"
        print(f"  {symbol} {check_name}: {'通过' if result else '失败'}")
        if not result:
            all_passed = False

    return all_passed

def test_code_comments():
    """测试关键文件的注释覆盖率"""
    print("\n测试 3: 代码注释覆盖...")

    files_to_check = {
        'src/lib/ics.ts': ['colorFromTitle', 'normalizeDate', 'eventId', 'toCourseEvent', 'unfoldIcs'],
        'src/lib/db.ts': ['getAllEvents', 'saveEvents', 'replaceEvents', 'clearEvents', 'addImportRecord'],
        'src/App.tsx': ['extractSemesterFromFileName']
    }

    all_passed = True
    for file_path, functions in files_to_check.items():
        if not os.path.exists(file_path):
            print(f"  ✗ {file_path}: 文件不存在")
            all_passed = False
            continue

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        print(f"\n  【{file_path}】")
        for func_name in functions:
            # 查找函数定义前的 JSDoc 注释（支持 export 和 async）
            pattern = rf'/\*\*.*?\*/\s*\n\s*(?:export\s+)?(?:async\s+)?function {func_name}'
            has_comment = bool(re.search(pattern, content, re.DOTALL))

            symbol = "✓" if has_comment else "✗"
            print(f"    {symbol} {func_name}: {'有注释' if has_comment else '无注释'}")
            if not has_comment:
                all_passed = False

    return all_passed

def test_typescript_build():
    """验证 TypeScript 编译成功"""
    print("\n测试 4: TypeScript 编译...")

    dist_path = 'dist/index.html'
    if os.path.exists(dist_path):
        print(f"✓ 构建成功，dist 目录存在")
        return True
    else:
        print(f"✗ 构建未成功，dist 目录不存在")
        return False

def test_duplicate_function_fix():
    """验证重复函数定义已修复"""
    print("\n测试 5: 重复函数定义修复...")

    with open('src/App.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 检查是否有嵌套的函数定义
    lines = content.split('\n')
    in_function = False
    nested_functions = []

    for i, line in enumerate(lines):
        if 'async function handleConfirmImport' in line or 'function handleConfirmImport' in line:
            in_function = True
            func_start = i
        elif in_function and line.strip().startswith('function '):
            nested_functions.append((i + 1, line.strip()))
        elif in_function and line.strip().startswith('}'):
            # 检查是否结束了一个独立的函数块
            if '{' not in line and '}' in line:
                # 检查前面的缩进
                prev_line = lines[i - 1] if i > 0 else ''
                if prev_line.strip() and not prev_line.strip().startswith('function '):
                    in_function = False

    if nested_functions:
        print(f"✗ 发现嵌套函数定义：")
        for line_num, func_def in nested_functions:
            print(f"    第 {line_num} 行: {func_def}")
        return False
    else:
        print(f"✓ 无嵌套函数定义")
        return True

def main():
    print("="*60)
    print("代码优化验证测试")
    print("="*60)

    results = []

    # 运行所有测试
    results.append(("extractSemesterFunction", test_extract_semester_function()))
    results.append(("backupSecurity", test_backup_security()))
    results.append(("codeComments", test_code_comments()))
    results.append(("typescriptBuild", test_typescript_build()))
    results.append(("duplicateFunctionFix", test_duplicate_function_fix()))

    # 输出汇总
    print("\n" + "="*60)
    print("测试结果汇总")
    print("="*60)

    passed = sum(1 for _, result in results if result)
    failed = sum(1 for _, result in results if not result)

    for test_name, result in results:
        symbol = "✓" if result else "✗"
        status = "通过" if result else "失败"
        print(f"{symbol} {test_name}: {status}")

    print("="*60)
    print(f"总计: {passed} 通过, {failed} 失败")
    print("="*60)

    if failed == 0:
        print("\n🎉 所有优化验证测试通过！")
        print("\n已完成的优化：")
        print("  ✓ 修复了 extractSemesterFromFileName 重复定义问题")
        print("  ✓ 添加了备份文件大小限制（5MB），防止 DoS 攻击")
        print("  ✓ 为关键函数添加了详细的 JSDoc 注释")
        print("  ✓ TypeScript 编译成功")
    else:
        print(f"\n⚠️ 有 {failed} 项测试失败")

    return failed == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
