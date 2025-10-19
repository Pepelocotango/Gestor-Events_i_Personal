const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const { formatDateDDMM } = require('./shared/dateUtils.cjs');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { google } = require('googleapis');
const url = require('url');
const http = require('http');

app.disableHardwareAcceleration();

// --- LOGS DE SESSIÓ PER DESENVOLUPAMENT ---
const LOGS_DIR = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
function rotateLogs() {
  const files = fs.readdirSync(LOGS_DIR)
    .filter(f => f.startsWith('app-') && f.endsWith('.log'))
    .sort((a, b) => fs.statSync(path.join(LOGS_DIR, b)).mtime - fs.statSync(path.join(LOGS_DIR, a)).mtime);
  while (files.length >= 20) {
    fs.unlinkSync(path.join(LOGS_DIR, files.pop()));
  }
}
const sessionLogFile = path.join(LOGS_DIR, `app-${Date.now()}.log`);
rotateLogs();
function logToFile(...args) {
  const filteredArgs = args.filter(arg => arg !== undefined);

  const formattedArgs = filteredArgs.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, (key, value) => {
          if (key.startsWith('_')) return undefined;
          return value;
        }, 2);
      } catch (e) {
        return `[Objecte no serialitzable: ${e.message}. Claus: ${Object.keys(arg).join(', ')}]`;
      }
    }
    return String(arg);
  });

  const msg = `[${new Date().toISOString()}] ${formattedArgs.join(' ')}\n`;
  fs.appendFileSync(sessionLogFile, msg);
  process.stdout.write(msg);
}
console.log = logToFile;
console.error = logToFile;
console.warn = logToFile;

console.log('**************************************************');
console.log('*** INICIANT PROCÉS PRINCIPAL DE L\'APLICACIÓ ***');
console.log('**************************************************');
console.log('Sessió Electron iniciada. Tots els logs d\'aquesta sessió s\'emmagatzemen a:', sessionLogFile);

const APP_ID = 'com.gestorevents.app';
app.setAppUserModelId(APP_ID);

const CONFIG_DIR = app.getPath('userData');
const DATA_DIR = CONFIG_DIR;
const SESSION_FILE = path.join(CONFIG_DIR, 'session.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const GOOGLE_TOKENS_PATH = path.join(CONFIG_DIR, 'google-tokens.json');
const GOOGLE_CONFIG_PATH = path.join(CONFIG_DIR, 'google-config.json');

const APP_CALENDAR_BASE_NAME = "Gestor d'Esdeveniments (App)";

// ---  SINGLE INSTANCE LOCK ---
// Aquest codi assegura que només una instància de l'aplicació s'executi alhora.
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Si no aconseguim el candau, significa que una altra instància ja s'està executant.
  // En aquest cas, tanquem aquesta nova instància immediatament.
  app.quit();
} else {
  // Si aconseguim el candau, som la primera instància.
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Aquest esdeveniment es dispara quan un usuari intenta obrir una segona instància.
    // El que fem és posar la finestra de la nostra instància (la primera) en primer pla.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

let mainWindow;
let isQuitting = false;
let isAuthenticating = false;
let googleAuthClient;
let googleCredentials;
let googleServiceAccountClient;

// REFACCIÓ: La gestió de fitxers ara es fa amb handlers d'IPC específics cridats des del renderer.
// Aquesta funció ja no és necessària.

ipcMain.handle('open-file-dialog', async () => {
  console.log("[IPC_IN] Rebut 'open-file-dialog'.");
  if (!mainWindow) return { success: false, message: 'No hi ha cap finestra activa.' };

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
      title: 'Obrir document',
    });

    if (result.canceled || !result.filePaths.length) {
      return { success: false, canceled: true };
    }

    const filePath = result.filePaths[0];
    console.log(`Fitxer seleccionat per obrir: ${filePath}`);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error en el diàleg per obrir fitxer:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  console.log(`[IPC_IN] Rebut 'read-file' per a: ${filePath}`);
  if (!filePath) return { success: false, message: 'filePath no pot ser buit.' };
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    console.error(`Error llegint el fitxer ${filePath}:`, error);
    return { success: false, message: `No s'ha pogut llegir el fitxer: ${error.message}` };
  }
});

ipcMain.handle('save-file', async (event, { filePath, data }) => {
  console.log(`[IPC_IN] Rebut 'save-file' per a: ${filePath}`);
  if (!filePath) return { success: false, message: 'filePath no pot ser buit.' };
  try {
    fs.writeFileSync(filePath, data, 'utf8');
    console.log(`Fitxer desat correctament a: ${filePath}`);

    // Create backup after successful save
    await createBackup(filePath);
    await cleanupOldBackups(filePath);

    return { success: true };
  } catch (error) {
    console.error(`Error desant el fitxer a ${filePath}:`, error);
    return { success: false, message: `No s'ha pogut desar el fitxer: ${error.message}` };
  }
});

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Funció auxiliar per obtenir la ruta relativa a la carpeta de l'usuari
function getRelativePath(absolutePath) {
  if (!absolutePath) return '';
  const homeDir = os.homedir();
  if (absolutePath.startsWith(homeDir)) {
    return absolutePath.replace(homeDir, '~');
  }
  return absolutePath;
}

const addDaysISO = (dateStr, days) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

