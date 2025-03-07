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
    show: false, // Don't show until ready
    backgroundColor: '#121212', // Match the animation background color
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the main app page with the startup animation overlay
  mainWindow.loadFile('index.html');
  
  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Uncomment for development tools
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

// Set app ID for Windows taskbar
app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId("com.kasimir.browser");
  }
});

// Window control event handlers
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

// Browser navigation event handlers
ipcMain.on('navigate-to-url', (event, url) => {
  // Handle URL navigation if needed
  console.log('Navigate to URL:',  url);
});

// Animation completed event
ipcMain.on('startup-animation-complete', () => {
  console.log('Startup animation completed');
});