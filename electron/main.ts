import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Busi App",
    backgroundColor: '#f9fafb',
    icon: path.join(__dirname, '../build/icon.ico'),
    titleBarStyle: 'hidden', // Add this
    titleBarOverlay: false, // Ensure standard Win buttons don't show
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Ensure full access for preload
    },
  });

  mainWindow.removeMenu();
  mainWindow.setMenu(null);

  // IPC Handlers for custom title bar
  ipcMain.on('window-minimize', () => mainWindow.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow.close());

  // In development, load from the Vite dev server
  if (isDev) {
    mainWindow.loadURL('http://localhost:5180');
    // mainWindow.webContents.openDevTools(); 
  } else {
    // In production, load the built index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
