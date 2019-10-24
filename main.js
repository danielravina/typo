const electron = require("electron");
const { app, BrowserWindow, Tray, globalShortcut } = electron;

const isDev = process.env.NODE_ENV === "development";
const path = require("path");

let tray;
let win;

function getWindowPosition() {
  const windowBounds = win.getBounds();
  const trayBounds = tray.getBounds();

  const x = Math.round(
    trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2
  );
  const y = Math.round(trayBounds.y + trayBounds.height);

  return { x, y };
}

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

function moveToTray() {
  const position = getWindowPosition();
  win.setPosition(position.x, position.y);
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
  tray.on("click", toggleWindow);
}

function createWindow() {
  win = new BrowserWindow({
    width: 370,
    height: 65,
    // webPreferences: {
    //   preload: path.join(__dirname, "preload.js")
    // }
    resizable: false,
    title: "typeo",
    maximizable: false,
    transparent: true,
    frame: false,
    show: isDev
  });

  if (isDev) {
    win.loadURL("http://localhost:3000");
  } else {
    win.loadFile("./public/index.html");
  }

  win.on("closed", () => {
    win = null;
  });

  win.on("blur", () => {
    if (!isDev) hideWindow();
  });

  win.webContents.on("did-finish-load", () => {
    moveToTray();
  });
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
  globalShortcut.register("Command+Control+Space", toggleWindow);
});
