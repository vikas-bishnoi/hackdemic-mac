// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
const electronHandler = {
  onCaptureSS: (callback: any) =>
    ipcRenderer.on('capture-screenshot', (event) => {
      callback();
    }),
  onProcessImageData: (callback: any) =>
    ipcRenderer.on('process-image-data', (event) => {
      callback();
    }),
  onAuthenticate: (callback: any) =>
    ipcRenderer.on('on-authenticate', (event) => {
      callback();
    }),
  resize: (width: number, height: number) =>
    ipcRenderer.send('resize', { width, height }),

  moveWindow: (newPosition: any) =>
    ipcRenderer.send('move-window', newPosition),

  saveScreenshot: (screenshot: any) =>
    ipcRenderer.send('save-screenshot', screenshot),

  openLink: (url: string) => ipcRenderer.send('open-link', url),
};

contextBridge.exposeInMainWorld('electronAPI', electronHandler);

export type ElectronHandler = typeof electronHandler;
