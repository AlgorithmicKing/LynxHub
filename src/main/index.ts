import {electronApp, is, optimizer} from '@electron-toolkit/utils';
import {app, BrowserWindow, Menu} from 'electron';
import installExtension, {REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS} from 'electron-devtools-installer';
import log from 'electron-log/main';
import updater from 'electron-updater';

import trayIconMenu from '../../resources/16x16.png?asset';
import trayIcon from '../../resources/icon.ico?asset';
import {APP_NAME} from '../cross/CrossConstants';
import AppInitializer from './Managements/AppInitializer';
import {checkForUpdate} from './Managements/AppUpdater';
import {ValidateCards} from './Managements/DataValidator';
import DialogManager from './Managements/DialogManager';
import DiscordRpcManager from './Managements/DiscordRpcManager';
import ElectronAppManager from './Managements/ElectronAppManager';
import {listenToAllChannels} from './Managements/Ipc/IpcHandler';
import ModuleManager from './Managements/ModuleManager';
import StorageManager from './Managements/Storage/StorageManager';
import TrayManager from './Managements/TrayManager';
import downloadDU from './Utilities/CalculateFolderSize/DownloadDU';

log.initialize();
Object.assign(console, log.functions);

app.commandLine.appendSwitch('disable-http-cache');

const {autoUpdater} = updater;

export const storageManager = new StorageManager();
export let appManager: ElectronAppManager;
export let trayManager: TrayManager;
export let discordRpcManager: DiscordRpcManager;
export let cardsValidator: ValidateCards;
export let moduleManager: ModuleManager;

// Remove default menu
Menu.setApplicationMenu(null);

function setupApp() {
  appManager = new ElectronAppManager();

  downloadDU();

  app.whenReady().then(onAppReady);

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      appManager.startLoading();
      appManager.startApp();
    }
  });
}

async function onAppReady() {
  electronApp.setAppUserModelId(APP_NAME);

  appManager.startLoading();

  trayManager = new TrayManager(trayIcon, trayIconMenu);
  discordRpcManager = new DiscordRpcManager();
  cardsValidator = new ValidateCards();
  moduleManager = new ModuleManager();

  await moduleManager.createServer();

  // Install browser developer extensions
  if (is.dev) await installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS]);

  listenToAllChannels();

  DialogManager();

  checkForUpdate();

  appManager.startApp();

  appManager.onReadyToShow = handleAppReadyToShow;
}

function handleAppReadyToShow() {
  handleTaskbarStatus();
  handleStartupBehavior();
  discordRpcManager.start();
  setLoginItemSettings();
  cardsValidator.checkAndWatch();
  autoUpdater.checkForUpdates();
}

function handleTaskbarStatus() {
  const {taskbarStatus} = storageManager.getData('app');
  const mainWindow = appManager.getMainWindow();

  switch (taskbarStatus) {
    case 'taskbar-tray':
      trayManager.createTrayIcon();
      mainWindow?.setSkipTaskbar(false);
      break;
    case 'taskbar':
      trayManager.destroyTrayIcon();
      mainWindow?.setSkipTaskbar(false);
      break;
    case 'tray':
      trayManager.createTrayIcon();
      mainWindow?.setSkipTaskbar(true);
      break;
    case 'tray-minimized':
      trayManager.destroyTrayIcon();
      mainWindow?.setSkipTaskbar(false);
      break;
  }
}

function handleStartupBehavior() {
  const {startMinimized} = storageManager.getData('app');
  const mainWindow = appManager.getMainWindow();

  if (startMinimized) {
    mainWindow?.minimize();
  } else {
    mainWindow?.show();
  }
}

function setLoginItemSettings() {
  const {systemStartup} = storageManager.getData('app');
  app.setLoginItemSettings({openAtLogin: systemStartup});
}

function initApp() {
  if (!storageManager.getData('app').initialized) {
    new AppInitializer().createInitializer();
  } else {
    setupApp();
  }
}

initApp();
