const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { google } = require('googleapis');
const url = require('url');
const http = require('http');

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
  const filteredArgs = args.filter(arg => arg !== undefined); // Línia clau: filtrem els undefined

  const formattedArgs = filteredArgs.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, (key, value) => {
          if (key.startsWith('_')) return undefined;
          return value;
        }, 2);
      } catch {
        return '[Objecte no serialitzable]';
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
console.log('Sessió Electron iniciada. Tots els logs d\'aquesta sessió s\'emmagatzemen a:', sessionLogFile);

const APP_ID = 'com.gestorevents.app';
app.setAppUserModelId(APP_ID);

const CONFIG_DIR = app.getPath('userData');
const DATA_DIR = CONFIG_DIR;
const SESSION_FILE = path.join(CONFIG_DIR, 'session.json');
const DATA_FILE = path.join(DATA_DIR, 'events_data.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const GOOGLE_TOKENS_PATH = path.join(CONFIG_DIR, 'google-tokens.json');
const GOOGLE_CONFIG_PATH = path.join(CONFIG_DIR, 'google-config.json');

const APP_CALENDAR_BASE_NAME = "Gestor d'Esdeveniments (App)";

let mainWindow;
let isQuitting = false;
let googleAuthClient;
let googleCredentials;

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
    console.error("filePath no està definit.");
    return false;
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
    dialog.showMessageBoxSync({ type: 'error', title: 'Error guardant dades', message: `No s'han pogut guardar les dades a ${filePath}\nError: ${error.message}` });
    return false;
  }
}

async function saveSessionWindowData(data) {
  return saveDataWithErrorHandling(SESSION_FILE, data);
}

async function createBackup() {
  if (!DATA_FILE || !BACKUP_DIR) return false;
  try {
    if (fs.existsSync(DATA_FILE)) {
      if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
      if (!checkWritePermissions(BACKUP_DIR)) throw new Error(`No hi ha permisos d'escriptura a ${BACKUP_DIR}`);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(BACKUP_DIR, `backup-events_data-${timestamp}.json`);
      fs.copyFileSync(DATA_FILE, backupFile);
      console.log(`Còpia de seguretat creada a: ${backupFile}`);
      return true;
    }
  } catch (error) {
    console.error('Error creant còpia de seguretat:', error);
  }
  return false;
}
async function cleanupOldBackups() {
  const MAX_BACKUPS_TO_KEEP = 5;
  if (!fs.existsSync(BACKUP_DIR)) {
    return;
  }
  
  try {
    console.log("Netejant backups antics...");
    const backupFiles = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-events_data-') && file.endsWith('.json'))
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

async function findOrCreateAppCalendar(calendar) {
  try {
    const config = loadGoogleConfigFromFile() || {};
    const suffix = config.calendarSuffix ? ` - ${config.calendarSuffix}` : '';
    const finalCalendarName = `${APP_CALENDAR_BASE_NAME}${suffix}`;

    console.log(`Buscant calendari amb el nom: "${finalCalendarName}"`);

    const res = await calendar.calendarList.list();
    const calendars = res.data.items;
    let appCalendar = calendars.find(cal => cal.summary === finalCalendarName);

    if (appCalendar) {
      console.log(`Calendari de l'aplicació trobat: ${appCalendar.id}`);
      return appCalendar.id;
    } else {
      console.log(`El calendari de l'aplicació no existeix. Creant-lo...`);
      const newCalendar = await calendar.calendars.insert({
        requestBody: {
          summary: APP_CALENDAR_NAME,
          description: "Calendari gestionat per l'aplicació Gestor d'Esdeveniments.",
          timeZone: 'Europe/Madrid' // O obtenir-ho del calendari principal de l'usuari
        }
      });
      console.log(`Calendari creat amb ID: ${newCalendar.data.id}`);
      return newCalendar.data.id;
    }
  } catch (error) {
    console.error("Error buscant o creant el calendari de l'aplicació:", error);
    throw error; // Propaguem l'error per gestionar-lo més amunt
  }
}

function createWindow() {
  ensureDirectoriesExist();
  loadGoogleCredentials(); 
  const sessionData = loadSessionData();

  mainWindow = new BrowserWindow({
    width: sessionData.width || 1200,
    height: sessionData.height || 800,
    x: sessionData.x,
    y: sessionData.y,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.env.NODE_ENV === 'development') {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl).catch(err => {
      console.error('Error loading dev URL:', devUrl, err);
      dialog.showErrorBox('Error de Desenvolupament', `No s'ha pogut carregar ${devUrl}: ${err.message}`);
    });
  } else {
    const indexPath = path.resolve(__dirname, 'dist', 'index.html');
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Error loading production index file:', indexPath, err);
      dialog.showErrorBox('Error de Càrrega', `No s'ha pogut carregar l'aplicació: ${err.message}`);
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

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // >>> CANVI PRINCIPAL EN LA LÒGICA DE TANCAMENT <<<
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault(); // Prevenim que la finestra es tanqui directament
      app.quit(); // Iniciem el flux de sortida de l'aplicació
    }
  });
}

