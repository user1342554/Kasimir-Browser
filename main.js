const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hidden',
    frame: false,
    icon: path.join(__dirname, 'assets', 'favicon.ico'),
    show: false, // Fenster erst anzeigen, wenn es bereit ist
    backgroundColor: '#121212', // Hintergrundfarbe (passt zur Startup-Animation)
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Lade die Hauptseite der App
  mainWindow.loadFile('index.html');
  
  // Zeige das Fenster, wenn es bereit ist
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Für die Entwicklung: DevTools öffnen (optional)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Setze App-ID für die Windows-Taskleiste
app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId("com.kasimir.browser");
  }
});

// Fenstersteuerung über IPC
ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

// Browser-Navigationsereignis
ipcMain.on('navigate-to-url', (event, url) => {
  console.log('Navigate to URL:', url);
});

// Ereignis, wenn die Startup-Animation abgeschlossen ist
ipcMain.on('startup-animation-complete', () => {
  console.log('Startup animation completed');
});
