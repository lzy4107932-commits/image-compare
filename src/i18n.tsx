import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { I18nContext, type I18nContextValue } from "./i18nContext";

export type Language = "zh" | "en";

const LANGUAGE_STORAGE_KEY = "image-viewer-language";

const translations = {
  zh: {
    language: "语言",
    chinese: "中文",
    english: "English",

    single: "单图",
    grid: "多图",
    compare: "A/B 对比",

    importImages: "导入图片",
    clearImages: "清空图片",
    delete: "删除",
    reset: "复位",
    resetAll: "全部复位",

    sideBySide: "左右对比",
    overlay: "重叠对比",
    sync: "同步",
    adjustA: "调整 A",
    adjustB: "调整 B",

    zoomIn: "放大",
    zoomOut: "缩小",
    rotate: "旋转",
    fit: "适应窗口",

    noImages: "暂无图片",
    importHint: "请导入图片开始使用",
    needTwoImages: "至少需要两张图片",

    appTitle: "图片对比器",
    appSubtitle: "图片查看与差异对比工具",
    imageList: "图片列表",
    imagesUnit: "张图片",
    wheelZoom: "滚轮缩放",
    dragToPan: "左键拖动",
    doubleClickReset: "双击复位",
    startImport: "开始导入图片",
    importDescription: "点击右上角“导入图片”，可一次选择一张或多张图片。",
    singleView: "单图视图",
    compareView: "A/B 对比视图",
    gridView: "多图视图",

    noImagesImported: "尚未导入图片",
    noImageSelected: "未选择图片",

    imageNumber: "图片",
    total: "共",
    imageUnit: "张图片",
    current: "当前",
    syncBothImages: "同步操作 A 和 B",
    adjustOnlyA: "只调整 A",
    adjustOnlyB: "只调整 B",
    switchBackToSync: "调整完成后切回“同步”",

    overlayCompare: "重叠对比",
    operationTarget: "操作对象",
    synchronized: "同步",
    resetCurrent: "复位当前",

    multiImageCompare: "多图同步对比",
    gridModeDescription: "多图模式：支持同步变换和单图校准",

    normalWheel: "普通滚轮：浏览页面",
    syncWheel: "Ctrl/Cmd + 滚轮：全部同步缩放",
    syncDrag: "左键拖动：全部同步移动",
    singleWheel: "Alt + 滚轮：单图缩放",
    singleDrag: "Alt + 拖动：单图移动",
    singleReset: "Alt + 双击：复位单图",
    resetAllHint: "双击：复位全部",

    zoomLabel: "缩放",
    zoomOutCurrent: "缩小当前操作对象",
    currentZoom: "当前操作对象的缩放比例",
    zoomInCurrent: "放大当前操作对象",
    resetCurrentTitle: "复位当前操作对象",
    resetAllTitle: "复位 A、B 和同步变换",
    gridShortcutScroll: "普通滚轮：浏览页面",
    gridShortcutZoomAll: "Ctrl/Cmd + 滚轮：全部同步缩放",
    gridShortcutPanAll: "左键拖动：全部同步移动",
    gridShortcutZoomOne: "Alt + 滚轮：单图缩放",
    gridShortcutPanOne: "Alt + 拖动：单图移动",
    gridShortcutResetOne: "Alt + 双击：复位单图",
    gridShortcutResetAll: "双击：复位全部",
    // 中文
    multiCompareUsageHint:
      "两张图片请使用“A/B 对比”，三张及以上图片可使用多图同步对比。",
    multiImageSyncCompare: "多图同步对比",
    images: "张图片",
    zoomOutAllImages: "所有图片同步缩小",
    zoomInAllImages: "所有图片同步放大",
    // 中文
    globalZoomLevel: "同步缩放比例",
    resetAllTransforms: "复位全部同步变换和单图校准",
    multiCompareMinImages: "多图同步对比至少需要 3 张图片",
    splitPosition: "分割位置",
    rotateClockwise: "顺时针旋转",
    rotate90: "旋转 90°",
    rotationAngle: "旋转角度",
    resetView: "复位当前视图",
    viewMode: "查看模式",
    compareDisplayMode: "对比显示方式",
    setAsImageA: "设为图片 A",
    setAsImageB: "设为图片 B",
    selectImage: "选择图片",
    singleKeyboardHelp: "←/→ 切换图片 · +/- 缩放 · 0 复位 · R 旋转",
    compareKeyboardHelp: "+/- 缩放当前 · 0 复位当前 · R 旋转当前",
    gridKeyboardHelp: "+/- 缩放全部 · 0 复位全部 · R 旋转全部",
    rotateCurrentTarget: "顺时针旋转当前操作对象 90°",
    rotateAllImages: "顺时针旋转全部图片 90°",
    needTwoImagesDescription: "请导入至少两张图片，然后在左侧分别设置 A 和 B。",
    singleImageZoom: "单图缩放",
    unsupportedImagesSkipped: "已跳过不支持的文件",
    oversizedImagesSkipped: "已跳过超过大小限制的图片",
    imageCountLimitReached: "图片数量已达到上限",
    totalImageSizeLimitReached: "图片总容量已达到上限",
    imageLoadFailed: "图片无法解码，已从列表中移除",
    dismissNotice: "关闭提示",
    selectTheme: "选择主题",
    themeSelection: "主题选择",
    currentTheme: "当前主题",

    "theme.dark": "深色",
    "theme.gray": "灰色",
    "theme.light": "浅色",
  },

  en: {
    language: "Language",
    chinese: "中文",
    english: "English",

    single: "Single",
    grid: "Grid",
    compare: "A/B Compare",

    importImages: "Import Images",
    clearImages: "Clear Images",
    delete: "Delete",
    reset: "Reset",
    resetAll: "Reset All",

    sideBySide: "Side by Side",
    overlay: "Overlay",
    sync: "Sync",
    adjustA: "Adjust A",
    adjustB: "Adjust B",

    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    rotate: "Rotate",
    fit: "Fit to Window",

    appTitle: "Image Comparator",
    appSubtitle: "Image viewing and difference comparison tool",
    imageList: "Image List",
    imagesUnit: "images",

    noImages: "No Images",
    importHint: "Import images to get started",
    needTwoImages: "At least two images are required",
    wheelZoom: "Wheel to zoom",
    dragToPan: "Drag to pan",
    doubleClickReset: "Double-click to reset",
    startImport: "Start importing images",
    importDescription:
      'Click "Import Images" in the upper-right corner to select one or more images.',
    singleView: "Single View",
    compareView: "A/B Compare View",
    gridView: "Grid View",

    noImagesImported: "No images imported",
    noImageSelected: "No image selected",

    imageNumber: "Image",
    total: "Total",
    imageUnit: "images",
    current: "Current",
    syncBothImages: "Synchronize A and B",
    adjustOnlyA: "Adjust A only",
    adjustOnlyB: "Adjust B only",
    switchBackToSync: 'Switch back to "Sync" after adjustment',

    overlayCompare: "Overlay",
    operationTarget: "Target",
    synchronized: "Sync",
    resetCurrent: "Reset Current",

    multiImageCompare: "Synchronized Grid Comparison",
    gridModeDescription:
      "Grid mode: supports synchronized transforms and individual calibration",

    normalWheel: "Wheel: scroll page",
    syncWheel: "Ctrl/Cmd + wheel: zoom all",
    syncDrag: "Drag: move all",
    singleWheel: "Alt + wheel: zoom one image",
    singleDrag: "Alt + drag: move one image",
    singleReset: "Alt + double-click: reset one image",
    resetAllHint: "Double-click: reset all",

    zoomLabel: "Zoom",
    zoomOutCurrent: "Zoom out current target",
    currentZoom: "Zoom level of current target",
    zoomInCurrent: "Zoom in current target",
    resetCurrentTitle: "Reset current target",
    resetAllTitle: "Reset A, B, and synchronized transforms",
    gridShortcutScroll: "Wheel: Scroll page",
    gridShortcutZoomAll: "Ctrl/Cmd + Wheel: Zoom all images",
    gridShortcutPanAll: "Left drag: Pan all images",
    gridShortcutZoomOne: "Alt + Wheel: Zoom one image",
    gridShortcutPanOne: "Alt + Drag: Pan one image",
    gridShortcutResetOne: "Alt + Double-click: Reset one image",
    gridShortcutResetAll: "Double-click: Reset all images",
    // 英文
    multiCompareUsageHint:
      'Use "A/B Compare" for two images. Use synchronized multi-image comparison for three or more images.',
    multiImageSyncCompare: "Synchronized Multi-Image Comparison",
    images: "images",
    zoomOutAllImages: "Zoom out all images",
    zoomInAllImages: "Zoom in all images",
    // 英文
    globalZoomLevel: "Synchronized zoom level",
    resetAllTransforms: "Reset all synchronized and individual transforms",
    multiCompareMinImages:
      "Synchronized multi-image comparison requires at least 3 images",
    splitPosition: "Split position",
    rotateClockwise: "Rotate clockwise",
    rotate90: "Rotate 90°",
    rotationAngle: "Rotation",
    resetView: "Reset current view",
    viewMode: "View mode",
    compareDisplayMode: "Comparison display mode",
    setAsImageA: "Set as image A",
    setAsImageB: "Set as image B",
    selectImage: "Select image",
    singleKeyboardHelp: "←/→ switch · +/- zoom · 0 reset · R rotate",
    compareKeyboardHelp: "+/- zoom current · 0 reset current · R rotate current",
    gridKeyboardHelp: "+/- zoom all · 0 reset all · R rotate all",
    rotateCurrentTarget: "Rotate current target clockwise by 90°",
    rotateAllImages: "Rotate all images clockwise by 90°",
    needTwoImagesDescription:
      "Import at least two images, then assign A and B from the sidebar.",
    singleImageZoom: "Single image zoom",
    unsupportedImagesSkipped: "Unsupported files were skipped",
    oversizedImagesSkipped: "Images over the size limit were skipped",
    imageCountLimitReached: "The image count limit has been reached",
    totalImageSizeLimitReached: "The total image size limit has been reached",
    imageLoadFailed: "The image could not be decoded and was removed",
    dismissNotice: "Dismiss notice",
    selectTheme: "Select theme",
    themeSelection: "Theme selection",
    currentTheme: "Current theme",

    "theme.dark": "Dark",
    "theme.gray": "Gray",
    "theme.light": "Light",
  },
} as const;

export type TranslationKey = keyof typeof translations.zh;

function getInitialLanguage(): Language {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (savedLanguage === "zh" || savedLanguage === "en") {
    return savedLanguage;
  }

  return "zh";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((currentLanguage) => {
      const nextLanguage = currentLanguage === "zh" ? "en" : "zh";
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      return nextLanguage;
    });
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t: (key) => translations[language][key],
    }),
    [language, setLanguage, toggleLanguage],
  );

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
