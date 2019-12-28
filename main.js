const electron = require("electron");
const { clipboard, ipcMain, globalShortcut, shell } = electron;
const { menubar } = require("menubar");
const { version } = require("./package.json");
const isDev = process.env.NODE_ENV === "development";
const path = require("path");
const robot = require("robotjs");
const axios = require("axios");

const mb = menubar({
  preloadWindow: true,
  browserWindow: {
    width: 321,
    height: 235,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    },
    alwaysOnTop: true
  },
  index: "http://127.0.0.1:9000"
});

function hideWindow() {
  mb.window.hide();
  mb.app.hide();
  mb.window.webContents.send("window-hidden");
}

function showWindow() {
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

mb.on("ready", () => {
  globalShortcut.register("Control+Space", toggleWindow);

  ipcMain.on("copyClipBoard", (_, value) => {
    clipboard.writeText(value);
    setTimeout(() => {
      robot.typeString(value);
    }, 50);
  });

  ipcMain.on("openExternal", async (_, { value, source }) => {
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
});
