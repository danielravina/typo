const electron = require("electron");
const defaultMenu = require("electron-default-menu");
const {
  Menu,
  ipcMain,
  globalShortcut,
  shell,
  app,
  BrowserWindow,
  Tray,
  systemPreferences,
} = electron;
const clipboard = require("electron-clipboard-extended");
// const { version } = require("./package.json");
const path = require("path");
const robot = require("robotjs");
const axios = require("axios");
const { WINDOW_WIDTH } = require("./src/shared/constants");

const isDev = process.env.NODE_ENV === "development";

const DEFAULT_HEIGHT = 61;
let output = null;
let win;
let tray;
let clip = {};

app.dock.hide();

systemPreferences.isTrustedAccessibilityClient(true);

function hideWindow() {
  win.hide();
  app.hide();
  changeHeight(DEFAULT_HEIGHT);
  win.webContents.send("window-hidden");
}

function changeHeight(height) {
  win.setSize(WINDOW_WIDTH, height);
}

function showWindow() {
  const text = clipboard.readText();
  const age = Date.now() - clip.ts;

  if (age < 3000) {
    win.webContents.send("clipboard-text", text);
    setTimeout(() => {
      clipboard.clear();
    }, 3000);
  }

  win.setAlwaysOnTop(true, "floating");
  win.setVisibleOnAllWorkspaces(true);
  win.setFullScreenable(false);
  win.show();
  win.webContents.send("window-shown");
}

function toggleWindow() {
  if (win.isVisible()) {
    hideWindow();
  } else {
    showWindow();
  }
}

function initTray() {
  tray = new Tray(path.join(__dirname, "assets", "IconTemplate.png"));
  tray.on("click", toggleWindow);
}

function createWindow() {
  win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: DEFAULT_HEIGHT,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
    },
    resizable: true,
    maximizable: false,
    transparent: true,
    frame: false,
    show: true,
    center: true,
    fullScreenable: true,
  });

  if (isDev) {
    win.loadURL("http://127.0.0.1:9000");
  } else {
    win.loadURL("https://d3pc5r88536fha.cloudfront.net");
  }

  win.on("blur", () => {
    if (output) {
      robot.typeString(output);
      output = null;
    }
    if (!isDev) {
      hideWindow();
    }
  });

  ipcMain.on("type", (e, value) => {
    output = value;
  });

  ipcMain.on("openExternal", async (e, { value, source }) => {
    if (source === "google.com") {
      shell.openExternal(
        `https://www.google.com/search?q=${value}&sourceid=chrome&ie=UTF-8`
      );
      return;
    }

    const { data } = await axios(
      `https://www.google.com/search?q=site%3A${source}+${value}&sourceid=chrome&ie=UTF-8`
    );

    const match = data.match(/url\?q=([a-zA-z:/.-]*)/);
    const link = match[1];

    shell.openExternal(link);
  });

  ipcMain.on("hide", () => {
    hideWindow();
  });

  ipcMain.on("changeHeight", (e, height) => {
    changeHeight(height);
  });

  globalShortcut.register("Ctrl+Space", toggleWindow);

  clipboard
    .on("text-changed", () => {
      let currentText = clipboard.readText();
      clip = {
        text: currentText,
        ts: Date.now(),
      };
    })
    .startWatching();
}

// my favourite movie is avengers endgame
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("ready", () => {
  const menu = defaultMenu(app, shell);
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  createWindow();
  initTray();
});
