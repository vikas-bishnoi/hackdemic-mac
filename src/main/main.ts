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
import { ChildProcess, spawn } from 'child_process';
import { resolveHtmlPath } from './util';

// const makewindowtransparent = require('../../assets/windows/makewindowtransparent.node');

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

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

let clickable = false;
let mainWindow: BrowserWindow | null = null;

// FUNCTIONS

const createWindow = async () => {
  if (mainWindow) return;
  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };
  const x = 50;
  const y = 50;
  mainWindow = new BrowserWindow({
    x,
    y,
    width: 768,
    height: 480,
    skipTaskbar: true,
    alwaysOnTop: true,
    // resizable: false,
    frame: false, // ✅ Remove default window frame
    minimizable: false,
    transparent: true, // Optional: Make background transparent
    icon: getAssetPath('icon.png'),
    webPreferences: {
      devTools: false,
      // offscreen: true,
      webSecurity: true,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.setContentProtection(true);
  mainWindow.setMenu(null);
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  mainWindow.on('ready-to-show', () => {
    // const hwndBuffer = mainWindow?.getNativeWindowHandle();
    // const hwnd = hwndBuffer?.readBigUInt64LE();
    // makewindowtransparent.setAffinity(hwnd);

    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.webContents.openDevTools();
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
// -FUNCTIONS

// CONFIGURATION
app.disableHardwareAcceleration();

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
// -CONFIGURATION

app.on('before-quit', () => {
  console.log('App is quitting...');
});

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

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

  globalShortcut.register('Alt+S', () => {
    if (mainWindow) mainWindow.webContents.send('capture-screenshot');
  });

  globalShortcut.register('Alt+A', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
      // const hwndBuffer = mainWindow?.getNativeWindowHandle();
      // const hwnd = hwndBuffer?.readBigUInt64LE();
      // makewindowtransparent.setAffinity(hwnd);
    } else {
      mainWindow.minimize();
    }
  });

  globalShortcut.register('Alt+C', () => {
    if (!mainWindow) return;
    if (clickable) {
      mainWindow.setIgnoreMouseEvents(false);
      clickable = false;
    } else {
      mainWindow.setIgnoreMouseEvents(true);
      clickable = true;
    }
  });

  createWindow();
  // trackCursorPosition();
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (!mainWindow) createWindow();
  });

  ipcMain.on('resize', (event, dimensions) => {
    mainWindow?.setSize(dimensions.width, dimensions.height);
  });
  ipcMain.on('open-link', (event, url) => {
    shell.openExternal(url);
  });
  ipcMain.on('move-window', (event, { dx, dy }) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;

    const { x, y } = win.getBounds();
    win.setPosition(x + dx, y + dy);
  });
});
