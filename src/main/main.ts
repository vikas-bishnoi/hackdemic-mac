import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  globalShortcut,
  session,
  screen,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { resolveHtmlPath } from './util';

const makewindowtransparent = require('./../../build/Release/makewindowtransparent.node');

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let ctrlPressed = false;
let mainWindow: BrowserWindow | null = null;
const trackCursorPosition = async () => {
  const interval = setInterval(() => {
    if (!mainWindow) return;
    if (!ctrlPressed) return;

    const { x, y } = screen.getCursorScreenPoint();

    const display = screen.getDisplayNearestPoint({ x, y });

    const screenBounds = display.workArea; // use workArea to avoid taskbar overlap

    const [winW, winH] = mainWindow.getSize();

    // Try to move the window in a direction that avoids the cursor
    let newX = mainWindow?.getBounds().x;
    let newY = mainWindow?.getBounds().y;

    const spaceAbove = y - screenBounds.y;
    const spaceBelow = screenBounds.y + screenBounds.height - y;
    const spaceLeft = x - screenBounds.x;
    const spaceRight = screenBounds.x + screenBounds.width - x;

    if (spaceBelow >= winH) {
      newY = y + 30; // move below cursor with padding
    } else if (spaceAbove >= winH) {
      newY = y - winH - 30; // move above cursor
    }

    if (spaceRight >= winW) {
      newX = x + 30; // move to the right
    } else if (spaceLeft >= winW) {
      newX = x - winW - 30; // move to the left
    }

    // Keep window within screen bounds
    newX = Math.max(
      screenBounds.x,
      Math.min(newX, screenBounds.x + screenBounds.width - winW),
    );
    newY = Math.max(
      screenBounds.y,
      Math.min(newY, screenBounds.y + screenBounds.height - winH),
    );

    mainWindow?.setBounds({ x: newX, y: newY, width: winW, height: winH });
  }, 1000);
};

const createWindow = async () => {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };
  let x = 50,
    y = 50;
  mainWindow = new BrowserWindow({
    x,
    y,

    // width: 70,
    // height: 70,
    width: 768,
    height: 480,
    skipTaskbar: true,
    frame: false, // ✅ Remove default window frame
    minimizable: false,
    transparent: true, // Optional: Make background transparent
    icon: getAssetPath('icon.png'),
    webPreferences: {
      devTools: false,
      // offscreen: true,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  // mainWindow.setVisibleOnAllWorkspaces(true); // Keep it in all virtual desktops

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    const hwndBuffer = mainWindow?.getNativeWindowHandle();
    const hwnd = hwndBuffer?.readBigUInt64LE();

    makewindowtransparent.setAffinity(hwnd);

    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

app.disableHardwareAcceleration();

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app
  .whenReady()
  .then(() => {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      // eslint-disable-next-line promise/no-callback-in-promise
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; " +
              "connect-src 'self' blob: http://localhost:8000 https://devapi.hackdemic.com wss://devapi.hackdemic.com wss://api.hackdemic.com ws://localhost:8000 https://mazic-prod-assets.s3-accelerate.amazonaws.com https://api.hackdemic.com https://mazic-dev-assets.s3.eu-west-2.amazonaws.com; " +
              "script-src 'self' 'unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "font-src 'self' data:; " +
              "frame-src 'self'; " +
              "img-src 'self' data:;" +
              "media-src 'self' blob:;",
          ],
        },
      });
    });

    globalShortcut.register('Alt+X', () => {
      if (mainWindow) mainWindow.webContents.send('capture-screenshot');
    });

    createWindow();
    trackCursorPosition();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });

    ipcMain.on('resize', (event, dimensions) => {
      mainWindow?.setSize(dimensions.width, dimensions.height);
    });
  })
  .catch(console.log);
