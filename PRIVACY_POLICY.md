# Política de Privadesa per a Gestor d'Esdeveniments i Personal

**Última actualització:** 19 de novembre de 2025

La teva privadesa és la nostra màxima prioritat. Aquesta política de privadesa explica com l'aplicació "Gestor d'Esdeveniments i Personal" gestiona les teves dades. El nostre enfocament és senzill: les teves dades són teves, i només teves.

### 1. Les Teves Dades, El Teu Control: La Nostra Filosofia

L'aplicació ha estat dissenyada amb un enfocament **100% local**. Això significa que:

*   **Totes les dades que introdueixes** (esdeveniments, contactes, notes, material, etc.) **es guarden exclusivament al teu ordinador o dispositiu mòbil.**
*   Les dades **mai surten del teu dispositiu**, tret que tu decideixis explícitament desar el fitxer de dades en una ubicació de xarxa o un servei al núvol (com Google Drive o Dropbox).
*   **L'autor de l'aplicació (Pëp) no té, ni pot tenir, cap accés a la teva informació.**

### 2. Dades de l'Aplicació (Fitxers de Dades)

Quan utilitzes l'aplicació, totes les teves dades de treball (esdeveniments, contactes) s'emmagatzemen en un fitxer amb format `.gep` per defecte. L'aplicació també manté compatibilitat amb l'obertura i desat de fitxers en format `.json`.

*   **Format Predeterminat (.gep):** A partir de la versió 1.6.0, l'aplicació utilitza el format natiu `.gep` per desar les teves dades. Aquest format és idèntic en contingut al format `.json` però amb una extensió específica que facilita la identificació dels fitxers de l'aplicació.
*   **Compatibilitat amb .json:** L'aplicació pot obrir i desar fitxers en format `.json` per mantenir la compatibilitat amb versions anteriors o amb altres eines.
*   **Ubicació:** Tu, com a usuari, tries on desar aquests fitxers. Poden estar a qualsevol carpeta del teu ordinador.
*   **Format de dades:** Aquests fitxers s'emmagatzemen en **text pla**. Això vol dir que no estan xifrats. Qualsevol persona amb accés a aquests fitxers podria llegir-ne el contingut.
*   **Responsabilitat:** La seguretat d'aquests fitxers de dades és la teva responsabilitat. Et recomanem que els guardis en una ubicació segura i protegida, com una carpeta xifrada o un directori protegit per contrasenya si el teu sistema operatiu ho permet.

### 3. Fitxers de Configuració Locals

L'aplicació crea alguns fitxers de configuració addicionals a la carpeta de dades de l'usuari del teu sistema operatiu per millorar la teva experiència. Aquests fitxers també es guarden exclusivament al teu dispositiu.

*   `session.json`: Emmagatzema la mida i posició de la finestra i una llista dels fitxers recents que has obert.
*   `google-config.json` i `google-tokens.json`: Si utilitzes la integració amb Google Calendar, aquests fitxers guarden la teva configuració i els tokens d'autenticació de manera segura al teu ordinador.
*   `backups/`: L'aplicació crea còpies de seguretat automàtiques del teu fitxer de dades en aquesta carpeta per prevenir pèrdues accidentals.

### 4. Integració amb Google Calendar (Opcional)

Si decideixes connectar l'aplicació amb el teu compte de Google, sol·licitarem els següents permisos:

*   **Veure la teva adreça de correu electrònic principal (`userinfo.email`):** S'utilitza per identificar el teu compte i compartir amb tu els calendaris que l'aplicació crea.
*   **Veure i descarregar els teus calendaris (`calendar.readonly`):** Permet a l'aplicació mostrar els esdeveniments dels teus calendaris personals en mode de només lectura. **L'aplicació mai modificarà els teus calendaris personals.**
*   **Gestionar els calendaris que l'aplicació ha creat (`https://www.googleapis.com/auth/calendar`):** L'aplicació només té permís d'escriptura sobre els calendaris que ella mateixa crea ("Gestor d'Esdeveniments (App)"). Això s'utilitza per a la funció de sincronització.

Els tokens d'autenticació obtinguts de Google s'emmagatzemen localment al teu dispositiu i només s'utilitzen per comunicar-se amb l'API de Google.

### 5. Dades que NO Recopilem

Per ser absolutament clars, l'autor i l'aplicació **no recopilen, emmagatzemen, ni tenen accés a cap de les teves dades personals o d'ús**, incloent-hi:

