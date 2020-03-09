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
  systemPreferences
} = electron;
const clipboard = require("electron-clipboard-extended");
const { version } = require("./package.json");
const path = require("path");
const robot = require("robotjs");
const axios = require("axios");

const isDev = process.env.NODE_ENV === "development";
const DEFAULT_WIDTH = 450;
const DEFAULT_HEIGHT = 61;

let win;
let tray;

if (isDev) app.dock.hide();

systemPreferences.isTrustedAccessibilityClient(true);

function hideWindow() {
  win.hide();
  app.hide();
  changeHeight(DEFAULT_HEIGHT);
  win.webContents.send("window-hidden");
}

function changeHeight(height) {
  win.setSize(DEFAULT_WIDTH, height, true);
}

function showWindow() {
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
  // tray.setToolTip("anem");
  tray.on("click", toggleWindow);
}

function createWindow() {
  win = new BrowserWindow({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false
    },
    resizable: true,
    maximizable: false,
    transparent: true,
    frame: false,
    show: true,
    center: true
  });

  win.loadURL("http://127.0.0.1:9000");

  globalShortcut.register("Control+Space", toggleWindow);

  ipcMain.on("type", (e, value) => {
    setTimeout(() => {
      robot.typeString(value);
    }, 50);
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

    const match = data.match(/url\?q=([a-zA-z:\/\/\.-]*)/);
    const link = match[1];

    shell.openExternal(link);
  });

  ipcMain.on("hide", () => {
    hideWindow();
  });

  ipcMain.on("changeHeight", (e, height) => {
    changeHeight(height);
  });

  clipboard
    .on("text-changed", () => {
      let clicks = 1;
      globalShortcut.register("Command+C", () => {
        clicks++;
        if (clicks === 3) {
          showWindow();
          const text = clipboard.readText();
          if (text.length) {
            win.webContents.send("clipboard-text", text);
          }
          globalShortcut.unregister("Command+C");
        }

        setTimeout(() => {
          globalShortcut.unregister("Command+C");
        }, 500);
      });

      setTimeout(() => {
        globalShortcut.unregister("Command+F");
      }, 1000);
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
