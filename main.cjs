const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { google } = require('googleapis');
const url = require('url');
const http = require('http');
const log = require('electron-log');

// --- CONFIGURACIÓ DE LOGS AMB ELECTRON-LOG ---
log.transports.file.fileName = 'main.log';
log.transports.file.maxSize = 1048576; // 1 MB

log.transports.file.archiveLogFn = (oldLogFile) => {
  const logDir = path.dirname(oldLogFile.path);
  const archiveName = `main.${Date.now()}.log`;
  const archivePath = path.join(logDir, archiveName);
  try {
    fs.renameSync(oldLogFile.path, archivePath);
    const MAX_ARCHIVES = 5;
    const files = fs.readdirSync(logDir);
    const logArchives = files
      .filter(f => f.startsWith('main.') && f.endsWith('.log'))
      .sort((a, b) => {
        const timeA = parseInt(a.split('.')[1] || '0');
        const timeB = parseInt(b.split('.')[1] || '0');
        return timeA - timeB;
      });
    if (logArchives.length > MAX_ARCHIVES) {
      const filesToDelete = logArchives.slice(0, logArchives.length - MAX_ARCHIVES);
      filesToDelete.forEach(f => {
        try {
          fs.unlinkSync(path.join(logDir, f));
          console.debug(`Arxiu de log antic eliminat: ${f}`);
        } catch (unlinkErr) {
          console.error(`Error eliminant l'arxiu de log antic ${f}:`, unlinkErr);
        }
      });
    }
  } catch (err) {
    console.error('S\'ha produït un error durant la rotació de logs:', err);
  }
};

// Canviar això:
// log.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

// Per això (per forçar logs detallats en producció durant la beta):
log.level = 'debug';
console.log = log.info.bind(log);
console.error = log.error.bind(log);
console.warn = log.warn.bind(log);
console.debug = log.debug.bind(log);
log.initialize();

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const metadataJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'metadata.json'), 'utf8'));

const appMetadata = {
  name: packageJson.productName,
  version: packageJson.version,
  description: metadataJson.description,
};

app.disableHardwareAcceleration();

console.log('**************************************************');
console.log('*** INICIANT PROCÉS PRINCIPAL DE L\'APLICACIÓ ***');
console.log('**************************************************');
console.log('Tots els logs d\'aquesta sessió s\'emmagatzemen a:', log.transports.file.getFile().path);

const APP_ID = 'com.gestorevents.app';
app.setAppUserModelId(APP_ID);

const CONFIG_DIR = app.getPath('userData');
const DATA_DIR = CONFIG_DIR;
const SESSION_FILE = path.join(CONFIG_DIR, 'session.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const GOOGLE_TOKENS_PATH = path.join(CONFIG_DIR, 'google-tokens.json');
const GOOGLE_CONFIG_PATH = path.join(CONFIG_DIR, 'google-config.json');

// ---  SINGLE INSTANCE LOCK ---
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    const filePath = commandLine.find(arg => arg.endsWith('.gep') || arg.endsWith('.json'));
    if (filePath && mainWindow) {
      console.log(`[Second Instance] Obrint fitxer des de la segona instància: ${filePath}`);
      mainWindow.webContents.send('open-file-trigger', filePath);
    }
  });
}

// --- Variables Globals de l'Aplicació ---
let mainWindow;
let openFilePathOnStartup = null;
let isQuitting = false;

// --- Funcions Auxiliars Genèriques ---
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

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
    console.info(`Dades desades correctament a ${filePath}`);
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
      const extension = path.extname(sourceFilePath);
      const sourceFileName = path.basename(sourceFilePath, extension);
      const backupFile = path.join(BACKUP_DIR, `backup-${sourceFileName}-${timestamp}${extension}`);

      fs.copyFileSync(sourceFilePath, backupFile);
      console.info(`Còpia de seguretat creada a: ${backupFile}`);
      return true;
    }
  } catch (error) {
    console.error('Error creant còpia de seguretat:', error);
  }
  return false;
}

async function cleanupOldBackups(sourceFilePath) {
  const MAX_BACKUPS_TO_KEEP = 3;
  if (!fs.existsSync(BACKUP_DIR) || !sourceFilePath) {
    return;
  }

  const extension = path.extname(sourceFilePath);
  const sourceFileName = path.basename(sourceFilePath, extension);
  const backupPrefix = `backup-${sourceFileName}-`;

  try {
    console.debug(`Netejant backups antics per a ${sourceFileName}${extension}...`);
    const backupFiles = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith(backupPrefix) && file.endsWith(extension))
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
      console.debug(`Trobats ${backupFiles.length} backups. Conservant els ${MAX_BACKUPS_TO_KEEP} més recents.`);
      const backupsToDelete = backupFiles.slice(MAX_BACKUPS_TO_KEEP);
      
      backupsToDelete.forEach(backup => {
        try {
          fs.unlinkSync(path.join(BACKUP_DIR, backup.name));
          console.debug(`Backup eliminat: ${backup.name}`);
        } catch (unlinkError) {
          console.error(`Error eliminant el backup ${backup.name}:`, unlinkError);
        }
      });
    } else {
      console.debug(`Trobats ${backupFiles.length} backups. No cal neteja.`);
    }
  } catch (error) {
    console.error('Error durant la neteja de backups:', error);
  }
}

// --- Handlers IPC Genèrics ---