*   El contingut dels teus fitxers de dades.
*   Analítiques d'ús o telemetria.
*   Informació del teu dispositiu.
*   La teva adreça IP o ubicació.

### 6. Els Teus Drets i Responsabilitats

Com que totes les dades són al teu dispositiu, tens el control total:
*   Pots veure, modificar i eliminar els teus fitxers de dades en qualsevol moment.
*   Ets responsable de fer còpies de seguretat addicionals i de protegir l'accés als teus fitxers.

### 7. Canvis a la Política

Aquesta política de privadesa pot ser actualitzada en el futur. Qualsevol canvi es comunicarà a través del `README.md` del projecte o dins de la pròpia aplicació.

### 8. Contacte

Si tens qualsevol pregunta sobre aquesta política de privadesa, si us plau, obre una "Issue" al [repositori de GitHub del projecte](https://github.com/Pepelocotango/Gestor-Events_i_Personal).

---

# Privacy Policy for Events & Staff Manager

**Last Updated:** November 19, 2025

Your privacy is our highest priority. This privacy policy explains how the "Events & Staff Manager" application handles your data. Our approach is simple: your data is yours, and yours alone.

### 1. Your Data, Your Control: Our Philosophy

The application has been designed with a **100% local-first** approach. This means that:

*   **All the data you enter** (events, contacts, notes, materials, etc.) **is saved exclusively on your computer or mobile device.**
*   The data **never leaves your device** unless you explicitly choose to save the data file in a network location or a cloud service (like Google Drive or Dropbox).
*   **The application's author (Pëp) does not have, and cannot have, any access to your information.**

### 2. Application Data (`.gep` and `.json` Files)

When you use the application, all your work data (events, contacts) is stored by default in a file with a `.gep` format. The application also maintains compatibility with opening and saving files in `.json` format.

*   **Default Format (.gep):** Starting from version 1.6.0, the application uses the native `.gep` format to save your data. This format is identical in content to the `.json` format but with a specific extension that makes it easier to identify the application's data files.
*   **JSON Compatibility:** The application can open and save files in `.json` format to maintain compatibility with previous versions or other tools.
*   **Location:** You, as the user, choose where to save these files. They can be in any folder on your computer.
*   **Data Format:** These files are stored in **plain text**. This means they are not encrypted. Anyone with access to these files could read their contents.
*   **Responsibility:** The security of these data files is your responsibility. We recommend storing them in a secure and protected location, such as an encrypted folder or a password-protected directory if your operating system allows it.

### 3. Local Configuration Files

The application creates some additional configuration files in your operating system's user data folder to improve your experience. These files are also stored exclusively on your device.

*   `session.json`: Stores the window size and position, and a list of recent files you have opened.
*   `google-config.json` and `google-tokens.json`: If you use the Google Calendar integration, these files store your settings and authentication tokens securely on your computer.
*   `backups/`: The application creates automatic backups of your main data file in this folder to prevent accidental data loss.

### 4. Google Calendar Integration (Optional)

If you decide to connect the application to your Google account, we will request the following permissions:

*   **See your primary email address (`userinfo.email`):** Used to identify your account and share with you the calendars that the application creates.
*   **See and download your calendars (`calendar.readonly`):** Allows the application to display events from your personal calendars in read-only mode. **The application will never modify your personal calendars.**
*   **Manage the calendars the application has created (`https://www.googleapis.com/auth/calendar`):** The application only has write permission over the calendars it creates itself ("Gestor d'Esdeveniments (App)"). This is used for the synchronization feature.

The authentication tokens obtained from Google are stored locally on your device and are only used to communicate with the Google API.

### 5. Data We DO NOT Collect

To be absolutely clear, the author and the application **do not collect, store, or have access to any of your personal or usage data**, including:

*   The content of your data files.
*   Usage analytics or telemetry.
*   Information about your device.
*   Your IP address or location.

### 6. Your Rights and Responsibilities

Since all data is on your device, you have full control:
*   You can view, modify, and delete your data files at any time.
*   You are responsible for making additional backups and for protecting access to your files.

### 7. Changes to the Policy

This privacy policy may be updated in the future. Any changes will be communicated through the project's `README.md` or within the application itself.

### 8. Contact

If you have any questions about this privacy policy, please open an "Issue" on the [project's GitHub repository](https://github.com/Pepelocotango/Gestor-Events_i_Personal).