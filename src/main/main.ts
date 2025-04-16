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
import { ChildProcess, spawn } from 'child_process';

const makewindowtransparent = require('./../../assets/windows/makewindowtransparent.node');

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
let ctrlPressed = false;
let mainWindow: BrowserWindow | null = null;
let ctrlTracker: ChildProcess | any = null;

// FUNCTIONS
const initializeCtrlTracker = () => {
  const ctrlTrackerPath = path.join(RESOURCES_PATH, 'windows/listner'); // .exe on Windows
  const ctrlTracker = spawn(ctrlTrackerPath);

  ctrlTracker.stdout.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg === 'ctrl-down' && !ctrlPressed) {
      ctrlPressed = true;
    } else if (msg === 'ctrl-up') {
      ctrlPressed = false;
    }
  });
  ctrlTracker.on('exit', (code) => {
    console.log('ctrl-listener exited with code', code);
  });
};

const trackCursorPosition = async () => {
  const interval = setInterval(() => {
    console.log('ctrlPressed', ctrlPressed);
    if (!mainWindow) return;
    if (ctrlPressed) return;

    const { x, y } = screen.getCursorScreenPoint();
    const {
      x: winX,
      y: winY,
      width: winW,
      height: winH,
    } = mainWindow.getBounds();

    // 💡 Check if the cursor is inside the window
    const isCursorInside =
      x >= winX && x <= winX + winW && y >= winY && y <= winY + winH;

    if (!isCursorInside) return; // ✅ Don't move if cursor is not hovering on the window

    const display = screen.getDisplayNearestPoint({ x, y });
    const screenBounds = display.workArea;

    let newX = winX;
    let newY = winY;

    const spaceAbove = y - screenBounds.y;
    const spaceBelow = screenBounds.y + screenBounds.height - (y + winH);
    const spaceLeft = x - screenBounds.x;
    const spaceRight = screenBounds.x + screenBounds.width - (x + winW);

    if (spaceBelow >= winH + 10) {
      newY = y + 10;
    } else if (spaceAbove >= winH + 10) {
      newY = y - winH - 10;
    }

    if (spaceRight >= winW + 10) {
      newX = x + 10;
    } else if (spaceLeft >= winW + 10) {
      newX = x - winW - 10;
    }

    // Clamp window within screen bounds
    newX = Math.max(
      screenBounds.x,
      Math.min(newX, screenBounds.x + screenBounds.width - winW),
    );
    newY = Math.max(
      screenBounds.y,
      Math.min(newY, screenBounds.y + screenBounds.height - winH),
    );

    // 🧠 Only move if position has changed
    if (newX !== winX || newY !== winY) {
      mainWindow.setPosition(newX, newY);
      // mainWindow.setBounds({ x: , y: , width: winW, height: winH });
    }
  }, 10);
};

const createWindow = async () => {
  if (mainWindow) return;
  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };
  let x = 50,
    y = 50;
  mainWindow = new BrowserWindow({
    x,
    y,
    width: 768,
    height: 480,
    skipTaskbar: true,
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

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.loadURL(resolveHtmlPath('index.html'));
  mainWindow.on('ready-to-show', () => {
    const hwndBuffer = mainWindow?.getNativeWindowHandle();
    const hwnd = hwndBuffer?.readBigUInt64LE();
    makewindowtransparent.setAffinity(hwnd);

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

app.on('before-quit', () => {
  if (ctrlTracker) {
    ctrlTracker?.kill();
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
      const hwndBuffer = mainWindow?.getNativeWindowHandle();
      const hwnd = hwndBuffer?.readBigUInt64LE();
      makewindowtransparent.setAffinity(hwnd);
    } else {
      mainWindow.minimize();
    }
  });

  // globalShortcut.register('Alt+C', () => {
  //   if (!mainWindow) return;
  //   if (clickable) {
  //     mainWindow.setIgnoreMouseEvents(false);
  //     clickable = false;
  //   } else {
  //     mainWindow.setIgnoreMouseEvents(true);
  //     clickable = true;
  //   }
  // });

  createWindow();
  initializeCtrlTracker();
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
