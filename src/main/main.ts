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

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

const appPath = app.isPackaged
  ? path.join(process.resourcesPath)
  : path.join(process.cwd(), 'src', 'resources');

const binaryPath = path.join(
  appPath,
  'assets',
  'windows',
  'tesseract',
  'tesseract.exe',
);
const dataPath = path.join(
  appPath,
  'assets',
  'windows',
  'tesseract',
  'tessdata',
);

let mainWindow: BrowserWindow | null = null;

const config = {
  lang: 'eng',
  oem: 1,
  psm: 6,
  binary: binaryPath,
  config: [`--tessdata-dir`, dataPath],
};

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const createWindow = async () => {
  // if (isDebug) {
  //   await installExtensions();
  // }

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

  let dx = 1; // change in x
  let dy = 1; // change in y

  const winWidth = 768;
  const winHeight = 480;

  // const interval = setInterval(() => {
  //   const display = screen.getPrimaryDisplay();
  //   const screenWidth = display.workArea.width;
  //   const screenHeight = display.workArea.height;

  //   // Bounce on edges
  //   if (x + winWidth >= screenWidth || x <= 0) {
  //     dx = -dx;
  //   }
  //   if (y + winHeight >= screenHeight || y <= 0) {
  //     dy = -dy;
  //   }

  //   x += dx;
  //   y += dy;

  //   mainWindow?.setPosition(x, y);
  // }, 10);

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  // mainWindow.setVisibleOnAllWorkspaces(true); // Keep it in all virtual desktops

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    const hwndBuffer = mainWindow?.getNativeWindowHandle();
    const hwnd = hwndBuffer?.readBigUInt64LE();

    console.log('mainWindow', hwnd);
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
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
    ipcMain.on('save-screenshot', (event, dataUrl) => {
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');
      const picturesPath = app.getPath('pictures'); // or use 'documents', 'desktop', etc.
      const fileName = `dsa-question-${Date.now()}.png`;
      const fullPath = path.join(picturesPath, fileName);
    });

    ipcMain.on('resize', (event, dimensions) => {
      console.log(dimensions);
      // mainWindow?.setSize(dimensions.width, dimensions.height);
      mainWindow?.setSize(dimensions.width, dimensions.height);
      console.log(dimensions);
    });
  })
  .catch(console.log);

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
