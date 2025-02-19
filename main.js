const { app, BrowserWindow, nativeTheme, screen } = require('electron')
const path = require('path');

// Ativa o hot-reloading
require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
  });



const createWindow = () => {
    nativeTheme.themeSource = 'dark'
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const win = new BrowserWindow({

        minHeight: 600,
        minWidth: 800,
        maxHeight: height,
        maxWidth: width,

        width: 800,
        height: 600,
        icon: './src/public/img/icon.jpg',
        resizable: true,
        autoHideMenuBar: true,
        //titleBarStyle: 'hidden'
    })

    win.loadFile('./src/views/index.html')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})