ipcMain.handle('open-file-dialog', async (event, options) => {
  console.debug("[IPC_IN] Rebut 'open-file-dialog'.");
  if (!mainWindow) return { success: false, message: 'No hi ha cap finestra activa.' };

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: options?.filters || [
        { name: 'Arxiu GEP', extensions: ['gep'] },
        { name: 'Arxiu JSON', extensions: ['json'] },
        { name: 'Tots els fitxers', extensions: ['*'] }
      ],
      title: 'Obrir document',
    });

    if (result.canceled || !result.filePaths.length) {
      return { success: false, canceled: true };
    }

    const filePath = result.filePaths[0];
    console.debug(`Fitxer seleccionat per obrir: ${filePath}`);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error en el diàleg per obrir fitxer:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  console.debug(`[IPC_IN] Rebut 'read-file' per a: ${filePath}`);
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
  console.debug(`[IPC_IN] Rebut 'save-file' per a: ${filePath}`);
  if (!filePath) return { success: false, message: 'filePath no pot ser buit.' };
  try {
    fs.writeFileSync(filePath, data, 'utf8');
    console.info(`Fitxer desat correctament a: ${filePath}`);
    console.info('Desant un document principal via save-file. Es crearà una còpia de seguretat.');
    await createBackup(filePath);
    await cleanupOldBackups(filePath);
    return { success: true };
  } catch (error) {
    console.error(`Error desant el fitxer a ${filePath}:`, error);
    return { success: false, message: `No s'ha pogut desar el fitxer: ${error.message}` };
  }
});

ipcMain.handle('quit-application', () => {
  console.info("[Exit Flow] Rebut 'quit-application'. Sortint de l'aplicació.");
  isQuitting = true;
  app.quit();
});

ipcMain.handle('load-app-data', async () => {
  console.debug("[IPC_IN] Rebut 'load-app-data'. L'aplicació començarà amb un estat buit.");
  return null;
});

ipcMain.handle('get-recent-files', async () => {
  console.debug("[IPC_IN] Rebut 'get-recent-files'.");
  const sessionData = loadSessionData();
  return sessionData.recentFiles || [];
});

ipcMain.handle('add-recent-file', async (event, filePath) => {
  console.debug(`[IPC_IN] Rebut 'add-recent-file' per a: ${filePath}`);
  if (!filePath) return { success: false, message: 'filePath no pot ser buit.' };
  try {
    const sessionData = loadSessionData();
    let recentFiles = sessionData.recentFiles || [];
    recentFiles = recentFiles.filter(f => f !== filePath);
    recentFiles.unshift(filePath);
    const MAX_RECENT_FILES = 4;
    if (recentFiles.length > MAX_RECENT_FILES) {
      recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
    }
    await saveSessionData({ recentFiles });
    console.debug("Fitxers recents actualitzats:", recentFiles);
    return { success: true, recentFiles };
  } catch (error) {
    console.error('Error afegint a fitxers recents:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('factory-reset', async () => {
  console.info("[IPC_IN] Rebut 'factory-reset'.");
  console.info("Iniciant Restauració de Fàbrica...");
  
  let success = true;
  let messages = [];

  const eliminarFitxerDeFormaSegura = (filePath, fileNameForMessage) => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        messages.push(`${fileNameForMessage} eliminat.`);
        console.info(`${fileNameForMessage} eliminat: ${filePath}`);
      } catch (err) {
        success = false;
        messages.push(`Error eliminant ${fileNameForMessage}: ${err.message}`);
        console.error(`Error eliminant ${fileNameForMessage} (${filePath}):`, err);
      }
    } else {
      messages.push(`${fileNameForMessage} no existia.`);
      console.debug(`${fileNameForMessage} no existia: ${filePath}`);
    }
  };

  eliminarFitxerDeFormaSegura(GOOGLE_TOKENS_PATH, `Fitxer de tokens de Google (${path.basename(GOOGLE_TOKENS_PATH)})`);
  eliminarFitxerDeFormaSegura(GOOGLE_CONFIG_PATH, `Fitxer de configuració de Google (${path.basename(GOOGLE_CONFIG_PATH)})`);
  eliminarFitxerDeFormaSegura(SESSION_FILE, `Fitxer de sessió (${path.basename(SESSION_FILE)})`);

  if (googleAuthClient) {
    googleAuthClient.setCredentials(null);
    console.info("Credencials de googleAuthClient en memòria netejades.");
    messages.push("Credencials de Google en memòria netejades.");
  }
  
  if (success) {
    console.info("Reset de fàbrica del backend completat.");
    return { success: true, message: `Reset completat:\n${messages.join('\n')}` };
  } else {
    console.error("El reset de fàbrica ha fallat en alguns passos.");
    return { success: false, message: `El reset de fàbrica ha fallat:\n${messages.join('\n')}` };
  }
});

ipcMain.handle('show-unsaved-changes-dialog', async (event, { message, buttons }) => {
  if (!mainWindow) return { response: buttons.length - 1 };
  console.debug("[IPC_IN] Mostrant diàleg de sortida personalitzat.");
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: buttons,
    defaultId: 0,
    cancelId: buttons.length - 1,
    title: 'Tancar aplicació',
    message: message,
  });
  console.debug(`[IPC_OUT] Opció de diàleg seleccionada: ${result.response}`);
  return { response: result.response };
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const { title, defaultPath, filters, data, isDocumentSave } = options;
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
    if (isDocumentSave) {
      console.info('Desant un document principal. Es crearà una còpia de seguretat.');
      await createBackup(result.filePath);
      await cleanupOldBackups(result.filePath);
    } else {
      console.info('Desant un fitxer exportat (PDF/CSV). No es crearà cap còpia de seguretat.');
    }
    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('Error desant el fitxer:', error);
    return { success: false, message: `Error en desar el fitxer: ${error.message}` };
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

