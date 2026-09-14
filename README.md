# 图片对比工具（Image Compare）

一款完全在本地运行的桌面图片查看与对比应用。

## 功能特点

- 单图查看：缩放、拖动、旋转和前后切图
- A/B 对比：并排或重叠显示，可同步调整或单独校准 A、B
- 多图查看：同步缩放、移动、旋转，并支持单图校准
- 支持鼠标、触控板和键盘快捷操作
- 深色、灰色、浅色三种主题
- 中文和英文界面
- 图片仅通过本地对象 URL 加载，不上传到网络

## 导入限制

- 最多同时导入 100 张图片
- 单张文件最大 50 MiB
- 已导入文件总容量最大 500 MiB
- 删除、清空图片或关闭应用时会释放对应的临时对象 URL

## 技术栈

- Electron
- React
- TypeScript
- Vite
- Vitest
- Testing Library

## 安装与运行

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
