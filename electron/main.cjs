const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

const isSmokeTest = process.env.IMAGE_COMPARE_SMOKE_TEST === "1";

if (isSmokeTest || process.env.IMAGE_COMPARE_DISABLE_GPU === "1") {
  app.disableHardwareAcceleration();
}

function configureApplicationMenu() {
  if (process.platform !== "darwin") {
    Menu.setApplicationMenu(null);
    return;
  }

  const template = [
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "delete" },
        { type: "separator" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [{ role: "togglefullscreen" }],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        { type: "separator" },
        { role: "front" },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    title: "图片管理与对比",
    ...(process.platform === "win32"
      ? { icon: path.join(__dirname, "../build/icon.ico") }
      : process.platform === "linux"
        ? { icon: path.join(__dirname, "../build/icon.png") }
        : {}),
    autoHideMenuBar: true,
    backgroundColor: "#181818",
    show: !isSmokeTest,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      navigateOnDragDrop: false,
      webviewTag: false,
      devTools: !app.isPackaged && !isSmokeTest,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  mainWindow.webContents.on("will-navigate", (event) => {
    event.preventDefault();
  });

  mainWindow.webContents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });

  mainWindow.webContents.session.setPermissionCheckHandler(() => false);
  mainWindow.webContents.session.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false),
  );

  if (isSmokeTest) {
    mainWindow.webContents.once("did-finish-load", () => {
      console.log("IMAGE_COMPARE_ELECTRON_SMOKE_OK");
      app.quit();
    });

    mainWindow.webContents.once("did-fail-load", () => {
      app.exit(1);
    });
  }

  if (app.isPackaged || isSmokeTest) {
    mainWindow.loadFile(path.join(__dirname, "../dist-renderer/index.html"));
  } else {
    mainWindow.loadURL("http://127.0.0.1:5173");
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  configureApplicationMenu();
  createWindow();

  app.on("activate", () => {
    if (isSmokeTest) {
      return;
    }

    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
