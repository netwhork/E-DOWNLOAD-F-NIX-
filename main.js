const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { pref } = require('./test.js');
const { initDatabase, getAllEmpresas } = require('./database.js');

// Armazena a referência da janela principal
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
      height: 1500,
      width: 900,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js')
        }
    });

    // Carrega a página inicial
    mainWindow.loadFile('index.html');

    // Opcional: Abrir DevTools para depuração
    // mainWindow.webContents.openDevTools();
}
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});