ipcMain.handle('open-logs-folder', async () => {
  console.info("[IPC_IN] Rebut 'open-logs-folder'.");
  try {
    const logFilePath = log.transports.file.getFile().path;
    const logDirPath = path.dirname(logFilePath);
    await shell.openPath(logDirPath);
    return { success: true };
  } catch (error) {
    console.error('Error obrint la carpeta de logs:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('open-backups-folder', async () => {
  console.info("[IPC_IN] Rebut 'open-backups-folder'.");
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      console.debug(`El directori de backups no existeix, creant-lo a: ${BACKUP_DIR}`);
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    await shell.openPath(BACKUP_DIR);
    return { success: true };
  } catch (error) {
    console.error('Error obrint la carpeta de còpies de seguretat:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-app-metadata', async () => {
  return appMetadata;
});

// ===================================================================================
// Region: Google Calendar Integration
// ===================================================================================

const APP_CALENDAR_BASE_NAME = "Gestor d'Esdeveniments (App)";
let isAuthenticating = false;
let googleAuthClient;
let googleCredentials;
let googleServiceAccountClient;

// --- A. Helpers d'Autenticació ---
function loadGoogleCredentials() {
  try {
    const credentialsPath = path.join(__dirname, 'google-credentials.json');
    console.debug('[DEBUG_GOOGLE] loadGoogleCredentials: Checking if file exists at:', credentialsPath);
    if (!fs.existsSync(credentialsPath)) {
      console.debug('[DEBUG_GOOGLE] loadGoogleCredentials: File does not exist');
      return false;
    }

    console.debug('[DEBUG_GOOGLE] loadGoogleCredentials: File exists, reading content');
    const content = fs.readFileSync(credentialsPath);
    googleCredentials = JSON.parse(content).installed;
    googleAuthClient = new google.auth.OAuth2(googleCredentials.client_id, googleCredentials.client_secret);
    console.debug('[DEBUG_GOOGLE] loadGoogleCredentials: OAuth2 client initialized successfully');
    
    if (fs.existsSync(GOOGLE_TOKENS_PATH)) {
      console.debug('[DEBUG_GOOGLE] loadGoogleCredentials: Tokens file exists, loading tokens');
      const tokens = JSON.parse(fs.readFileSync(GOOGLE_TOKENS_PATH));
      console.debug('[DEBUG_GOOGLE] loadGoogleCredentials: Setting credentials with access_token (first 5 chars):', tokens.access_token?.substring(0, 5) || 'MISSING');
      googleAuthClient.setCredentials(tokens);
    } else {
      console.debug('[DEBUG_GOOGLE] loadGoogleCredentials: No tokens file found');
    }
  } catch (err) {
    console.error('[DEBUG_GOOGLE] loadGoogleCredentials: Error loading credentials:', err);
    return false;
  }
  console.debug('[DEBUG_GOOGLE] loadGoogleCredentials: Completed successfully');
  return true;
}

async function loadServiceAccountCredentials() {
  try {
    const serviceAccountPath = path.join(__dirname, 'service-account.json');
    console.debug('[DEBUG_GOOGLE] loadServiceAccountCredentials: Looking for service-account.json at:', serviceAccountPath);
    if (!fs.existsSync(serviceAccountPath)) {
      console.warn('[DEBUG_GOOGLE] loadServiceAccountCredentials: service-account.json file not found');
      return false;
    }
    console.debug('[DEBUG_GOOGLE] loadServiceAccountCredentials: File found, reading content');
    const keys = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.debug('[DEBUG_GOOGLE] loadServiceAccountCredentials: client_email found:', keys.client_email ? 'PRESENT' : 'MISSING');
    console.debug('[DEBUG_GOOGLE] loadServiceAccountCredentials: private_key found:', keys.private_key ? 'PRESENT' : 'MISSING');
    googleServiceAccountClient = await new google.auth.GoogleAuth({
        credentials: { client_email: keys.client_email, private_key: keys.private_key },
        scopes: ['https://www.googleapis.com/auth/calendar'],
    }).getClient();
    console.debug('[DEBUG_GOOGLE] loadServiceAccountCredentials: Service account client initialized successfully');
    console.info("Client del Compte de Servei de Google inicialitzat.");
    return true;
  } catch (err) {
    console.error('[DEBUG_GOOGLE] loadServiceAccountCredentials: Error loading service account credentials:', err);
    return false;
  }
}

function loadGoogleConfigFromFile() {
    console.debug('[DEBUG_GOOGLE] loadGoogleConfigFromFile: GOOGLE_CONFIG_PATH:', GOOGLE_CONFIG_PATH);
    if (!fs.existsSync(GOOGLE_CONFIG_PATH)) {
        console.debug('[DEBUG_GOOGLE] loadGoogleConfigFromFile: Config file does not exist');
        return null;
    }
    try {
        const rawContent = fs.readFileSync(GOOGLE_CONFIG_PATH, 'utf8');
        console.debug('[DEBUG_GOOGLE] loadGoogleConfigFromFile: Raw content read from file:', rawContent || 'EMPTY_FILE');
        const config = JSON.parse(rawContent);
        console.debug('[DEBUG_GOOGLE] loadGoogleConfigFromFile: userEmail is', config?.userEmail || 'MISSING');
        return config;
    } catch(err) {
        console.error('[DEBUG_GOOGLE] loadGoogleConfigFromFile: Error parsing config file:', err);
        return null;
    }
}

async function findOrCreateAppCalendar(calendarService, userEmail, calendarSuffix) {
  try {
    const suffix = calendarSuffix ? ` - ${calendarSuffix}` : '';
    const finalCalendarName = `${APP_CALENDAR_BASE_NAME}${suffix}`;
    let calendarId;
    let wasNewlyCreated = false;

    const calendarList = await calendarService.calendarList.list();
    const existingCalendar = calendarList.data.items.find(cal => cal.summary === finalCalendarName);

    if (existingCalendar) {
      calendarId = existingCalendar.id;
    } else {
      const newCalendar = await calendarService.calendars.insert({
        requestBody: {
          summary: finalCalendarName,
          description: "Calendari gestionat per l'aplicació Gestor d'Esdeveniments.",
          timeZone: 'Europe/Madrid'
        }
      });
      calendarId = newCalendar.data.id;
      wasNewlyCreated = true;
    }
    await calendarService.acl.insert({
      calendarId: calendarId,
      sendNotifications: wasNewlyCreated,
      requestBody: { role: 'reader', scope: { type: 'user', value: userEmail } },
    });
    return calendarId;
  } catch (error) {
    throw error;
  }
}

// --- B. Helpers de Format Visual (Noves funcions) ---

// 1. Formata YYYY-MM-DD a DD/MM/YYYY
const formatDateDMY = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// 2. Formata YYYY-MM-DD a [DD/MM]
const formatSimpleDM = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `[${parts[2]}/${parts[1]}]`;
};

// 3. Format de rang de dates principal
const formatDateRangeDMY = (start, end) => {
  const s = formatDateDMY(start);
  const e = formatDateDMY(end);
  if (s && e && s !== e) return `${s} - ${e}`;
  return s;
};

// 4. Comprova si dates són consecutives
const areDatesConsecutive = (dateStr1, dateStr2) => {
  const d1 = new Date(dateStr1);
  d1.setUTCHours(0, 0, 0, 0);
  d1.setDate(d1.getDate() + 1);
  return d1.toISOString().split('T')[0] === dateStr2;
};

// 5. Crea rangs compactes per al detall
const formatDateRanges = (dates) => {
  if (!dates || dates.length === 0) return '';
  const sortedDates = [...dates].sort();
  const ranges = [];
  let i = 0;
  while (i < sortedDates.length) {
    let rangeStart = sortedDates[i];
    let rangeEnd = sortedDates[i];
    let j = i;
    while (j + 1 < sortedDates.length && areDatesConsecutive(sortedDates[j], sortedDates[j + 1])) {
      rangeEnd = sortedDates[j + 1];
      j++;
    }
    const startFmt = formatSimpleDM(rangeStart).replace('[','').replace(']','');
    if (rangeStart === rangeEnd) {
      ranges.push(`[${startFmt}]`);
    } else {
      const endFmt = formatSimpleDM(rangeEnd).replace('[','').replace(']','');
      ranges.push(`[${startFmt}-${endFmt}]`);
    }
    i = j + 1;
  }
  return ranges.join(', ');
};

// Funció per obtenir data i hora actuals formatejades
const getCurrentTime = () => {
  return new Date().toLocaleTimeString('ca-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
};

// Helper per generar resum de necessitats tècniques per a Google Calendar
const generateTechNeedsSummary = (techSheet) => {
  if (!techSheet) return '';
  const parts = [];
  
  const addSectionCount = (key, label) => {
    const section = techSheet[key];
    if (section && section.status === 'yes' && section.data && Array.isArray(section.data.needs)) {
      // Sumem quantitats (assumint que quantity pot ser string o number)
      const count = section.data.needs.reduce((acc, item) => {
        const qty = parseInt(item.quantity) || 0;
        return acc + qty;
      }, 0);
      if (count > 0) parts.push(`${count} ${label}`);
    }
  };

  addSectionCount('lighting', 'LLUMS');
  addSectionCount('sound', 'SO');
  addSectionCount('machinery', 'MAQUI');
  addSectionCount('video', 'VIDEO');
  addSectionCount('structures', 'ESTR');
  
  // Per a auxiliars/càrrega (sovint a 'personnel' o 'rentals', ajustem segons model)
  // Si no hi ha una secció específica de personal de càrrega, ho deixem així.
  
  return parts.length > 0 ? `Necessitats TEC: ${parts.join(', ')}` : '';
};

// --- C. HANDLER PRINCIPAL DE SINCRONITZACIÓ (AMB LOGS MILLORATS) ---
ipcMain.handle('sync-with-google', async (event, { localData, targetCalendarId }) => {
  const startTime = getCurrentTime();
  const logMessages = [];
  let currentProgressStep = 0;
  let totalProgressSteps = 1; // 1 per defecte per evitar divisions per zero a la UI
  
  const logAndSendProgress = (msg, isError = false) => {
    const timestamp = getCurrentTime();
    const logMessage = isError 
      ? `[ERROR] ${msg}`
      : `[${timestamp}] ${msg}`;
    
    logMessages.push(logMessage);
    const progress = { 
      current: currentProgressStep || 0, 
      total: totalProgressSteps || 1, 
      message: msg,
      logs: [...logMessages]
    };
    
    if (mainWindow) {
      mainWindow.webContents.send('sync-progress', progress);
    }
    
    if (isError) {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
    
    return progress;
  };

  try {
    logAndSendProgress('🔵 Iniciant procés de sincronització amb Google Calendar...');
    
    if (!googleServiceAccountClient) {
      throw new Error('Client Service Account no inicialitzat. Verifica la configuració de Google.');
    }
    
    let config = loadGoogleConfigFromFile();
    if (!config?.userEmail) {
      throw new Error('No s\'ha trobat l\'email de l\'usuari a la configuració.');
    }
    
    const calendar = google.calendar({ version: 'v3', auth: googleServiceAccountClient });
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // --- Verificació del calendari ---
    logAndSendProgress(`🔍 Verificant accés al calendari ${targetCalendarId}...`);
    try {
      await calendar.calendars.get({ calendarId: targetCalendarId });
      logAndSendProgress('✅ Connexió amb el calendari establerta correctament.');
    } catch (err) {
      if (err.code === 404) {
        config.managedAppCalendars = config.managedAppCalendars.filter(c => c.id !== targetCalendarId);
        fs.writeFileSync(GOOGLE_CONFIG_PATH, JSON.stringify(config, null, 2));
        logAndSendProgress(`❌ El calendari no existeix. S'ha eliminat de la llista de calendaris gestionats.`, true);
        return { success: false, code: 'CALENDAR_NOT_FOUND', message: `El calendari no existeix.` };
      }
      logAndSendProgress(`❌ Error de connexió amb el calendari: ${err.message}`, true);
      return { success: false, message: `Error de connexió: ${err.message}` };
    }

    // --- Diàleg de confirmació ---
    logAndSendProgress('⏳ Sol·licitant confirmació per iniciar la sincronització...');
    const choice = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Sí, sincronitzar', 'Cancel·lar'],
      defaultId: 1, 
      cancelId: 1,
      title: 'Confirmar Sincronització',
      message: `Estàs a punt de sobreescriure el calendari a Google.`,
      detail: 'Aquesta acció és irreversible. Vols continuar?',
    });
    
    if (choice.response !== 0) {
      logAndSendProgress('❌ Sincronització cancel·lada per l\'usuari.');
      return { success: false, message: 'Cancel·lat.' };
    }

    logAndSendProgress('🚀 Iniciant procés de sincronització...');
    
    try {
      // 1. Definir data de tall (7 dies enrere)
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - 7);
      const timeMin = thresholdDate.toISOString();
      
      logAndSendProgress(`📅 Sincronització parcial des de: ${new Date(timeMin).toLocaleDateString('ca-ES')}`);

      // 2. Obtenir llista per esborrar (només esdeveniments nous o modificats)
      logAndSendProgress('🔍 Obtenint llista d\'esdeveniments del calendari...');
      const eventsListRes = await calendar.events.list({ 
        calendarId: targetCalendarId, 
        maxResults: 2500,
        timeMin: timeMin
      });
      const eventsToDelete = eventsListRes.data.items || [];
      
      // 3. Filtrar esdeveniments locals per pujar (només els que acaben després del threshold)
      const localFramesToUpload = (localData.eventFrames || []).filter(frame => 
        new Date(frame.endDate) >= thresholdDate
      );
      
      logAndSendProgress(`📊 Estadístiques de sincronització:`);
      logAndSendProgress(`   • Esdeveniments a eliminar: ${eventsToDelete.length}`);
      logAndSendProgress(`   • Esdeveniments a pujar/actualitzar: ${localFramesToUpload.length} (de ${(localData.eventFrames || []).length} totals)`);

      // Actualitzar total de passos de progrés
      totalProgressSteps = eventsToDelete.length + localFramesToUpload.length;
      currentProgressStep = 0;

      // FASE 1: BUIDAR (només esdeveniments recents)
      if (eventsToDelete.length > 0) {
        logAndSendProgress(`🗑️  Iniciant eliminació de ${eventsToDelete.length} esdeveniments antics...`);
          
        for (const [index, event] of eventsToDelete.entries()) {
          currentProgressStep++;
          const progressMsg = `Eliminant esdeveniment ${index + 1}/${eventsToDelete.length}: ${event.summary || 'Sense títol'}`;
          logAndSendProgress(progressMsg);
          
          try {
            await calendar.events.delete({ 
              calendarId: targetCalendarId, 
              eventId: event.id 
            });
            await delay(150); // Petita pausa per evitar sobrecàrrega
          } catch (error) {
            logAndSendProgress(`⚠️ No s'ha pogut eliminar l'esdeveniment ${event.id}: ${error.message}`, true);
          }
        }
        logAndSendProgress('✅ S\'han eliminat tots els esdeveniments antics.');
      } else {
        logAndSendProgress('ℹ️ No hi ha esdeveniments antics per eliminar.');
      }

      // FASE 2: PUJAR (només esdeveniments nous o modificats)
      if (localFramesToUpload.length > 0) {
        logAndSendProgress(`🔼 Iniciant pujada de ${localFramesToUpload.length} esdeveniments nous/actualitzats...`);
        
        for (const [index, localFrame] of localFramesToUpload.entries()) {
          currentProgressStep = eventsToDelete.length + index + 1;
          const progressMsg = `📤 Processant esdeveniment ${index + 1}/${localFramesToUpload.length}: ${localFrame.name || 'Sense títol'}`;
          logAndSendProgress(progressMsg);
          
          try {
            // 1. Preparar dades de l'esdeveniment (FORMAT RIC + MIXT DETALLAT)
            const eventAssignments = (localData.assignments || []).filter(a => a.eventFrameId === localFrame.id);
            
            const statusIcons = {
              'Sí': '🟢',
              'No': '🔴',
              'Pendent': '🟡',
              'Mixt': '🔵'
            };

            const assignedPeopleList = eventAssignments
              .map(a => {
                  const person = localData.peopleGroups.find(p => p.id === a.personGroupId);
                  if (!person) return null;
                  
                  const roleStr = a.role ? ` (${a.role})` : '';
                  const notePart = a.notes ? `\n   └ 📝 Nota: ${a.notes}` : '';

                  // CAS A: Assignació MIXTA (Detall per dies)
                  if (a.status === 'Mixt' && a.dailyStatuses) {
                    const sortedDates = Object.keys(a.dailyStatuses).sort();
                    const dailyDetails = sortedDates.map(date => {
                        const dayStatus = a.dailyStatuses[date];
                        const dayIcon = statusIcons[dayStatus] || '⚪';
                        // Usem la funció formatSimpleDM existent a main.cjs o fem un format ràpid
                        const dayStr = date.split('-').reverse().slice(0, 2).join('/'); // DD/MM
                        return `   ${dayIcon} ${dayStr}: ${dayStatus}`;
                    }).join('\n');

                    return `${statusIcons['Mixt']} ${person.name}${roleStr} [MIXT]:\n${dailyDetails}${notePart}`;
                  } 
                  
                  // CAS B: Assignació ESTÀNDARD (Sí/No/Pendent)
                  else {
                    const icon = statusIcons[a.status] || '⚪';
                    // Si és un sol dia, mostrem data simple. Si és rang, mostrem inici-fi.
                    const dateStr = (a.startDate === a.endDate) 
                        ? formatDateDMY(a.startDate) 
                        : `${formatDateDMY(a.startDate)} - ${formatDateDMY(a.endDate)}`;
                    
                    return `${icon} ${person.name}${roleStr}: ${dateStr} (${a.status})${notePart}`;
                  }
              })
              .filter(Boolean)
              .join('\n');
            
            // Generar resum tècnic (Assegura't d'haver afegit la funció generateTechNeedsSummary abans)
            const techSummary = generateTechNeedsSummary(localFrame.techSheet);
            const techLine = techSummary ? `${techSummary}\n\n` : '';

            const eventData = {
              summary: localFrame.name || 'Esdeveniment sense títol',
              description: `Lloc: ${localFrame.place || 'No especificat'}\n` +
                          `${techLine}` + 
                          `Notes: ${localFrame.generalNotes || ''}\n\n` +
                          `--- PERSONAL ASSIGNAT ---\n${assignedPeopleList || 'Cap assignació'}`,
              location: localFrame.place || '',
              start: { date: localFrame.startDate }, 
              end: { date: addDaysISO(localFrame.endDate, 1) }, 
              extendedProperties: {
                private: {
                  eventFrameId: localFrame.id
                }
              }
            };

            // 2. Crear o actualitzar l'esdeveniment a Google Calendar
            if (localFrame.googleEventId) {
              try {
                await calendar.events.update({
                  calendarId: targetCalendarId,
                  eventId: localFrame.googleEventId,
                  requestBody: eventData
                });
                logAndSendProgress(`   ✅ Actualitzat a Google Calendar: ${localFrame.name}`);
              } catch (error) {
                if (error.code === 404) {
                  logAndSendProgress(`   ℹ️ L'esdeveniment no existeix a Google, es crearà de nou.`);
                  localFrame.googleEventId = null; // Forçar creació de nou
                } else {
                  throw error;
                }
              }
            }

            // 3. Si no hi ha ID de Google (o ha fallat l'update per 404), crear l'esdeveniment
            if (!localFrame.googleEventId) {
              try {
                const createdEvent = await calendar.events.insert({
                  calendarId: targetCalendarId,
                  requestBody: eventData
                });
                localFrame.googleEventId = createdEvent.data.id;
                logAndSendProgress(`   ✅ Creat a Google Calendar amb ID: ${localFrame.googleEventId}`);
              } catch (error) {
                logAndSendProgress(`   ❌ Error en crear l'esdeveniment: ${error.message}`, true);
                continue;
              }
            }

            // 4. Actualitzar l'ID de Google a les dades locals
            const frameIndex = localData.eventFrames.findIndex(f => f.id === localFrame.id);
            if (frameIndex !== -1) {
              localData.eventFrames[frameIndex].googleEventId = localFrame.googleEventId;
              localData.eventFrames[frameIndex].googleCalendarId = targetCalendarId;
              localData.eventFrames[frameIndex].lastSync = new Date().toISOString();
            }

            await delay(300); // Pausa per evitar sobrecàrrega de l'API

          } catch (error) {
            logAndSendProgress(`   ❌ Error en processar l'esdeveniment "${localFrame.name}": ${error.message}`, true);
            continue;
          }
        }
        
        logAndSendProgress('✅ S\'han processat tots els esdeveniments nous/actualitzats.');
      } else {
        logAndSendProgress('ℹ️ No hi ha esdeveniments nous o actualitzats per pujar.');
      }

      // Actualitzar la configuració
      config.activeAppCalendarId = targetCalendarId;
      fs.writeFileSync(GOOGLE_CONFIG_PATH, JSON.stringify(config, null, 2));

      // Finalització amb èxit
      const endTime = getCurrentTime();
      logAndSendProgress(`🏁 Sincronització completada amb èxit! (${startTime} - ${endTime})`);

      return { 
        success: true, 
        message: 'Sincronització completada amb èxit.', 
        data: localData 
      };

    } catch (error) {
      const errorMsg = `❌ Error durant la sincronització: ${error.message}`;
      logAndSendProgress(errorMsg, true);
      console.error('Error en la sincronització:', error);
      throw error; // Es capturarà pel catch extern
    }

  } catch (error) {
    const errorMsg = `❌ Error crític durant la sincronització: ${error.message}`;
    logAndSendProgress(errorMsg, true);
    console.error('Error crític sync:', error);
    return { 
      success: false, 
      message: error.message,
      logs: logMessages
    };
  }
});

// --- Altres Handlers Google ---

ipcMain.handle('google-auth-start', async () => {
  console.debug('[DEBUG_GOOGLE] google-auth-start: Starting authentication flow');
  if (isAuthenticating) {
    console.debug('[DEBUG_GOOGLE] google-auth-start: Authentication already in progress');
    return { success: false, message: "Autenticació en curs." };
  }
  if (!googleAuthClient) {
    console.debug('[DEBUG_GOOGLE] google-auth-start: Google auth client not initialized');
    return { success: false, message: "Client no inicialitzat." };
  }

  isAuthenticating = true;
  console.debug('[DEBUG_GOOGLE] google-auth-start: isAuthenticating set to true');
  return new Promise((resolve) => {
    const server = http.createServer();
    let state;

    const closeServerAndResolve = (result) => {
      if (server.listening) server.close();
      isAuthenticating = false;
      console.debug('[DEBUG_GOOGLE] google-auth-start: Server closed and isAuthenticating reset');
      resolve(result);
    };

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      console.debug('[DEBUG_GOOGLE] google-auth-start: Server listening on port:', port);
      googleAuthClient.redirectUri = `http://localhost:${port}`;
      state = generateId();
      console.debug('[DEBUG_GOOGLE] google-auth-start: Generated state:', state);
      const authUrl = googleAuthClient.generateAuthUrl({
        access_type: 'offline', prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/calendar.readonly'],        
        state: state,
      });
      console.debug('[DEBUG_GOOGLE] google-auth-start: Opening auth URL in external browser');
      require('electron').shell.openExternal(authUrl);
    });

    server.on('request', async (req, res) => {
      console.debug('[DEBUG_GOOGLE] google-auth-start: Received callback request');
      const qs = new url.URL(req.url, 'http://localhost').searchParams;
      const code = qs.get('code');
      const receivedState = qs.get('state');
      console.debug('[DEBUG_GOOGLE] google-auth-start: Received code:', code ? 'PRESENT' : 'MISSING');
      console.debug('[DEBUG_GOOGLE] google-auth-start: Received state:', receivedState);

      if (receivedState !== state) {
        console.error('[DEBUG_GOOGLE] google-auth-start: CSRF state mismatch');
        res.end('<h1>Error CSRF</h1>');
        req.socket.destroy();
        closeServerAndResolve({ success: false });
        return;
      }
      
      try {
        console.debug('[DEBUG_GOOGLE] google-auth-start: Exchanging code for tokens');
        const { tokens } = await googleAuthClient.getToken(code);
        console.debug('[DEBUG_GOOGLE] google-auth-start: Successfully obtained tokens');
        console.debug('[DEBUG_GOOGLE] google-auth-start: access_token (first 5 chars):', tokens.access_token?.substring(0, 5) || 'MISSING');
        console.debug('[DEBUG_GOOGLE] google-auth-start: refresh_token (first 5 chars):', tokens.refresh_token?.substring(0, 5) || 'MISSING');
        googleAuthClient.setCredentials(tokens);
        fs.writeFileSync(GOOGLE_TOKENS_PATH, JSON.stringify(tokens));
        console.debug('[DEBUG_GOOGLE] google-auth-start: Tokens saved to file');

        console.debug('[DEBUG_GOOGLE] google-auth-start: Getting user profile from People API');
        const people = google.people({ version: 'v1', auth: googleAuthClient });
        const profile = await people.people.get({ resourceName: 'people/me', personFields: 'emailAddresses' });
        const primaryEmail = profile.data.emailAddresses?.find(e => e.metadata?.primary)?.value;
        console.debug('[DEBUG_GOOGLE] google-auth-start: Retrieved primary email from People API:', primaryEmail || 'MISSING');

        let config = loadGoogleConfigFromFile() || {};
        config.userEmail = primaryEmail;
        console.debug('[DEBUG_GOOGLE] google-auth-start: Saving userEmail to config:', primaryEmail);
        if (!config.managedAppCalendars) config.managedAppCalendars = [];
        fs.writeFileSync(GOOGLE_CONFIG_PATH, JSON.stringify(config, null, 2));
        console.debug('[DEBUG_GOOGLE] google-auth-start: Config file updated with user email');

        mainWindow.webContents.send('google-auth-success');
        res.end('<h1>Autenticació completada!</h1>');
        req.socket.destroy();
        closeServerAndResolve({ success: true });
      } catch (e) {
        console.error('[DEBUG_GOOGLE] google-auth-start: Error during token exchange or profile retrieval:', e);
        mainWindow.webContents.send('google-auth-error', e.message);
        res.end('<h1>Error</h1>');
        req.socket.destroy();
        closeServerAndResolve({ success: false, message: e.message });
      }
    });
  });
});

