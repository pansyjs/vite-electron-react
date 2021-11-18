import { app, BrowserWindow } from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { join } from 'path';
import { URL } from 'url';

const env = import.meta.env;
const isDevelopment = env.MODE === 'development';
const isProduction = env.MODE === 'production';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

if (isDevelopment) {
  require('electron-debug')();
}

let mainWindow: BrowserWindow | null = null;

if (isProduction) {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [installer['REACT_DEVELOPER_TOOLS']];

  return installer
    .default(extensions, {
      loadExtensionOptions: {
        allowFileAccess: true,
      },
      forceDownload,
    })
    .catch(console.log);
};

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs.js'),
    },
  });

  const pageUrl = isDevelopment
    ? (env.VITE_DEV_SERVER_URL as string)
    : new URL('../renderer/index.html', 'file://' + __dirname).toString();

  mainWindow.loadURL(pageUrl);

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  new AppUpdater();
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();

    app.on('activate', () => {
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
