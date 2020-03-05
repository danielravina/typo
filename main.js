const electron = require("electron");
const { clipboard, ipcMain, globalShortcut, shell } = electron;
const { menubar } = require("menubar");
const { version } = require("./package.json");
const isDev = process.env.NODE_ENV === "development";
const path = require("path");
const robot = require("robotjs");
const axios = require("axios");
const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 46;

const mb = menubar({
  preloadWindow: true,
  browserWindow: {
    resizable: true,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    },
    alwaysOnTop: true,
    show: true
  },
  index: "http://127.0.0.1:9000"
});

function hideWindow() {
  clipboard.clear();
  mb.window.hide();
  mb.app.hide();
  mb.window.webContents.send("window-hidden");
}

function changeHeight(height) {
  mb.window.setSize(DEFAULT_WIDTH, height);
}

function showWindow() {
  const text = clipboard.readText();
  if (text.length) {
    mb.window.webContents.send("clipboard-text", text);
  }
  mb.showWindow();
  mb.window.webContents.send("window-shown");
}

function toggleWindow() {
  if (mb.window.isVisible()) {
    hideWindow();
  } else {
    showWindow();
  }
}

function startOnEmoji() {
  showWindow();
  mb.window.webContents.send("set-emoji-mode");
}

mb.on("ready", () => {
  globalShortcut.register("Control+Space", toggleWindow);
  globalShortcut.register("Command+Shift+;", startOnEmoji);

  ipcMain.on("type", (e, value) => {
    clipboard.clear();
    setTimeout(() => {
      robot.typeString(value);
    }, 5);
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

  ipcMain.on("iNeedFocus", () => {
    mb.window.hide();
    mb.app.hide();
    mb.showWindow();
  });
});