app.on('before-quit', async (event) => {
  if (isQuitting) {
    return;
  }
  event.preventDefault();
  if (mainWindow && !mainWindow.isDestroyed()) {
    const windowBounds = mainWindow.getBounds();
    await saveSessionWindowData({
      width: windowBounds.width,
      height: windowBounds.height,
      x: windowBounds.x,
      y: windowBounds.y
    });
  }
  const choice = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Sí, sortir', 'No, cancel·lar'],
    defaultId: 1,
    title: 'Confirmar sortida',
    message: 'Estàs segur que vols sortir?',
    cancelId: 1,
  });
  if (choice.response === 0) {
    isQuitting = true;
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('confirm-quit-signal');
    }
    
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


// NOU LISTENER: S'executa quan el frontend ha acabat de desar les dades.
ipcMain.on('quit-confirmed-by-renderer-signal', async () => {
  console.log("Backend rebut 'quit-confirmed'. Iniciant backup i sortida final.");
  await createBackup();
  await cleanupOldBackups();
  setTimeout(() => {
    app.exit();
  }, 500); // Un petit temps de marge per si de cas
});

ipcMain.on('log-message', (event, message, data) => {
  logToFile(`[FRONTEND] ${message}`, data);
});

ipcMain.handle('load-app-data', async () => {
  console.log("[IPC_IN] Rebut 'load-app-data'.");
  if (!DATA_FILE) {
    console.error("LOGIC ERROR: DATA_FILE no està definit.");
    return null;
  }
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
      const data = fileContent.trim() ? JSON.parse(fileContent) : null;
      console.log(`Dades carregades de ${DATA_FILE}.`, { size: fileContent.length, hasData: !!data });
      return data;
    }
    console.log(`El fitxer de dades ${DATA_FILE} no existeix. Retornant null.`);
  } catch (error) {
    console.error('Error crític carregant dades de l\'aplicació:', error);
    dialog.showErrorBox("Error de Càrrega", `No s'han pogut carregar les dades des de ${DATA_FILE}.\nError: ${error.message}`);
  }
  return null;
});

ipcMain.handle('save-app-data', (event, data) => {
  console.log("[IPC_IN] Rebut 'save-app-data'.");
  const success = saveDataWithErrorHandling(DATA_FILE, data);
  console.log(`Resultat de 'save-app-data': ${success ? 'ÈXIT' : 'FALLADA'}`);
  return success;
});


