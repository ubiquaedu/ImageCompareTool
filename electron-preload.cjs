const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Allow frontend to ask backend to select a folder
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
  // Allow frontend to ask backend to scan that folder
  scanDirectory: (path) => ipcRenderer.invoke('scan-directory', path),
  
  // Allow frontend to ask backend to delete a file
  deleteFile: (path) => ipcRenderer.invoke('delete-file', path)
});
