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
  saveScreenshot: (screenshot: any) =>
    ipcRenderer.send('save-screenshot', screenshot),
};

contextBridge.exposeInMainWorld('electronAPI', electronHandler);

export type ElectronHandler = typeof electronHandler;