ipcMain.handle('sync-with-google', async (event, localData) => {
  console.log("[IPC_IN] Iniciant 'sync-with-google'.");
  if (!googleAuthClient || !googleAuthClient.credentials.access_token) {
    console.error("SYNC ERROR: No autenticat amb Google.");
    return { success: false, message: 'No autenticat amb Google.' };
  }
  
  const calendar = google.calendar({ version: 'v3', auth: googleAuthClient });
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const config = loadGoogleConfigFromFile();

   if (!config?.appCalendarId) {
    console.error("SYNC ERROR: No s'ha trobat appCalendarId a la configuració.");
    return { success: false, message: "No s'ha trobat el calendari de l'aplicació. Si us plau, reconnecta el teu compte." };
  }

  const appCalendarId = config.appCalendarId;
  const suffix = config.calendarSuffix ? ` - ${config.calendarSuffix}` : '';
  const finalCalendarName = `${APP_CALENDAR_BASE_NAME}${suffix}`;

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
    // FASE 1: BUIDAR COMPLETAMENT EL CALENDARI
    console.log(`Buidant el calendari de l'app a Google: ${appCalendarId}`);
    const res = await calendar.events.list({ calendarId: appCalendarId, maxResults: 2500 });
    const eventsToDelete = res.data.items;
    if (eventsToDelete && eventsToDelete.length > 0) {
      console.log(`Trobats ${eventsToDelete.length} esdeveniments per eliminar...`);
      for (const event of eventsToDelete) {
        try {
          await calendar.events.delete({ calendarId: appCalendarId, eventId: event.id });
          await delay(200);
        } catch (err) {
          if (err.code !== 404 && err.code !== 410) console.error(`Error eliminant l'esdeveniment "${event.summary}":`, err.message);
        }
      }
    }

    // FASE 2: PUJAR TOTS ELS ESDEVENIMENTS DES DE L'APP LOCAL
    const localFramesToUpload = localData.eventFrames;
    console.log(`Pujant ${localFramesToUpload.length} esdeveniments locals al calendari de l'app...`);
    
    for (const localFrame of localFramesToUpload) {
      const getPersonGroupById = (id) => localData.peopleGroups.find(p => p.id === id);

      // --- CONSTRUCCIÓ DE LA DESCRIPCIÓ ENRIQUIDA ---
      let descriptionParts = [];
      if (localFrame.generalNotes) {
        descriptionParts.push(localFrame.generalNotes);
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
          calendarId: appCalendarId,
          requestBody: eventResource,
        });
        localFrame.googleEventId = newGoogleEvent.data.id;
        localFrame.googleCalendarId = appCalendarId;
        localFrame.lastModified = newGoogleEvent.data.updated;
        localFrame.lastSync = new Date().toISOString();
        console.log(`  -> Esdeveniment "${localFrame.name}" pujat amb èxit. ID de Google: ${newGoogleEvent.data.id}`);
      } catch (err) {
        console.error(`Error creant "${localFrame.name}" a Google:`, err.message, err.response?.data);
      }
      await delay(250);
    }

    // FASE 3: RETORNAR LES DADES LOCALS ACTUALITZADES
    console.log("SYNC: Sincronització completada amb èxit.");
    return { success: true, message: 'Sincronització completada amb èxit.', data: localData };

  } catch (error) {
    console.error('Error crític durant la sincronització unidireccional:', error);
    return { success: false, message: `Error de sincronització: ${error.message}` };
  }
});

