/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, globalShortcut } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { resolveHtmlPath } from './util';
const tesseract = require('node-tesseract-ocr');
const fs = require('fs');

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

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

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

  mainWindow = new BrowserWindow({
    x: 1250,
    y: 50,

    width: 728,
    height: 448,
    // skipTaskbar: true,
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

async function runOCR(imagePath: string) {
  console.log('HELOR', imagePath);

  try {
    const text = await tesseract.recognize(imagePath, config);
    console.log('text', text);
    return text;
  } catch (err) {
    console.error('OCR failed:', err);
    return '';
  }
}

app.disableHardwareAcceleration();

app
  .whenReady()
  .then(() => {
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
