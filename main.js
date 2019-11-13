const electron = require("electron");
const {
  clipboard,
  ipcMain,
  Menu,
  app,
  BrowserWindow,
  Tray,
  globalShortcut
} = electron;

const { version } = require("./package.json");
const isDev = process.env.NODE_ENV === "development";
const path = require("path");
const robot = require("robotjs");
const axios = require("axios");
// const cheerio = require("cheerio");
let tray;
let win;
let extraWin;

function hideWindow() {
  win.hide();
  app.hide();
  win.setAlwaysOnTop(false);
  win.webContents.send("window-hidden");
  win.setVisibleOnAllWorkspaces(false);
  win.setFullScreenable(true);
}

function showWindow() {
  win.show();
  app.show();
  win.webContents.send("window-shown");
  win.setAlwaysOnTop(true, "floating");
  win.setVisibleOnAllWorkspaces(true);
  win.setFullScreenable(false);
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
        accelerator: "Command+Control+Space",
        click: toggleWindow
      },
      { label: `typo v${version}`, enabled: false },
      { type: "separator" },
      { label: `Quit`, click: () => app.quit() }
    ])
  );
}

function createWindow() {
  win = new BrowserWindow({
    width: 520,
    height: 185,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    },
    resizable: true,
    title: "typo",
    maximizable: false,
    transparent: true,
    frame: false,
    show: isDev,
    center: true
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

  ipcMain.on("hide", () => {
    hideWindow();
  });

  ipcMain.on("copyClipBoard", (_, value) => {
    clipboard.writeText(value);
    setTimeout(() => {
      robot.typeString(value);
    }, 50);
  });

  ipcMain.on("openExternal", async (_, { value, source }) => {
    const { data } = await axios(
      `https://www.google.ca/search?q=site%3A${source}+${value}&sourceid=chrome&ie=UTF-8`
    );

    const match = data.match(/url\?q=([a-zA-z:\/\/\.-]*)/);
    const link = match[1];

    if (!extraWin) {
      extraWin = new BrowserWindow({
        parent: win,
        width: 520,
        height: 520,
        resizable: false,
        maximizable: false,
        minimizable: false,
        movable: false,
        title: "Loading..."
        transparent: true,
        frame: false
      });
      extraWin.on("close", e => {
        e.preventDefault();
        extraWin.hide();
        extraWin.loadFile("./");
      });
    } else {
      extraWin.loadURL("");
    }

    const [x, y] = win.getPosition();
    const [width, height] = win.getSize();

    extraWin.show();
    extraWin.loadURL(link);
    extraWin.setPosition(x, y + height, false);
    extraWin.on();
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (win === null) createWindow();
});

app.on("ready", () => {
  app.dock.hide();
  createWindow();
  initTray();
  globalShortcut.register("Control+Space", toggleWindow);
});
