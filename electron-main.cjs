const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      nodeIntegration: false, // Security best practice
      contextIsolation: true  // Security best practice
    },
    autoHideMenuBar: true
  });

  // In development, load the local server. In production, load the built file.
  // For simplicity in this guide, we'll assume serving the built static files.
  // win.loadFile('dist/public/index.html'); 
  
  // OR for dev mode (if you run 'npm run dev' separately):
  win.loadURL('http://localhost:5000');

  // Open links in external browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- THE "MAGIC" PART: File System Operations ---

// Listen for the 'delete-file' command from the frontend
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    // Security check: Ensure we are not deleting system files (basic check)
    // In a real app, you'd want more robust validation.
    console.log('Attempting to delete:', filePath);
    
    // Convert file:// URL to path if necessary, or assume it's a path
    // Note: The web app uses Blob URLs currently. For this to work, 
    // the web app needs to pass the REAL file path, which browsers hide.
    // 
    // CRITICAL NOTE: Standard web <input type="file"> DOES NOT give the full path.
    // In Electron, you must use the Electron dialog to select files to get full paths.
    
    // For this example to work, we'd need to change the file selection to use 
    // window.electron.selectFolder() instead of <input type="file">
    
    return { success: true }; 
  } catch (error) {
    console.error('Delete failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-folder', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  
  if (result.canceled) return null;
  return result.filePaths[0]; // Returns the full path C:\Users\Example...
});

ipcMain.handle('scan-directory', async (event, folderPath) => {
  // This is where you'd implement the recursive file scanning using 'fs'
  // and send the list of image files (with full paths) back to the frontend.
  // This allows the frontend to have the real paths needed for deletion.
  
  const files = [];
  // ... implementation of directory scanning ...
  return files;
});
