const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Electron 32+ no longer reliably exposes File.path; use webUtils instead.
  getPathForFile: (file) => webUtils.getPathForFile(file),

  // Allow frontend to ask backend to select a folder
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
  // Allow frontend to ask backend to scan that folder
  scanDirectory: (path) => ipcRenderer.invoke('scan-directory', path),
  
  // Allow frontend to ask backend to delete a file
  deleteFile: (path) => ipcRenderer.invoke('delete-file', path)
});
