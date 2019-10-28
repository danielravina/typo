const electron = require("electron");
const { clipboard, ipcMain, Menu, app, BrowserWindow, Tray, globalShortcut } = electron;
const { version } = require("./package.json");
const isDev = process.env.NODE_ENV === "development";
const path = require("path");

let tray;
let win;

function hideWindow() {
  win.hide();
  app.hide();
  win.setAlwaysOnTop(false);
  win.webContents.send("hide-window");
}

function showWindow() {
  win.show();
  app.show();
  win.setAlwaysOnTop(true);
  win.webContents.send("show-window");
}

function toggleWindow() {
  if (win.isVisible()) {
    hideWindow();
  } else {
    showWindow();
  }
}

function initTray() {
  tray = new Tray(path.join(__dirname, "cloudTemplate.png"));
  tray.setToolTip("typo");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Toggle",
        accelerator: 'Command+Control+Space',
        click: toggleWindow
      },
      { label: `typo v${version}`, enabled: false },
      { type: 'separator' },
      { label: `Quit`, click: () => app.quit() }
    ])
  );
}

function createWindow() {
  win = new BrowserWindow({
    width: 470,
    height: 70,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    },
    resizable: false,
    title: "Typo",
    maximizable: false,
    transparent: true,
    frame: false,
    show: isDev,
    center: true,
  });

  if (isDev) {
    win.loadURL("http://127.0.0.1:9000");
  } else {
    win.loadFile("./build/index.html");
  }

  win.on("closed", () => {
    win = null;
  });

  win.on("blur", () => {
    if (!isDev) hideWindow();
  });

  ipcMain.on('hide', () => {
    hideWindow();
  })

  ipcMain.on('copyClipBoard', (_, value) => {
    clipboard.writeText(value);
  })
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (win === null) createWindow();
});

app.on("ready", () => {
  createWindow();
  initTray();
  globalShortcut.register("Control+Space", toggleWindow);
});
