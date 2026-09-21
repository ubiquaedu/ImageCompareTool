const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    title: "ImageDiff Pro",
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true
  });

  const indexPath = path.join(app.getAppPath(), 'dist', 'public', 'index.html');

  if (!fs.existsSync(indexPath)) {
    const message = `Application files not found:\n${indexPath}`;
    console.error(message);
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
      <html><body style="font-family: sans-serif; padding: 24px">
        <h2>ImageDiff Pro non può essere avviato</h2>
        <p>${message}</p>
        <p>Ricrea l'installer con <code>npm run dist</code>.</p>
      </body></html>
    `)}`);
  } else {
    win.loadFile(indexPath).catch((error) => {
      console.error('Unable to load application:', error);
    });
  }

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

// --- File System Operations ---

// Delete a single file from disk
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, error: 'Invalid file path' };
    }
    // Basic safety check: must be an absolute path
    if (!path.isAbsolute(filePath)) {
      return { success: false, error: 'Only absolute paths are allowed' };
    }
    fs.unlinkSync(filePath);
    console.log('Deleted:', filePath);
    return { success: true };
  } catch (error) {
    console.error('Delete failed:', filePath, error.message);
    return { success: false, error: error.message };
  }
});

// Open a native folder picker dialog
ipcMain.handle('select-folder', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Recursively scan a directory for image files
ipcMain.handle('scan-directory', async (event, folderPath) => {
  const imageExtensions = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.bmp',
    '.webp', '.tiff', '.tif', '.heic', '.heif',
    '.raw', '.cr2', '.cr3', '.nef', '.arw', '.dng',
    '.orf', '.rw2', '.pef', '.srw', '.x3f'
  ]);

  const files = [];

  function scanDir(dirPath) {
    let entries;
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch (e) {
      return; // Skip directories we can't read
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // Skip hidden files
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (imageExtensions.has(ext)) {
          try {
            const stat = fs.statSync(fullPath);
            files.push({
              name: entry.name,
              filePath: fullPath,
              size: stat.size,
              lastModified: stat.mtime.getTime()
            });
          } catch (e) {
            // Skip files we can't stat
          }
        }
      }
    }
  }

  try {
    scanDir(folderPath);
    return { files };
  } catch (error) {
    return { error: error.message };
  }
});