ipcMain.handle('load-google-config', async () => loadGoogleConfigFromFile());

ipcMain.handle('save-google-config', async (event, config) => {
  try {
    const existingConfig = loadGoogleConfigFromFile() || {};
    const mergedConfig = { ...existingConfig, ...config };
    fs.writeFileSync(GOOGLE_CONFIG_PATH, JSON.stringify(mergedConfig, null, 2));
    return { success: true, data: mergedConfig };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('google-get-calendar-list', async () => {
  try {
    if (!googleAuthClient?.credentials?.access_token) throw new Error('No autenticat.');
    const calendar = google.calendar({ version: 'v3', auth: googleAuthClient });
    const res = await calendar.calendarList.list();
    return { success: true, calendars: res.data.items?.map(cal => ({ id: cal.id, summary: cal.summary, backgroundColor: cal.backgroundColor, primary: cal.primary })) || [] };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-google-events', async () => {
  try {
    const config = loadGoogleConfigFromFile();
    if (!config?.selectedCalendarIds?.length) return { success: true, events: [] };
    if (!googleAuthClient?.credentials?.access_token) throw new Error('No autenticat.');
    
    const calendar = google.calendar({ version: 'v3', auth: googleAuthClient });
    const timeMin = new Date(); timeMin.setMonth(timeMin.getMonth() - 6);
    const timeMax = new Date(); timeMax.setMonth(timeMax.getMonth() + 6);
    const allEvents = [];
    const calendarListResponse = await calendar.calendarList.list();
    const availableCalendars = calendarListResponse.data.items || [];
    const managedIds = new Set(config.managedAppCalendars?.map(c => c.id) || []);

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
        if (managedIds.has(calendarId)) color = calendarId === config.activeAppCalendarId ? '#D32F2F' : '#E67C73';

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
        allEvents.push(...events);
      } catch (e) {}
    }
    return { success: true, events: allEvents };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('google-get-event-details', async (event, { calendarId, eventId }) => {
  try {
    if (!googleAuthClient?.credentials?.access_token) throw new Error('No autenticat.');
    const calendar = google.calendar({ version: 'v3', auth: googleAuthClient });
    const res = await calendar.events.get({ calendarId, eventId });
    return { success: true, event: res.data };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('google-disconnect', async () => {
  try {
    const config = loadGoogleConfigFromFile();
    if (config?.managedAppCalendars?.length > 0 && googleServiceAccountClient) {
      const calendar = google.calendar({ version: 'v3', auth: googleServiceAccountClient });
      for (const cal of config.managedAppCalendars) {
        try { await calendar.calendars.delete({ calendarId: cal.id }); } catch (e) {}
      }
    }
    if (googleAuthClient?.credentials?.access_token) await googleAuthClient.revokeCredentials();
    if (fs.existsSync(GOOGLE_TOKENS_PATH)) fs.unlinkSync(GOOGLE_TOKENS_PATH);
    if (fs.existsSync(GOOGLE_CONFIG_PATH)) fs.unlinkSync(GOOGLE_CONFIG_PATH);
    if (googleAuthClient) googleAuthClient.setCredentials(null);
    return { success: true, message: 'Desconnexió completada.' };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('create-new-app-calendar', async (event, suffix) => {
    console.debug('[DEBUG_GOOGLE] create-new-app-calendar: Function entered with suffix:', suffix);
    console.debug('[DEBUG_GOOGLE] create-new-app-calendar: googleServiceAccountClient status:', googleServiceAccountClient ? 'INITIALIZED' : 'NULL');
    if (!googleServiceAccountClient) {
        console.debug('[DEBUG_GOOGLE] create-new-app-calendar: FAILED - googleServiceAccountClient is null');
        return { success: false, message: 'Client Service Account no inicialitzat.' };
    }
    const config = loadGoogleConfigFromFile();
    console.debug('[DEBUG_GOOGLE] create-new-app-calendar: Config loaded, userEmail value:', config?.userEmail || 'MISSING');
    if (!config?.userEmail) {
        console.debug('[DEBUG_GOOGLE] create-new-app-calendar: FAILED - config.userEmail is missing');
        return { success: false, message: 'No email usuari.' };
    }

    const finalSuffix = suffix.trim();
    const finalCalendarName = `${APP_CALENDAR_BASE_NAME}${finalSuffix ? ` - ${finalSuffix}` : ''}`;
    console.debug('[DEBUG_GOOGLE] create-new-app-calendar: Final calendar name will be:', finalCalendarName);
    if (config.managedAppCalendars?.some(cal => cal.name === finalCalendarName)) {
        console.debug('[DEBUG_GOOGLE] create-new-app-calendar: FAILED - Calendar already exists');
        return { success: false, message: `El calendari ja existeix.` };
    }

    try {
        console.debug('[DEBUG_GOOGLE] create-new-app-calendar: Proceeding with calendar creation');
        const calendar = google.calendar({ version: 'v3', auth: googleServiceAccountClient });
        const newCalendarId = await findOrCreateAppCalendar(calendar, config.userEmail, finalSuffix);
        console.debug('[DEBUG_GOOGLE] create-new-app-calendar: Calendar created/retrieved with ID:', newCalendarId);
        const newCalendarObject = { id: newCalendarId, name: finalCalendarName, suffix: finalSuffix };

        config.managedAppCalendars = [...(config.managedAppCalendars || []), newCalendarObject];
        config.activeAppCalendarId = newCalendarId;
        fs.writeFileSync(GOOGLE_CONFIG_PATH, JSON.stringify(config, null, 2));
        console.debug('[DEBUG_GOOGLE] create-new-app-calendar: Config updated with new calendar');

        return { success: true, data: { managedAppCalendars: config.managedAppCalendars, activeAppCalendarId: config.activeAppCalendarId } };
    } catch (error) {
        console.error('[DEBUG_GOOGLE] create-new-app-calendar: Error during calendar creation:', error);
        return { success: false, message: error.message };
    }
});

ipcMain.handle('delete-app-calendar', async (event, calendarIdToDelete) => {
  if (!googleServiceAccountClient) return { success: false, message: 'Client Service Account no inicialitzat.' };
  const config = loadGoogleConfigFromFile();
  if (!config?.managedAppCalendars?.some(c => c.id === calendarIdToDelete)) return { success: false, message: "Calendari no gestionat." };

  try {
    const calendar = google.calendar({ version: 'v3', auth: googleServiceAccountClient });
    await calendar.calendars.delete({ calendarId: calendarIdToDelete });
  } catch (err) {}

  config.managedAppCalendars = config.managedAppCalendars.filter(c => c.id !== calendarIdToDelete);
  if (config.activeAppCalendarId === calendarIdToDelete) config.activeAppCalendarId = config.managedAppCalendars.length > 0 ? config.managedAppCalendars[0].id : null;
  if (config.selectedCalendarIds) config.selectedCalendarIds = config.selectedCalendarIds.filter(id => id !== calendarIdToDelete);

  fs.writeFileSync(GOOGLE_CONFIG_PATH, JSON.stringify(config, null, 2));
  return { success: true, message: 'Calendari eliminat.', data: { managedAppCalendars: config.managedAppCalendars, activeAppCalendarId: config.activeAppCalendarId } };
});

// ===================================================================================
// EndRegion: Google Calendar Integration
// ===================================================================================

// --- Cicle de Vida ---

const filePathArg = process.argv.find(arg => arg.endsWith('.gep') || arg.endsWith('.json'));
if (filePathArg) openFilePathOnStartup = filePathArg;

app.on('open-file', (event, path) => {
  event.preventDefault();
  if (mainWindow) mainWindow.webContents.send('open-file-trigger', path);
  else openFilePathOnStartup = path;
});

async function createWindow() {
  console.debug('[Startup] Iniciant createWindow...');
  ensureDirectoriesExist();
  loadGoogleCredentials(); 
  await loadServiceAccountCredentials();
  const sessionData = loadSessionData();

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

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.on('did-finish-load', () => {
    if (openFilePathOnStartup) {
      mainWindow.webContents.send('open-file-trigger', openFilePathOnStartup);
      openFilePathOnStartup = null;
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl).catch(err => console.error(err));
  } else {
    const indexPath = path.resolve(__dirname, 'dist', 'index.html');
    mainWindow.loadFile(indexPath).catch(err => console.error(err));
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      app.quit();
    }
  });
}

app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
  contents.on('will-navigate', (event, url) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
});

app.on('before-quit', async (event) => {
  if (isQuitting) return;
  event.preventDefault();
  if (mainWindow && !mainWindow.isDestroyed()) {
    const windowBounds = mainWindow.getBounds();
    await saveSessionData({
      width: windowBounds.width, height: windowBounds.height,
      x: windowBounds.x, y: windowBounds.y
    });
    mainWindow.webContents.send('confirm-quit-signal');
  } else {
    isQuitting = true;
    app.quit();
  }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

let hasShownUncaughtExceptionDialog = false;
process.on('uncaughtException', (error) => {
  log.error('Excepció no capturada:', error);
  if (!hasShownUncaughtExceptionDialog) {
    hasShownUncaughtExceptionDialog = true;
    dialog.showErrorBox('Error Inesperat', `S'ha produït un error no controlat: ${error.message}\n\nL'aplicació es tancarà.`);
    setTimeout(() => app.exit(1), 500);
  }
});

app.whenReady().then(() => {
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on('trigger-menu-action', (event, action) => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (!focusedWindow && !['quit', 'load-all', 'load-material', 'load-people'].includes(action)) return;

  switch (action) {
    case 'load-all':
    case 'load-material':
    case 'load-people':
      if (mainWindow) mainWindow.webContents.send('menu-action', action);
      break;
    case 'quit': app.quit(); break;
    case 'reload': focusedWindow.webContents.reload(); break;
    case 'forceReload': focusedWindow.webContents.reloadIgnoringCache(); break;
    case 'toggleDevTools': focusedWindow.webContents.toggleDevTools(); break;
    case 'resetZoom': focusedWindow.webContents.setZoomLevel(0); break;
    case 'zoomIn': focusedWindow.webContents.setZoomLevel(focusedWindow.webContents.getZoomLevel() + 0.5); break;
    case 'zoomOut': focusedWindow.webContents.setZoomLevel(focusedWindow.webContents.getZoomLevel() - 0.5); break;
    case 'togglefullscreen': focusedWindow.setFullScreen(!focusedWindow.isFullScreen()); break;
    default: if (mainWindow) mainWindow.webContents.send('menu-action', action); break;
  }
});