function ensureDirectoriesExist() {
  [CONFIG_DIR, DATA_DIR, BACKUP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function loadGoogleCredentials() {
  try {
    const credentialsPath = path.join(__dirname, 'google-credentials.json');
    if (!fs.existsSync(credentialsPath)) return false;

    const content = fs.readFileSync(credentialsPath);
    googleCredentials = JSON.parse(content).installed;
    googleAuthClient = new google.auth.OAuth2(googleCredentials.client_id, googleCredentials.client_secret);
    
    if (fs.existsSync(GOOGLE_TOKENS_PATH)) {
      const tokens = JSON.parse(fs.readFileSync(GOOGLE_TOKENS_PATH));
      googleAuthClient.setCredentials(tokens);
    }
  } catch (err) {
    console.error('Error carregant credencials de Google:', err);
    return false;
  }
  return true;
}

async function loadServiceAccountCredentials() {
  try {
    const serviceAccountPath = path.join(__dirname, 'service-account.json');
    if (!fs.existsSync(serviceAccountPath)) {
      console.warn('ADVERTÈNCIA: El fitxer service-account.json no es troba. Les funcionalitats avançades de Google Calendar estaran desactivades.');
      return false;
    }

    const keys = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    googleServiceAccountClient = await new google.auth.GoogleAuth({
  credentials: {
    client_email: keys.client_email,
    private_key: keys.private_key,
  },
  scopes: ['https://www.googleapis.com/auth/calendar'],
  }).getClient();

    console.log("Client del Compte de Servei de Google inicialitzat i autoritzat correctament.");
    return true;

  } catch (err) {
    console.error('Error carregant les credencials del Compte de Servei de Google:', err);
    dialog.showErrorBox(
        'Error d\'Autenticació del Compte de Servei',
        `No s'ha pogut autenticar amb el compte de servei de Google. Comprova la validesa del teu fitxer "service-account.json" i la configuració a Google Cloud Console.\n\nError: ${err.message}`
    );
    googleServiceAccountClient = null;
    return false;
  }
}

function checkWritePermissions(dir) {
  try {
    const testFile = path.join(dir, '.write-test');
    fs.writeFileSync(testFile, '');
    fs.unlinkSync(testFile);
    return true;
  } catch (error) {
    return false;
  }
}

function getAlternativeDirectory(baseDir) {
  return path.join(app.getPath('userData'), baseDir);
}




function loadSessionData() {
  if (!SESSION_FILE) return {};
  try {
    if (fs.existsSync(SESSION_FILE)) {
      return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error carregant les dades de la sessió:', error);
  }
  return {};
}

async function saveDataWithErrorHandling(filePath, data) {
  if (!filePath) {
    throw new Error("filePath no està definit.");
  }
  try {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    if (!checkWritePermissions(dirPath)) throw new Error(`No hi ha permisos d'escriptura a ${dirPath}`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Dades desades correctament a ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error guardant a ${filePath}:`, error);
    dialog.showMessageBoxSync({ type: 'error', title: 'Error guardant dades', message: `No s'han pogut guardar les dades a ${filePath}\\nError: ${error.message}` });
    throw error;
  }
}

async function saveSessionData(newData) {
  const currentData = loadSessionData();
  const mergedData = { ...currentData, ...newData };
  return saveDataWithErrorHandling(SESSION_FILE, mergedData);
}

async function createBackup(sourceFilePath) {
  if (!sourceFilePath || !BACKUP_DIR) return false;
  try {
    if (fs.existsSync(sourceFilePath)) {
      if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
      if (!checkWritePermissions(BACKUP_DIR)) throw new Error(`No hi ha permisos d'escriptura a ${BACKUP_DIR}`);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sourceFileName = path.basename(sourceFilePath, '.json'); // Get filename without extension
      const backupFile = path.join(BACKUP_DIR, `backup-${sourceFileName}-${timestamp}.json`);

      fs.copyFileSync(sourceFilePath, backupFile);
      console.log(`Còpia de seguretat creada a: ${backupFile}`);
      return true;
    }
  } catch (error) {
    console.error('Error creant còpia de seguretat:', error);
  }
  return false;
}
async function cleanupOldBackups(sourceFilePath) {
  const MAX_BACKUPS_TO_KEEP = 5;
  if (!fs.existsSync(BACKUP_DIR) || !sourceFilePath) {
    return;
  }
  
  const sourceFileName = path.basename(sourceFilePath, '.json');
  const backupPrefix = `backup-${sourceFileName}-`;

  try {
    console.log(`Netejant backups antics per a ${sourceFileName}...`);
    const backupFiles = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith(backupPrefix) && file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        try {
          const stats = fs.statSync(filePath);
          return { name: file, time: stats.mtime.getTime() };
        } catch (statError) {
          console.error(`No s'ha pogut obtenir informació del fitxer ${file}:`, statError);
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.time - a.time);

    if (backupFiles.length > MAX_BACKUPS_TO_KEEP) {
      console.log(`Trobats ${backupFiles.length} backups. Conservant els ${MAX_BACKUPS_TO_KEEP} més recents.`);
      const backupsToDelete = backupFiles.slice(MAX_BACKUPS_TO_KEEP);
      
      backupsToDelete.forEach(backup => {
        try {
          fs.unlinkSync(path.join(BACKUP_DIR, backup.name));
          console.log(`Backup eliminat: ${backup.name}`);
        } catch (unlinkError) {
          console.error(`Error eliminant el backup ${backup.name}:`, unlinkError);
        }
      });
    } else {
      console.log(`Trobats ${backupFiles.length} backups. No cal neteja.`);
    }
  } catch (error) {
    console.error('Error durant la neteja de backups:', error);
  }
}

function loadGoogleConfigFromFile() {
    if (!fs.existsSync(GOOGLE_CONFIG_PATH)) return null;
    try {
        return JSON.parse(fs.readFileSync(GOOGLE_CONFIG_PATH, 'utf8'));
    } catch(err) {
        console.error('Error llegint el fitxer de configuració de Google:', err);
        return null;
    }
}

async function findOrCreateAppCalendar(calendarService, userEmail, calendarSuffix) {
  try {
    const suffix = calendarSuffix ? ` - ${calendarSuffix}` : '';
    const finalCalendarName = `${APP_CALENDAR_BASE_NAME}${suffix}`;
    let calendarId;
    let wasNewlyCreated = false; // Per saber si cal notificar

    // Pas 1: Comprovar si ja existeix un calendari amb aquest nom
    console.log("SA: Buscant calendaris existents per evitar duplicats...");
    const calendarList = await calendarService.calendarList.list();
    const existingCalendar = calendarList.data.items.find(cal => cal.summary === finalCalendarName);

    if (existingCalendar) {
      console.log(`SA: Trobat calendari existent amb nom "${finalCalendarName}". ID: ${existingCalendar.id}.`);
      calendarId = existingCalendar.id;
    } else {
      console.log(`SA: No s'ha trobat cap calendari existent. Creant un de nou amb el nom: "${finalCalendarName}"`);
      const newCalendar = await calendarService.calendars.insert({
        requestBody: {
          summary: finalCalendarName,
          description: "Calendari gestionat per l'aplicació Gestor d'Esdeveniments.",
          timeZone: 'Europe/Madrid'
        }
      });
      calendarId = newCalendar.data.id;
      wasNewlyCreated = true; // Marquem que s'ha creat ara
      console.log(`SA: Calendari creat amb ID: ${calendarId}`);
    }

    // Pas 2: Compartir el calendari (nou o existent) amb l'usuari
    if (!userEmail) {
      throw new Error("L'email de l'usuari és necessari per compartir el calendari.");
    }

    console.log(`SA: Assegurant que el calendari ${calendarId} està compartit amb ${userEmail}...`);
    await calendarService.acl.insert({
      calendarId: calendarId,
      sendNotifications: wasNewlyCreated, // Només notifiquem si el calendari és nou
      requestBody: {
        role: 'reader',
        scope: { type: 'user', value: userEmail },
      },
    });

    console.log('SA: Permisos del calendari verificats/actualitzats amb èxit.');
    return calendarId;

  } catch (error) {
    console.error("SA: Error en findOrCreateAppCalendar:", error.message, error.response?.data);
    throw error;
  }
}

async function createWindow() {
  console.log('[Startup] Iniciant createWindow...');
  ensureDirectoriesExist();
  console.log('[Startup] Directoris assegurats.');
  loadGoogleCredentials(); 
  console.log('[Startup] Credencials de Google carregades (si existeixen).');
  await loadServiceAccountCredentials();
  console.log('[Startup] Credencials del compte de servei carregades (si existeixen).');
  const sessionData = loadSessionData();
  console.log('[Startup] Dades de la sessió anterior carregades.');

  mainWindow = new BrowserWindow({
    width: sessionData.width || 1200,
    height: sessionData.height || 800,
    x: sessionData.x,
    y: sessionData.y,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
console.log('[Startup] Mode de desenvolupament:', isDev);
console.log('[Startup] NODE_ENV:', process.env.NODE_ENV);
console.log('[Startup] app.isPackaged:', app.isPackaged);

if (isDev) {
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  console.log('[Startup] Carregant des del servidor de desenvolupament:', devUrl);
  mainWindow.loadURL(devUrl).catch(err => {
    console.error('Error loading dev URL:', devUrl, err);
    dialog.showErrorBox('Error de Desenvolupament', `No s'ha pogut carregar ${devUrl}: ${err.message}`);
  });
} else {
  const indexPath = path.resolve(__dirname, 'dist', 'index.html');
  console.log('[Startup] Carregant des del fitxer de producció:', indexPath);
  mainWindow.loadFile(indexPath).catch(err => {
    console.error('Error loading production index file:', indexPath, err);
    dialog.showErrorBox('Error de Càrrega', `No s'ha pogut carregar l'aplicació: ${error.message}`);
  });
}


  const template = [
    {
      label: 'Arxiu',
      submenu: [
        { label: 'Carregar Tot', click: () => mainWindow.webContents.send('menu-action', 'load-all') },
        { label: 'Guardar Tot', click: () => mainWindow.webContents.send('menu-action', 'save-all') },
        { label: 'Carregar Material', click: () => mainWindow.webContents.send('menu-action', 'load-material') },
        { label: 'Començar de Zero', click: () => mainWindow.webContents.send('menu-action', 'hard-reset') },
        { type: 'separator' },
        { label: 'Carregar Persones', click: () => mainWindow.webContents.send('menu-action', 'load-people') },
        { label: 'Guardar Persones', click: () => mainWindow.webContents.send('menu-action', 'save-people') },
        { label: 'Guardar Material', click: () => mainWindow.webContents.send('menu-action', 'save-material') },
        { type: 'separator' },
        {
          label: 'Configuració Google Calendar',
          submenu: [
            { label: 'Sincronitzar', click: () => mainWindow.webContents.send('menu-action', 'sync-google') },
            { label: 'Configurar', click: () => mainWindow.webContents.send('menu-action', 'config-google') },
            { label: 'Connectar amb Google', click: () => mainWindow.webContents.send('menu-action', 'connect-google') },
          ]
        },
        { type: 'separator' },
        { label: 'Tema Clar/Fosc', click: () => mainWindow.webContents.send('menu-action', 'toggle-theme') },
        { type: 'separator' },
        { label: 'Sortir', accelerator: 'CmdOrCtrl+Q', click: () => { app.quit(); } }
      ]
    },
    {
      label: 'Veure',
      submenu: [
        { role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' },
        { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' }, { role: 'togglefullscreen' }
      ]
    }
  ];

  // const menu = Menu.buildFromTemplate(template);
  // Menu.setApplicationMenu(menu);
  console.log('[Startup] Menú de l\'aplicació configurat (actualment desactivat en favor de la UI).');

  // >>> CANVI PRINCIPAL EN LA LÒGICA DE TANCAMENT <<<
  mainWindow.on('close', (event) => {
    console.log(`[Exit Flow] Event 'close' rebut a la finestra. isQuitting: ${isQuitting}`);
    if (!isQuitting) {
      event.preventDefault(); // Prevenim que la finestra es tanqui directament
      app.quit(); // Iniciem el flux de sortida de l'aplicació
    }
  });
}

app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    // Open external links in the default browser
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
  // Prevent navigation to external links within the app
  contents.on('will-navigate', (event, url) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
});

app.on('before-quit', async (event) => {
  console.log(`[Exit Flow] Event 'before-quit' rebut. isQuitting: ${isQuitting}`);
  if (isQuitting) return; // Evita bucles de tancament

  event.preventDefault(); // Prevenim la sortida immediata per donar control al frontend

  // Desar l'estat de la finestra (mida, posició) per a la propera sessió
  if (mainWindow && !mainWindow.isDestroyed()) {
    const windowBounds = mainWindow.getBounds();
    await saveSessionData({
      width: windowBounds.width,
      height: windowBounds.height,
      x: windowBounds.x,
      y: windowBounds.y
    });

    console.log('[Exit Flow] Estat de la finestra desat. Enviant senyal de confirmació al frontend...');
    // Envia el senyal al frontend perquè gestioni la lògica de desat/backup
    mainWindow.webContents.send('confirm-quit-signal');

  } else {
    // Si no hi ha finestra, no cal esperar el frontend.
    console.log('[Exit Flow] No hi ha finestra principal, sortint directament.');
    isQuitting = true;
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


console.log('[Startup] Configurant gestors de IPC...');

ipcMain.handle('quit-application', () => {
  console.log("[Exit Flow] Rebut 'quit-application'. Sortint de l'aplicació.");
  isQuitting = true;
  app.quit();
});
ipcMain.on('log-message', (event, message, data) => {
  logToFile(`[FRONTEND] ${message}`, data);
});

ipcMain.handle('load-app-data', async () => {
  // REFACCIÓ: Aquesta funció ara només serveix per indicar a l'App que pot començar.
  // La càrrega de dades es gestiona a través de les accions de l'usuari (Obrir, Recents).
  console.log("[IPC_IN] Rebut 'load-app-data'. L'aplicació començarà amb un estat buit.");
  return null;
});

ipcMain.handle('get-recent-files', async () => {
  console.log("[IPC_IN] Rebut 'get-recent-files'.");
  const sessionData = loadSessionData();
  return sessionData.recentFiles || [];
});

ipcMain.handle('add-recent-file', async (event, filePath) => {
  console.log(`[IPC_IN] Rebut 'add-recent-file' per a: ${filePath}`);
  if (!filePath) return { success: false, message: 'filePath no pot ser buit.' };

  try {
    const sessionData = loadSessionData();
    let recentFiles = sessionData.recentFiles || [];

    // Eliminar duplicats i moure el fitxer al principi
    recentFiles = recentFiles.filter(f => f !== filePath);
    recentFiles.unshift(filePath);

    // Limitar la llista a 10 fitxers
    const MAX_RECENT_FILES = 10;
    if (recentFiles.length > MAX_RECENT_FILES) {
      recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
    }

    await saveSessionData({ recentFiles });
    console.log("Fitxers recents actualitzats:", recentFiles);
    return { success: true, recentFiles };
  } catch (error) {
    console.error('Error afegint a fitxers recents:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('sync-with-google', async (event, { localData, targetCalendarId }) => {
  console.log(`[IPC_IN] Iniciant 'sync-with-google' cap a ${targetCalendarId}.`);
  if (!googleServiceAccountClient) {
    console.error("SYNC ERROR: El client del compte de servei de Google no està inicialitzat.");
    return { success: false, message: 'El client del compte de servei de Google no està inicialitzat. Assegura\'t que el fitxer "service-account.json" existeix i és correcte.' };
  }
  let config = loadGoogleConfigFromFile();
  if (!config?.userEmail) {
    console.error("SYNC ERROR: No s'ha trobat l'email de l'usuari a la configuració.");
    return { success: false, message: 'No s\'ha trobat l\'email de l\'usuari. Si us plau, connecta\'t a Google primer.' };
  }
  if (!targetCalendarId) {
    console.error("SYNC ERROR: No s'ha proporcionat un targetCalendarId.");
    return { success: false, message: "No s'ha especificat cap calendari de destinació per a la sincronització." };
  }
  
  const calendar = google.calendar({ version: 'v3', auth: googleServiceAccountClient });
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  const targetCalendar = config.managedAppCalendars?.find(c => c.id === targetCalendarId);
  if (!targetCalendar) {
    return { success: false, message: "El calendari de destinació no es troba a la llista de calendaris gestionats." };
  }
  const finalCalendarName = targetCalendar.name;

  // Pas 5: Gestió de calendaris eliminats
  try {
    console.log(`SA: Verificant existència del calendari a Google: ${targetCalendarId}`);
    await calendar.calendars.get({ calendarId: targetCalendarId });
    console.log('SA: El calendari existeix.');
  } catch (err) {
    if (err.code === 404) {
      console.warn(`SA: El calendari amb ID ${targetCalendarId} no s'ha trobat. Ha estat eliminat per l'usuari.`);

      // Eliminar el calendari orfe de la configuració
      config.managedAppCalendars = config.managedAppCalendars.filter(c => c.id !== targetCalendarId);
      if (config.activeAppCalendarId === targetCalendarId) {
        config.activeAppCalendarId = config.managedAppCalendars.length > 0 ? config.managedAppCalendars[0].id : null;
      }
      fs.writeFileSync(GOOGLE_CONFIG_PATH, JSON.stringify(config, null, 2));

      // Retornar error específic al frontend
      return { success: false, code: 'CALENDAR_NOT_FOUND', message: `El calendari "${finalCalendarName}" ja no existeix a Google. S'ha eliminat de la llista.` };
    } else {
      console.error('Error de xarxa o desconegut verificant el calendari:', err.message, err.response?.data);
      const customMessage = err.code === 403
        ? "Permís denegat per accedir al calendari. Revisa els permisos del Compte de Servei."
        : `No s'ha pogut connectar a Google. Comprova la teva connexió. (${err.message})`;
      return { success: false, message: customMessage };
    }
  }

  // DIÀLEG DE CONFIRMACIÓ
  const choice = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Sí, sincronitzar', 'Cancel·lar'],
    defaultId: 1,
    cancelId: 1,
    title: 'Confirmar Sincronització',
    message: `Estàs a punt de sobreescriure el calendari "${finalCalendarName}" a Google Calendar.`,
    detail: 'Totes les dades d\'aquest calendari a Google s\'esborraran i se substituiran per les dades actuals de l\'aplicació. Qualsevol canvi que hagis fet directament a Google es perdrà. Aquesta acció és irreversible. Vols continuar?',
  });

  if (choice.response !== 0) {
    console.log("Sincronització cancel·lada per l'usuari.");
    return { success: false, message: 'Sincronització cancel·lada.' };
  }

  try {
    // --- PREPARACIÓ PER AL PROGRÉS ---
    const eventsListRes = await calendar.events.list({ calendarId: targetCalendarId, maxResults: 2500 });
    const eventsToDelete = eventsListRes.data.items || [];
    const localFramesToUpload = localData.eventFrames || [];

    const totalProgressSteps = eventsToDelete.length + localFramesToUpload.length;
    let currentProgressStep = 0;

    const sendProgress = (message) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('sync-progress', {
          current: currentProgressStep,
          total: totalProgressSteps,
          message: message,
        });
      }
    };

    // FASE 1: BUIDAR COMPLETAMENT EL CALENDARI
    console.log(`Buidant el calendari de l'app a Google: ${targetCalendarId}`);
    if (eventsToDelete.length > 0) {
      console.log(`Trobats ${eventsToDelete.length} esdeveniments per eliminar...`);
      for (const event of eventsToDelete) {
        currentProgressStep++;
        const progressMessage = `Eliminant ${currentProgressStep} de ${totalProgressSteps}: "${event.summary || 'Esdeveniment sense títol'}"`;
        console.log(progressMessage);
        sendProgress(progressMessage);
        try {
          await calendar.events.delete({ calendarId: targetCalendarId, eventId: event.id });
          await delay(200);
        } catch (err) {
          if (err.code !== 404 && err.code !== 410) console.error(`Error eliminant l'esdeveniment "${event.summary}":`, err.message);
        }
      }
    }

    // FASE 2: PUJAR TOTS ELS ESDEVENIMENTS DES DE L'APP LOCAL
    console.log(`Pujant ${localFramesToUpload.length} esdeveniments locals al calendari de l'app...`);
    
    for (const localFrame of localFramesToUpload) {
      currentProgressStep++;
      const progressMessage = `Pujant ${currentProgressStep} de ${totalProgressSteps}: "${localFrame.name}"`;
      console.log(progressMessage);
      sendProgress(progressMessage);

      const getPersonGroupById = (id) => localData.peopleGroups.find(p => p.id === id);

      // --- CONSTRUCCIÓ DE LA DESCRIPCIÓ ENRIQUIDA ---
      let descriptionParts = [];
      if (localFrame.generalNotes) {
        descriptionParts.push(localFrame.generalNotes);
      }

      // --- NOVA SECCIÓ: ASSIGNACIONS ---
      const frameAssignments = localData.assignments?.filter(a => a.eventFrameId === localFrame.id) || [];
      if (frameAssignments.length > 0) {
        const assignmentLines = [];
        for (const assignment of frameAssignments) {
          const person = getPersonGroupById(assignment.personGroupId);
          if (!person) continue;

          let statusLine = '';
          const statusPrefixes = { "Sí": "[✓]", "No": "[X]", "Pendent": "[?]", "Mixt": "[~]" };
          const prefix = statusPrefixes[assignment.status] || `[${assignment.status}]`;

          if (assignment.status !== 'Mixt' || !assignment.dailyStatuses) {
            statusLine = `${prefix} ${person.name} (Estat: ${assignment.status})`;
          } else {
            const groupedByStatus = assignment.dailyStatuses.reduce((acc, daily) => {
              if (!acc[daily.status]) acc[daily.status] = [];
              acc[daily.status].push(formatDateDDMM(daily.date));
              return acc;
            }, {});

            const details = Object.entries(groupedByStatus)
              .map(([status, dates]) => `${status} [${dates.join(', ')}]`)
              .join(' ');

            statusLine = `${prefix} ${person.name} (Estat: Mixt - ${details})`;
          }
          assignmentLines.push(statusLine);
        }

        if (assignmentLines.length > 0) {
          descriptionParts.push(`--- ASSIGNACIONS ---\n${assignmentLines.join('\n')}`);
        }
      }

      // Secció de Personal
      if (localFrame.techSheet?.technicalProviders?.length > 0) {
        const personnelList = localFrame.techSheet.technicalProviders.map(provider => {
          const person = getPersonGroupById(provider.personGroupId);
          const roles = provider.roles.map(r => `  - ${r.quantity}x ${r.role}${r.notes ? ` (${r.notes})` : ''}`).join('\n');
          return `${person ? person.name : 'Proveïdor desconegut'}:\n${roles}`;
        }).join('\n');
        descriptionParts.push(`--- PERSONAL TÈCNIC ---\n${personnelList}`);
      }

      // Secció d'Horaris
      if (localFrame.techSheet?.assemblySchedule?.length > 0) {
        const scheduleList = localFrame.techSheet.assemblySchedule.map(item => `- ${item.time}: ${item.description}`).join('\n');
        descriptionParts.push(`--- HORARIS ---\n${scheduleList}`);
      }

      // Altres detalls
      let otherDetails = [];
      if (localFrame.techSheet?.companyContact) otherDetails.push(`Contacte Cia: ${localFrame.techSheet.companyContact}`);
      if (localFrame.techSheet?.observations) otherDetails.push(`Observacions: ${localFrame.techSheet.observations}`);
      if (otherDetails.length > 0) {
        descriptionParts.push(`--- DETALLS ---\n${otherDetails.join('\n')}`);
      }

      const eventResource = {
        summary: localFrame.name,
        description: descriptionParts.join('\n\n'),
        location: localFrame.place || '',
        start: { date: localFrame.startDate },
        end: { date: addDaysISO(localFrame.endDate, 1) },
      };

      try {
        const newGoogleEvent = await calendar.events.insert({
          calendarId: targetCalendarId,
          requestBody: eventResource,
        });
        localFrame.googleEventId = newGoogleEvent.data.id;
        localFrame.googleCalendarId = targetCalendarId;
        localFrame.lastModified = newGoogleEvent.data.updated;
        localFrame.lastSync = new Date().toISOString();
        console.log(`  -> Esdeveniment "${localFrame.name}" pujat amb èxit. ID de Google: ${newGoogleEvent.data.id}`);
      } catch (err) {
        console.error(`Error creant "${localFrame.name}" a Google:`, err.message, err.response?.data);
      }
      await delay(250);
    }

    // FASE 3: ACTUALITZAR L'ACTIVE CALENDAR ID I DESAR LA CONFIGURACIÓ
    console.log(`Sincronització amb ${targetCalendarId} completada. Establint-lo com a calendari actiu.`);
    config.activeAppCalendarId = targetCalendarId;
    fs.writeFileSync(GOOGLE_CONFIG_PATH, JSON.stringify(config, null, 2));

    // FASE 4: RETORNAR LES DADES LOCALS ACTUALITZADES
    console.log("SYNC: Sincronització completada amb èxit.");
    return { success: true, message: 'Sincronització completada amb èxit.', data: localData };

  } catch (error) {
    console.error('Error crític durant la sincronització unidireccional:', error.message, error.response?.data);
    const customMessage = error.code === 403
      ? "Permís denegat durant la sincronització. Assegura't que el Compte de Servei té permisos d'Editor sobre el calendari de l'aplicació."
      : `Error de sincronització: ${error.message}`;
    return { success: false, message: customMessage };
  }
});

ipcMain.handle('google-auth-start', async () => {
  console.log("[IPC_IN] Iniciant 'google-auth-start'.");

  if (isAuthenticating) {
    console.warn("AUTH WARN: Ja hi ha un procés d'autenticació en curs.");
    return { success: false, message: "Ja hi ha un procés d'autenticació en curs. Si us plau, espera que acabi." };
  }

  if (!googleAuthClient) {
    console.error("AUTH ERROR: googleAuthClient no inicialitzat.");
    return { success: false, message: "El client d'autenticació de Google no s'ha iniciat correctament." };
  }

  isAuthenticating = true;

  return new Promise((resolve) => {
    const server = http.createServer();
    let state; // Declarar 'state' en un àmbit superior

    const closeServerAndResolve = (result) => {
      if (server.listening) {
        server.close();
      }
      isAuthenticating = false; // Alliberem el bloqueig
      resolve(result);
    };

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const redirectUri = `http://localhost:${port}`;
      googleAuthClient.redirectUri = redirectUri;

      state = generateId(); // Assignar valor a 'state'
      const authUrl = googleAuthClient.generateAuthUrl({
        access_type: 'offline', prompt: 'consent',
        scope: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/calendar.readonly'
        ],        
        state: state,
      });
      
      console.log(`Servidor d'autenticació escoltant al port ${port}. Obrint URL d'autenticació.`);
      require('electron').shell.openExternal(authUrl);
    });

    server.on('request', async (req, res) => {
      const qs = new url.URL(req.url, 'http://localhost').searchParams;
      const code = qs.get('code');
      const receivedState = qs.get('state');

      if (receivedState !== state) {
        console.error("Error d'estat CSRF: l'estat rebut no coincideix.");
        res.writeHead(400);
        res.end('<h1>Error: Petició invàlida (CSRF detectat)</h1>');
        req.socket.destroy();
        closeServerAndResolve({ success: false, message: 'Error de validació de l\'estat (CSRF).' });
        return;
      }
      
      if (!code) {
        console.warn("Callback d'autenticació rebut sense codi.");
        res.end('<h1>Esperant codi...</h1>');
        return;
      }
      
      console.log("Callback rebut amb codi d'autorització. Obtenint tokens...");

      try {
        const { tokens } = await googleAuthClient.getToken(code);
        googleAuthClient.setCredentials(tokens);
        fs.writeFileSync(GOOGLE_TOKENS_PATH, JSON.stringify(tokens));
        console.log("Tokens de Google obtinguts i desats correctament.");

        // NOU PAS: Obtenir l'email de l'usuari
        const people = google.people({ version: 'v1', auth: googleAuthClient });
        const profile = await people.people.get({
            resourceName: 'people/me',
            personFields: 'emailAddresses',
        });

        const primaryEmail = profile.data.emailAddresses?.find(e => e.metadata?.primary)?.value;
        if (!primaryEmail) {
            throw new Error("No s'ha pogut obtenir l'adreça de correu principal de l'usuari.");
        }
        console.log(`Correu de l'usuari obtingut: ${primaryEmail}`);

        // NOU PAS: Desar l'email i inicialitzar la configuració
        let config = loadGoogleConfigFromFile() || {};
        config.userEmail = primaryEmail;
        // Inicialitzem l'estructura de dades nova si no existeix
        if (!config.managedAppCalendars) config.managedAppCalendars = [];
        if (config.activeAppCalendarId === undefined) config.activeAppCalendarId = null;
        if (!config.selectedCalendarIds) config.selectedCalendarIds = [];

        fs.writeFileSync(GOOGLE_CONFIG_PATH, JSON.stringify(config, null, 2));
        console.log("Correu de l'usuari desat i estructura de configuració inicialitzada.");

        mainWindow.webContents.send('google-auth-success');
        res.end('<h1>Autenticació completada!</h1><p>Pots tancar aquesta pestanya.</p>');
        req.socket.destroy();
        closeServerAndResolve({ success: true });

      } catch (e) {
        console.error("Error en el callback d'autenticació:", e.message, e.response?.data);
        mainWindow.webContents.send('google-auth-error', e.message);
        res.writeHead(500);
        res.end('<h1>Error d\'autenticació</h1>');
        req.socket.destroy();
        closeServerAndResolve({ success: false, message: e.message });
      }
    });

    server.on('error', (err) => {
      console.error("Error del servidor d'autenticació:", err);
      dialog.showErrorBox('Error de Servidor', `No s'ha pogut iniciar el servidor d'autenticació: ${err.message}`);
      closeServerAndResolve({ success: false, message: err.message });
    });
  });
});

ipcMain.handle('load-google-config', async () => {
  console.log("[IPC_IN] Rebut 'load-google-config'.");
  return loadGoogleConfigFromFile();
});

ipcMain.handle('save-google-config', async (event, config) => {
  console.log("[IPC_IN] Rebut 'save-google-config' amb:", config);
  try {
    const existingConfig = loadGoogleConfigFromFile() || {};
    // La llista de calendaris gestionats només es modifica a través de 'create' i 'delete'.
    // Aquesta funció només desa l'estat de la selecció de l'usuari.
    const mergedConfig = { ...existingConfig, ...config };

    fs.writeFileSync(GOOGLE_CONFIG_PATH, JSON.stringify(mergedConfig, null, 2));
    console.log("Configuració de Google desada correctament:", mergedConfig);
    return { success: true, data: mergedConfig };
  } catch (err) {
    console.error('Error desant configuració de Google:', err);
    return { success: false, message: err.message };
  }
});

ipcMain.handle('google-get-calendar-list', async () => {
  console.log("[IPC_IN] Rebut 'google-get-calendar-list'.");
  try {
    if (!googleAuthClient || !googleAuthClient.credentials.access_token) {
        throw new Error('No autenticat. Si us plau, connecta\'t a Google primer.');
    }
    const calendar = google.calendar({ version: 'v3', auth: googleAuthClient });
    const res = await calendar.calendarList.list();
    return {
      success: true,
      calendars: res.data.items?.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        backgroundColor: cal.backgroundColor,
        primary: cal.primary,
      })) || [],
    };
  } catch (error) {
    console.error('Error obtenint la llista de calendaris:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-google-events', async () => {
  console.log("[IPC_IN] Rebut 'get-google-events'.");
  try {
    const config = loadGoogleConfigFromFile();
    if (!config?.selectedCalendarIds?.length) {
      console.log("No hi ha calendaris de Google seleccionats per mostrar, retornant llista buida.");
      return { success: true, events: [] };
    }
    if (!googleAuthClient?.credentials?.access_token) {
      throw new Error('No autenticat amb Google.');
    }
    
    const calendar = google.calendar({ version: 'v3', auth: googleAuthClient });
    const timeMin = new Date(); timeMin.setMonth(timeMin.getMonth() - 6);
    const timeMax = new Date(); timeMax.setMonth(timeMax.getMonth() + 6);
    const allEvents = [];

    const calendarListResponse = await calendar.calendarList.list();
    const availableCalendars = calendarListResponse.data.items || [];
    const managedIds = new Set(config.managedAppCalendars?.map(c => c.id) || []);

    console.log(`Iniciant la cerca d'esdeveniments per a ${config.selectedCalendarIds.length} calendaris.`);
    for (const calendarId of config.selectedCalendarIds) {
      try {
        const res = await calendar.events.list({
          calendarId: calendarId,
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        });
        
        const calendarInfo = availableCalendars.find(c => c.id === calendarId);
        let color = calendarInfo?.backgroundColor || '#2196F3';
        if (managedIds.has(calendarId)) {
            color = calendarId === config.activeAppCalendarId ? '#D32F2F' : '#E67C73';
        }

        const events = res.data.items?.map(event => ({
          id: event.id,
          title: event.summary,
          start: event.start.dateTime || event.start.date,
          end: event.end.dateTime || event.end.date,
          allDay: !!event.start.date,
          backgroundColor: color,
          borderColor: color,
          extendedProps: { type: 'google', calendarId: calendarId }
        })) || [];
        
        console.log(`  -> Trobat(s) ${events.length} esdeveniment(s) per al calendari ${calendarId}.`);
        allEvents.push(...events);

      } catch (loopError) {
        console.error(`Error obtenint esdeveniments del calendari ${calendarId}:`, loopError);
      }
    }
    console.log(`Total d'esdeveniments de Google recuperats: ${allEvents.length}.`);
    return { success: true, events: allEvents };
  } catch (error) {
    console.error('Error general a get-google-events:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('google-get-event-details', async (event, { calendarId, eventId }) => {
  console.log(`[IPC_IN] Rebut 'google-get-event-details' per a: calendarId=${calendarId}, eventId=${eventId}`);
  try {
    if (!googleAuthClient || !googleAuthClient.credentials.access_token) {
        throw new Error('No autenticat. Si us plau, connecta\'t a Google primer.');
    }
    if (!calendarId || !eventId) {
      throw new Error('Es requereix calendarId i eventId.');
    }

    const calendar = google.calendar({ version: 'v3', auth: googleAuthClient });

    const res = await calendar.events.get({
      calendarId: calendarId,
      eventId: eventId,
    });

    console.log(`  -> Detalls de l'esdeveniment obtinguts amb èxit per a ${eventId}.`);
    return { success: true, event: res.data };

  } catch (error) {
    console.error(`Error obtenint detalls de l'esdeveniment de Google ${eventId}:`, error);
    const errorMessage = error.response?.data?.error?.message || error.message;
    return { success: false, message: `No s'han pogut obtenir els detalls de l'esdeveniment: ${errorMessage}` };
  }
});

let hasShownUncaughtExceptionDialog = false;
process.on('uncaughtException', (error) => {
  const errorMsg = `Excepció no capturada: ${JSON.stringify(error, null, 2)}\n`;
  
  try {
    if (fs.existsSync(sessionLogFile)) {
      fs.appendFileSync(sessionLogFile, `[${new Date().toISOString()}] ${errorMsg}`);
    }
  } catch (fsError) {
    process.stderr.write(`No s'ha pogut escriure l'error al fitxer de log: ${fsError}\n`);
    process.stderr.write(errorMsg);
  }

  if (!hasShownUncaughtExceptionDialog) {
    hasShownUncaughtExceptionDialog = true;
    dialog.showErrorBox('Error Inesperat', `S'ha produït un error no controlat: ${error.message}\n\nL'aplicació es tancarà.`);
    setTimeout(() => app.exit(1), 500);
  }
});

ipcMain.handle('factory-reset', async () => {
  console.log("[IPC_IN] Rebut 'factory-reset'.");
  console.log("Iniciant Restauració de Fàbrica...");
  
  let success = true;
  let messages = [];

  const eliminarFitxerDeFormaSegura = (filePath, fileNameForMessage) => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        messages.push(`${fileNameForMessage} eliminat.`);
        console.log(`${fileNameForMessage} eliminat: ${filePath}`);
      } catch (err) {
        success = false;
        messages.push(`Error eliminant ${fileNameForMessage}: ${err.message}`);
        console.error(`Error eliminant ${fileNameForMessage} (${filePath}):`, err);
      }
    } else {
      messages.push(`${fileNameForMessage} no existia.`);
      console.log(`${fileNameForMessage} no existia: ${filePath}`);
    }
  };

  eliminarFitxerDeFormaSegura(GOOGLE_TOKENS_PATH, `Fitxer de tokens de Google (${path.basename(GOOGLE_TOKENS_PATH)})`);
  eliminarFitxerDeFormaSegura(GOOGLE_CONFIG_PATH, `Fitxer de configuració de Google (${path.basename(GOOGLE_CONFIG_PATH)})`);
  eliminarFitxerDeFormaSegura(SESSION_FILE, `Fitxer de sessió (${path.basename(SESSION_FILE)})`);

  if (googleAuthClient) {
    googleAuthClient.setCredentials(null);
    console.log("Credencials de googleAuthClient en memòria netejades.");
    messages.push("Credencials de Google en memòria netejades.");
  }
  
  if (success) {
    console.log("Reset de fàbrica del backend completat.");
    return { success: true, message: `Reset completat:\n${messages.join('\n')}` };
  } else {
    console.error("El reset de fàbrica ha fallat en alguns passos.");
    return { success: false, message: `El reset de fàbrica ha fallat:\n${messages.join('\n')}` };
  }
});

ipcMain.handle('show-unsaved-changes-dialog', async (event, { message, buttons }) => {
  if (!mainWindow) return { response: buttons.length - 1 }; // Cancel·lar per defecte
  console.log("[IPC_IN] Mostrant diàleg de sortida personalitzat.");

  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: buttons,
    defaultId: 0,
    cancelId: buttons.length - 1, // L'últim botó sempre és 'Cancel·la'
    title: 'Tancar aplicació', // Títol de la finestra del diàleg
    message: message, // El missatge dinàmic rebut del frontend
  });

  console.log(`[IPC_OUT] Opció de diàleg seleccionada: ${result.response}`);
  // El frontend ara és responsable de gestionar l'índex directament.
  return { response: result.response };
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const { title, defaultPath, filters, data } = options;
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (!focusedWindow) {
    return { success: false, message: 'No hi ha cap finestra activa.' };
  }

  const result = await dialog.showSaveDialog(focusedWindow, {
    title,
    defaultPath,
    filters,
    properties: ['showOverwriteConfirmation']
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  try {
    const buffer = Buffer.from(data);
    fs.writeFileSync(result.filePath, buffer);

    // Create backup after successful save
    await createBackup(result.filePath);
    await cleanupOldBackups(result.filePath);

    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('Error desant el fitxer:', error);
    return { success: false, message: `Error en desar el fitxer: ${error.message}` };
  }
});

ipcMain.handle('google-disconnect', async () => {
  console.log("[IPC_IN] Rebut 'google-disconnect'.");
  try {
    const config = loadGoogleConfigFromFile();

    if (config?.managedAppCalendars?.length > 0 && googleServiceAccountClient) {
      const calendar = google.calendar({ version: 'v3', auth: googleServiceAccountClient });
      console.log(`Eliminant ${config.managedAppCalendars.length} calendaris de l'app de Google...`);
      for (const cal of config.managedAppCalendars) {
        try {
          console.log(`  -> Eliminant ${cal.name} (${cal.id})`);
          await calendar.calendars.delete({ calendarId: cal.id });
        } catch (err) {
          if (err.code === 404 || err.code === 410) {
            console.warn(`El calendari ${cal.name} (${cal.id}) no s'ha trobat (potser ja estava eliminat).`);
          } else {
            console.error(`Error eliminant el calendari ${cal.name}:`, err.message);
            dialog.showMessageBox(mainWindow, {
              type: 'warning',
              title: 'Avís de Desconnexió',
              message: `No s'ha pogut eliminar el calendari "${cal.name}". Potser hauràs d'esborrar-lo manualment des de Google Calendar.`,
            });
          }
        }
      }
    } else {
      console.log("No hi ha calendaris gestionats per eliminar, o el client de servei no està disponible.");
    }

    if (googleAuthClient && googleAuthClient.credentials.access_token) {
        await googleAuthClient.revokeCredentials();
        console.log("Tokens de l'usuari revocats correctament.");
    }

    const eliminarFitxer = (filePath, fileName) => {
      if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Fitxer local eliminat: ${fileName}`);
      }
    };

    eliminarFitxer(GOOGLE_TOKENS_PATH, 'google-tokens.json');
    eliminarFitxer(GOOGLE_CONFIG_PATH, 'google-config.json');

    if (googleAuthClient) {
      googleAuthClient.setCredentials(null);
    }

    return { success: true, message: 'Desconnexió de Google completada.' };
  } catch (err) {
    console.error("Error durant la desconnexió de Google:", err.message);
    return { success: false, message: `S'ha produït un error durant la desconnexió: ${err.message}` };
  }
});

ipcMain.handle('create-new-app-calendar', async (event, suffix) => {
    console.log(`[IPC_IN] Rebut 'create-new-app-calendar' amb sufix: "${suffix}"`);
    if (!googleServiceAccountClient) {
        return { success: false, message: 'El client del compte de servei de Google no està inicialitzat.' };
    }

    const config = loadGoogleConfigFromFile();
    console.log("Configuració de Google actual carregada:", config);

    if (!config) {
        return { success: false, message: 'El fitxer de configuració de Google no existeix. Si us plau, connecta\'t a Google primer.' };
    }
    if (!config.userEmail) {
        return { success: false, message: 'No s\'ha trobat l\'email de l\'usuari. Si us plau, connecta\'t a Google primer.' };
    }

    const finalSuffix = suffix.trim();
    const finalCalendarName = `${APP_CALENDAR_BASE_NAME}${finalSuffix ? ` - ${finalSuffix}` : ''}`;

    if (config.managedAppCalendars?.some(cal => cal.name === finalCalendarName)) {
        return { success: false, message: `Ja existeix un calendari gestionat amb el nom "${finalCalendarName}".` };
    }

    try {
        const calendar = google.calendar({ version: 'v3', auth: googleServiceAccountClient });
        const newCalendarId = await findOrCreateAppCalendar(calendar, config.userEmail, finalSuffix);

        if (config.managedAppCalendars?.some(cal => cal.id === newCalendarId)) {
            console.warn(`S'ha intentat crear un calendari que ja existeix i està gestionat: ID ${newCalendarId}`);
            return { success: false, message: `El calendari resultant ("${finalCalendarName}") ja existeix i està gestionat per l'aplicació. No es pot afegir un duplicat.` };
        }

        const newCalendarObject = {
            id: newCalendarId,
            name: finalCalendarName,
            suffix: finalSuffix,
        };

        config.managedAppCalendars = [...(config.managedAppCalendars || []), newCalendarObject];
        config.activeAppCalendarId = newCalendarId;

        fs.writeFileSync(GOOGLE_CONFIG_PATH, JSON.stringify(config, null, 2));

        console.log(`Nou calendari de l'app creat i afegit a la configuració:`, newCalendarObject);
        return { success: true, data: { managedAppCalendars: config.managedAppCalendars, activeAppCalendarId: config.activeAppCalendarId } };

    } catch (error) {
        console.error("Error creant el nou calendari de l'app:", error);
        return { success: false, message: `No s'ha pogut crear el calendari: ${error.message}` };
    }
});

ipcMain.handle('get-session-data', async () => {
  return loadSessionData();
});

ipcMain.handle('save-session-data', async (event, { key, value }) => {
  if (!key) {
    console.error('Error: "key" és necessari per a desar dades de sessió.');
    return { success: false, message: 'La clau no pot ser buida.' };
  }
  try {
    await saveSessionData({ [key]: value });
    return { success: true };
  } catch (error) {
    console.error(`Error desant la clau de sessió "${key}":`, error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('delete-app-calendar', async (event, calendarIdToDelete) => {
  console.log(`[IPC_IN] Rebut 'delete-app-calendar' per a l'ID: ${calendarIdToDelete}`);

  if (!googleServiceAccountClient) {
    return { success: false, message: 'El client del compte de servei de Google no està inicialitzat.' };
  }

  if (!calendarIdToDelete) {
    return { success: false, message: "No s'ha proporcionat cap ID de calendari per eliminar." };
  }

  const config = loadGoogleConfigFromFile();
  if (!config?.managedAppCalendars?.some(c => c.id === calendarIdToDelete)) {
      return { success: false, message: "El calendari no es troba a la llista de calendaris gestionats." };
  }

  try {
    const calendar = google.calendar({ version: 'v3', auth: googleServiceAccountClient });
    console.log(`Eliminant el calendari de Google: ${calendarIdToDelete}`);
    await calendar.calendars.delete({ calendarId: calendarIdToDelete });
    console.log('Calendari eliminat correctament de Google.');
  } catch (err) {
    if (err.code === 404 || err.code === 410) {
      console.warn(`El calendari ${calendarIdToDelete} no s'ha trobat a Google (potser ja estava eliminat).`);
    } else {
      console.error("Error eliminant el calendari de Google:", err.message, err.response?.data);
      const message = err.code === 403
        ? "No s'ha pogut eliminar el calendari de Google per falta de permisos."
        : "No s'ha pogut eliminar el calendari de Google.";
      return { success: false, message: message };
    }
  }

  config.managedAppCalendars = config.managedAppCalendars.filter(c => c.id !== calendarIdToDelete);

  if (config.activeAppCalendarId === calendarIdToDelete) {
      config.activeAppCalendarId = config.managedAppCalendars.length > 0 ? config.managedAppCalendars[0].id : null;
  }

  if (config.selectedCalendarIds) {
    config.selectedCalendarIds = config.selectedCalendarIds.filter(id => id !== calendarIdToDelete);
  }

  fs.writeFileSync(GOOGLE_CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log('Calendari eliminat de la configuració local.');

  return { success: true, message: 'El calendari ha estat eliminat correctament.', data: { managedAppCalendars: config.managedAppCalendars, activeAppCalendarId: config.activeAppCalendarId } };
});

app.whenReady().then(() => {
  console.log('[Startup] App està llesta, cridant a createWindow...');
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('trigger-menu-action', (event, action) => {
  const focusedWindow = BrowserWindow.getFocusedWindow();

  // Per a accions de la finestra, necessitem una finestra enfocada.
  // Les accions de l'app (com 'quit') o les que depenen de mainWindow poden funcionar igualment.
  if (!focusedWindow && !['quit', 'load-all', 'load-material', 'load-people'].includes(action)) {
    console.warn(`S'ha rebut l'acció de menú "${action}" però no hi ha cap finestra enfocada.`);
    return;
  }

  switch (action) {
    // Accions de càrrega de fitxers (ara gestionades pel renderer)
    case 'load-all':
    case 'load-material':
    case 'load-people':
      // Simplement reenviem l'acció al renderer, que conté la lògica completa.
      if (mainWindow) {
        mainWindow.webContents.send('menu-action', action);
      }
      break;

    // Control de l'aplicació
    case 'quit':
      app.quit();
      break;

    // Controls de la vista (usant la finestra enfocada)
    case 'reload':
      focusedWindow.webContents.reload();
      break;
    case 'forceReload':
      focusedWindow.webContents.reloadIgnoringCache();
      break;
    case 'toggleDevTools':
      focusedWindow.webContents.toggleDevTools();
      break;
    case 'resetZoom':
      focusedWindow.webContents.setZoomLevel(0);
      break;
    case 'zoomIn':
      // Per evitar un zoom excessiu, limitem el nivell
      focusedWindow.webContents.setZoomLevel(focusedWindow.webContents.getZoomLevel() + 0.5);
      break;
    case 'zoomOut':
      focusedWindow.webContents.setZoomLevel(focusedWindow.webContents.getZoomLevel() - 0.5);
      break;
    case 'togglefullscreen':
      focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
      break;

    // Altres accions es redirigeixen al procés de renderització (com abans)
    default:
      if (mainWindow) {
        mainWindow.webContents.send('menu-action', action);
      }
      break;
  }
});