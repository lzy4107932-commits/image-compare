# macOS 测试版构建与安装

当前 macOS 测试版面向 Apple Silicon（M1、M2、M3、M4），生成 ARM64 的 DMG 安装包和 ZIP 备用包。

## 在 macOS 上构建

DMG 必须在真实 macOS 环境生成。在项目根目录执行：

```bash
npm ci
npm run check
npm run smoke:electron
npm run electron:build:mac
npm run smoke:packaged
```

构建完成后，安装包位于 `release`：

```text
Image-Compare-1.1.0-macOS-arm64.dmg
Image-Compare-1.1.0-macOS-arm64.zip
```

## 安装测试版

1. 双击打开 DMG。
2. 把“图片对比工具”拖入“应用程序”。
3. 第一次启动时，在 Finder 的“应用程序”中按住 Control 点击应用，选择“打开”，然后再次确认“打开”。

当前安装包用于远端 Mac 功能测试，没有使用 Apple Developer 证书签名或公证，因此不能通过普通双击完成第一次启动。不要全局关闭 Gatekeeper。

## 建议测试项目

- DMG 能正常打开，应用可以拖入“应用程序”并启动。
- Dock 图标、应用菜单、关闭窗口后重新激活应用正常。
- 拖入图片和按钮导入均正常。
- 单图、A/B、多图模式的缩放、拖动、旋转和复位正常。
- `Command + F`、`Command + 滚轮`、方向键以及其他界面快捷键正常。
- 深色、灰色、浅色主题以及中英文界面正常。
- 损坏图片隔离、图片排序、撤销和恢复导入顺序正常。
- 退出应用后不残留窗口或异常进程。

## 正式发布前

测试通过后再配置 Apple Developer ID Application 证书、Hardened Runtime 和 Apple 公证。正式发布包不应继续使用当前的无签名配置。
