# 图片对比工具（Image Compare）

一款完全在本地运行的轻量桌面图片查看与对比工具。

当前稳定版本：**1.2.0**

项目专注于单图查看、两图差异对比和少量多图同步观察，不提供批量修图、格式转换或复杂工作流处理功能。

## 下载与系统支持

安装包请前往 [GitHub Releases](https://github.com/lzy4107932-commits/image-compare/releases) 下载。

| 系统 | 安装包 | 支持范围 |
| --- | --- | --- |
| Windows | `.exe` | Windows 10/11 x64 |
| macOS | `.dmg` | Apple Silicon M1/M2/M3/M4，ARM64 |

macOS 版没有付费 Apple Developer ID 签名和 Apple 公证。首次打开时，请进入“系统设置”→“隐私与安全性”，找到“图片对比工具”被阻止的提示并点击“仍要打开”（部分系统版本可能显示“仍要安装”）。安装包同时附带 `MACOS_INSTALL.txt` 完整说明，不需要全局关闭 Gatekeeper。

## 主要功能

### 单图模式

- 图片自适应窗口显示
- 缩放、拖动、顺时针旋转与一键复位
- 使用方向键切换图片
- 可在画布底部显示或隐藏完整文件名

### A/B 对比模式

- 左右并排和重叠滑块两种对比方式
- 支持 A、B 同步调整或分别校准
- 支持缩放、移动、旋转和复位
- 图片文件名显示在各自展示区域底部

### 多图模式

- 根据图片数量自动选择紧凑排列方式
- 3 张图片并排展示，4 张图片采用 2×2 布局
- 支持全部图片同步缩放、移动和旋转
- 使用 `Alt` 配合鼠标可单独校准一张图片

### 图片管理与界面

- 拖入图片或通过按钮导入
- 左侧列表支持拖拽及键盘排序
- 支持撤销排序、恢复最初导入顺序
- 支持按文件名筛选并定位当前图片
- 深色、灰色、浅色三种主题
- 中文与英文界面
- 常用操作支持键盘快捷键

## 界面截图

### 单图模式

<img width="3070" height="1822" alt="image" src="https://github.com/user-attachments/assets/566a5c0e-e9ea-42f7-942d-da396a708030" />


### A/B 对比模式

<img width="3066" height="1824" alt="image" src="https://github.com/user-attachments/assets/8a6c6b70-32df-4b55-9168-9fcd74df405a" />
<img width="3070" height="1828" alt="image" src="https://github.com/user-attachments/assets/95aca8a4-51c7-40eb-8a95-ff51b61a8e2d" />


### 多图模式
<img width="3070" height="1826" alt="image" src="https://github.com/user-attachments/assets/9a0193f9-005b-4053-8f94-2523e326814e" />

## 快捷操作

| 模式 | 操作 |
| --- | --- |
| 单图 | `←` / `→` 切图，`+` / `-` 缩放，`0` 复位，`R` 旋转 |
| A/B | `+` / `-` 缩放当前对象，`0` 复位，`R` 旋转 |
| 多图 | `+` / `-` 同步缩放，`0` 全部复位，`R` 全部旋转 |
| 多图鼠标 | `Ctrl/Cmd + 滚轮` 同步缩放，`Alt + 滚轮/拖动` 调整单图 |
| 图片列表 | `Ctrl/Cmd + F` 定位筛选框，`Esc` 清除筛选 |

## 隐私与安全

- 图片只通过本地对象 URL 加载，不会上传到网络。
- 删除、清空图片或关闭应用时会释放临时图片资源。
- 无法解码的图片会被单独移除，不影响其他图片继续使用。
- 错误恢复界面不会显示图片内容、本地文件路径或技术堆栈。

为避免误操作和过高的内存占用，当前设置了单张图片 50 MiB、总容量 500 MiB 和最多 100 张的安全上限；这些上限是保护措施，不代表软件定位为批量处理工具。

## 1.2.0 更新内容

- 新增 Apple Silicon macOS 版本，支持 M1、M2、M3、M4 ARM64 设备。
- 新增 DMG 和 ZIP 构建、ICNS 图标及 macOS 原生应用菜单。
- macOS 安装包采用免费的 ad-hoc 技术签名，并增加严格签名校验。
- 增加 macOS 打包后启动测试及首次打开安全提示说明。
- 保持 Windows 版本功能和构建流程不变。

## 1.1.0 更新内容

- 优化单图初始自适应显示与旋转后的尺寸计算。
- 完善 A/B 和多图模式的缩放、旋转、复位及快捷键操作。
- 优化 3 张、4 张及更多图片的展示排列和画布利用率。
- 三种模式统一文件名显示位置与显示开关。
- 新增图片拖拽排序、键盘排序、撤销及恢复导入顺序。
- 新增文件名筛选、当前图片定位与操作反馈。
- 优化大图缩略图、拖动刷新和临时资源释放。
- 增加损坏图片隔离、全局错误恢复及 Windows 打包验证。
- 完善自动化测试，目前包含 94 项测试。

## 技术栈

- Electron
- React
- TypeScript
- Vite
- Vitest 与 Testing Library

## 本地开发

确保电脑已经安装 Node.js，然后执行：

```bash
npm install
npm run dev
```

## 检查与构建

```bash
# 代码检查、自动化测试和生产构建
npm run check

# Electron 启动冒烟测试
npm run smoke:electron

# 构建 Windows 安装包
npm run electron:build
```

Windows 安装包生成在本地 `release` 目录中，该目录不会提交到 Git 仓库。

## macOS 版本

当前提供 Apple Silicon（M1/M2/M3/M4）ARM64 构建配置，并使用免费的 macOS ad-hoc 技术签名。它不是付费 Apple Developer ID 签名，因此首次打开仍需要在“隐私与安全性”中确认。DMG 需要在 macOS 环境中生成：

```bash
npm ci
npm run check
npm run electron:build:mac
npm run smoke:packaged
```

生成的 DMG、ZIP、校验文件和安装说明位于本地 `release` 目录。安装说明见 [MACOS_INSTALL.txt](./MACOS_INSTALL.txt)，远端 Mac 的构建与检查步骤见 [MACOS_TESTING.md](./MACOS_TESTING.md)。