ipcMain.handle('google-auth-start', async () => {
  console.log("[IPC_IN] Iniciant 'google-auth-start'.");
  if (!googleAuthClient) {
    console.error("AUTH ERROR: googleAuthClient no inicialitzat.");
    return { success: false, message: "El client d'autenticació de Google no s'ha iniciat correctament." };
  }

  return new Promise((resolve) => {
    const server = http.createServer();

    const closeServerAndResolve = (result) => {
      if (server.listening) {
        server.close();
      }
      resolve(result);
    };

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const redirectUri = `http://localhost:${port}`;
      googleAuthClient.redirectUri = redirectUri;

      const authUrl = googleAuthClient.generateAuthUrl({
        access_type: 'offline', prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/calendar'],
      });
      
      console.log(`Servidor d'autenticació escoltant al port ${port}. Obrint URL d'autenticació.`);
      require('electron').shell.openExternal(authUrl);
    });

    server.on('request', async (req, res) => {
      const qs = new url.URL(req.url, 'http://localhost').searchParams;
      const code = qs.get('code');
      
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
        console.log("Tokens obtinguts i desats. Buscant o creant calendari de l'app...");
        
        const calendar = google.calendar({ version: 'v3', auth: googleAuthClient });
        const appCalendarId = await findOrCreateAppCalendar(calendar);
        
        // Desem l'ID del calendari a la configuració
        const config = loadGoogleConfigFromFile() || { selectedCalendarIds: [] };
        config.appCalendarId = appCalendarId;
        if (!config.selectedCalendarIds.includes(appCalendarId)) {
          config.selectedCalendarIds.push(appCalendarId);
        }
        fs.writeFileSync(GOOGLE_CONFIG_PATH, JSON.stringify(config, null, 2));
        console.log("Configuració de Google desada. Enviant senyal d'èxit al renderer.");
        
        mainWindow.webContents.send('google-auth-success');
        res.end('<h1>Autenticació completada!</h1><p>Pots tancar aquesta pestanya.</p>');
        closeServerAndResolve({ success: true });

      } catch (e) {
        console.error("Error en el callback d'autenticació:", e.message);
        mainWindow.webContents.send('google-auth-error', e.message);
        res.writeHead(500);
        res.end('<h1>Error d\'autenticació</h1>');
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

ipcMain.handle('save-google-config', (event, config) => {
  console.log("[IPC_IN] Rebut 'save-google-config'.");
  try {
    fs.writeFileSync(GOOGLE_CONFIG_PATH, JSON.stringify(config, null, 2));
    return { success: true };
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

    // Obtenim la llista de calendaris disponibles per poder assignar colors
    const calendarListResponse = await calendar.calendarList.list();
    const availableCalendars = calendarListResponse.data.items || [];

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
        const color = calendarId === config.appCalendarId ? '#D32F2F' : (calendarInfo?.backgroundColor || '#2196F3');

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


ipcMain.handle('clear-google-app-calendar', async () => {
  console.log("[IPC_IN] Rebut 'clear-google-app-calendar'.");
  if (!googleAuthClient || !googleAuthClient.credentials.access_token) {
    return { success: false, message: 'No autenticat amb Google.' };
  }
  
  const calendar = google.calendar({ version: 'v3', auth: googleAuthClient });
  const config = loadGoogleConfigFromFile();

  if (!config?.appCalendarId) {
    return { success: true, message: "No hi ha calendari de l'app per netejar." };
  }
  const appCalendarId = config.appCalendarId;

  try {
    console.log(`Iniciant buidatge d'esdeveniments del calendari de l'app: ${appCalendarId}`);
    
    // 1. Obtenim tots els esdeveniments del calendari de l'app
    const res = await calendar.events.list({
      calendarId: appCalendarId,
      maxResults: 2500, // Un límit alt per assegurar que els agafem tots
    });

    const eventsToDelete = res.data.items;
    
    if (!eventsToDelete || eventsToDelete.length === 0) {
      console.log('El calendari de Google de l\'app ja estava buit.');
      return { success: true, message: "El calendari de l'app ja està buit." };
    }

    console.log(`Trobats ${eventsToDelete.length} esdeveniments per eliminar a Google.`);
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // 2. Esborrem cada esdeveniment un per un
    for (const event of eventsToDelete) {
      try {
        await calendar.events.delete({
          calendarId: appCalendarId,
          eventId: event.id,
        });
        console.log(`  -> Eliminat de Google: "${event.summary}" (${event.id})`);
        await delay(200); // Pausa per no excedir els límits de l'API
      } catch (err) {
        // Ignorem errors si l'esdeveniment ja no existeix (codi 410)
        if (err.code !== 410) {
          console.error(`Error eliminant l'esdeveniment "${event.summary}":`, err.message);
        }
      }
    }
    
    return { success: true, message: "El calendari de Google de l'app ha estat buidat correctament." };
  } catch (error) {
    console.error("Error buidant el calendari de l'app a Google:", error.message);
    return { success: false, message: `Error buidant el calendari de Google: ${error.message}` };
  }
});

  


process.on('uncaughtException', (error) => {
  console.error('Excepció no capturada:', error);
  dialog.showErrorBox('Error Inesperat', `S'ha produït un error no controlat: ${error.message}`);
  app.exit(1);
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

  // Comprova si ja s'ha mostrat el diàleg per evitar bucles
  if (!hasShownUncaughtExceptionDialog) {
    hasShownUncaughtExceptionDialog = true;
    dialog.showErrorBox('Error Inesperat', `S'ha produït un error no controlat: ${error.message}\n\nL'aplicació es tancarà.`);
    
    // Forcem la sortida DESPRÉS de mostrar el diàleg
    setTimeout(() => app.exit(1), 500);
  }
});



// <<< FUNCIÓ MODIFICADA >>>
ipcMain.handle('perform-hard-reset', async () => {
  console.log("[IPC_IN] Rebut 'perform-hard-reset'.");
  console.log("Iniciant Reset de Fàbrica...");
  
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

  eliminarFitxerDeFormaSegura(DATA_FILE, `Fitxer de dades (${path.basename(DATA_FILE)})`);
  eliminarFitxerDeFormaSegura(GOOGLE_TOKENS_PATH, `Fitxer de tokens de Google (${path.basename(GOOGLE_TOKENS_PATH)})`);
  eliminarFitxerDeFormaSegura(GOOGLE_CONFIG_PATH, `Fitxer de configuració de Google (${path.basename(GOOGLE_CONFIG_PATH)})`);

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

ipcMain.handle('get-default-data-path', () => {
  console.log("[IPC_IN] Rebut 'get-default-data-path'.");
  if (DATA_FILE) {
    return getRelativePath(DATA_FILE);
  }
  return 'Ruta no definida';
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
    fs.writeFileSync(result.filePath, data);
    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('Error desant el fitxer:', error);
    return { success: false, message: `Error en desar el fitxer: ${error.message}` };
  }
});

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});