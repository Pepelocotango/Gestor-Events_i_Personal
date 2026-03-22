# Memòria del Projecte - GEP

## Estat del Projecte (Març 2026)
- **Repositori:** Creat i amb estructura bàsica de desktop (`src/`) i mòbil (`mobile_app/`).
- **Objectiu:** Crear un gestor d'esdeveniments complet amb visualització de calendaris, personal i gestió de material.
- **Sincronització Individual:** Implementació de `sync-single-event-with-google` al backend per permetre actualitzacions quirúrgiques sense esborrar tot el calendari.
- **Simplificació del Guardat:** Eliminació del botó de desar manual en les fitxes de bolo (`TechSheetForm`) per evitar confusió amb el guardat a disc. Es confia en el desat automàtic al desmuntar i en el flux de guardat global (Ctrl+S).

## Coneixement Profund de l'Arquitectura
- **Internacionalització (i18n):** Sistema basat en `i18next` amb suport per a CA (defecte), ES i EN. Gestió granular de tooltips per a una millor UX.
- **Ecosistema Web:** Landing page multilingüe construïda amb Astro i React, desplegada a Vercel.
- **CI/CD:** Workflows de GitHub Actions per a la generació automatitzada de binaris (AppImage, EXE, DMG) i builds mòbils, incloent injecció de secrets de Google.
- **Splash Screen:** Seqüència animada de 9 frames (`src/assets/splash/`) gestionada per React durant la càrrega inicial.
- **GPU i Rendiment:** Acceleració per hardware desactivada per defecte per estabilitat; configurable per l'usuari i persistida a `session.json`.
- **Logos:** Sistema multi-format a `build/icons/` per a compatibilitat total amb sistemes operatius (Linux, Win, Mac).

## Mapa de la Interfície d'Usuari (UI)

### Desktop App (Electron)
- **Vistes Principals (Pestanyes):**
    - **Calendari / Llista:** Gestió central d'esdeveniments.
    - **Resums:** Informes de personal i material.
    - **Fitxes de Bolo:** Detalls tècnics i logística de producció.
    - **Persones:** Gestió de la llibreta d'adreces.
    - **Material:** Inventari de material propi i extern.
    - **Actuacions:** Gestió artística, avançament i escaletes (Fase 4).
- **Modals i Diàlegs:**
    - **Formularis:** `addEventFrame`, `editEventFrame`, `addAssignment`, `editAssignment`.
    - **Google:** `googleSettings`, `createAppCalendar`, `selectSyncCalendar`, `googleEventDetails`.
    - **Utilitats:** `pdfPreview`, `history`, `about`, `mergeOrReplace`.
    - **Confirmacions:** `confirmDelete`, `confirmHardReset`, `confirmDataRepair`, `confirmDuplicate`.

### Mobile App (Expo/React Native)
- **Navegació (Bottom Tabs):**
    - **Events:** Accés a la gestió d'esdeveniments i assignacions.
    - **Calendari:** Vista mensual d'activitat.
    - **Fitxes:** Consulta ràpida de dades tècniques.
    - **Persones:** Consulta de contactes de personal.
    - **Material:** Inventari ràpid.
    - **C. Control:** Càlcul de pics de demanda de material.
    - **Resums:** Vista simplificada d'informes.
- **Pantalles de Detall i Edició:**
    - `EventDetail`, `TechSheetDetail`: Vistes de consulta.
    - `EventForm`, `PersonForm`, `MaterialForm`: Edició de dades base.
    - `AssignmentForm`: Gestió d'assignacions de personal.

## Ecosistema Web (Landing Page)
- **Tecnologia:** Construïda amb **Astro**, **React** i **Tailwind CSS**. Està optimitzada per a ser ultra-ràpida i SEO-friendly.
- **Navegació i Seccions (SPA/Landing):**
    - **Hero:** Presentació visual de l'App amb l'animació de Splash Screen integrada.
    - **Funcionalitats:** Detall dels mòduls (Esdeveniments, Personal, Material, Google Calendar).
    - **Instal·lació:** Guia ràpida per a les diferents plataformes (AppImage, EXE, APK).
    - **Contacte:** Formulari gestionat via `gep-mailer.astro`.
- **Rutes Multilingües:**
    - `/ca`: Versió en català (principal).
    - `/es`: Versió en espanyol.
    - `/en`: Versió en anglès.
- **Funcionalitats i Pàgines:**
    - **gep-mailer.astro:** Pàgina i component especialitzat per a la gestió de contacte o subscripcions.
    - **Previsualitzacions:** Inclou captures de pantalla i una demo visual de l'App de Desktop (`AnimatedSplash`).
    - **index.astro:** Orquestrador principal de la landing.
- **Desplegament:** Hostatjada a **Vercel** (`gestor-events.vercel.app`), configurada com a **sortida estàtica** per a un rendiment òptim.

## Context Tècnic Verificat (Punt a Punt)

### 1. Backend Desktop (`main.cjs`)
- **Instància Única:** Implementat bloqueig per evitar múltiples finestres.
- **IPC Handlers:** Centralització de la persistència (lectura/escriptura de `.gep` i `.json`).
- **Google Calendar:** Doble via d'auth (Service Account per lectura general, OAuth2 per escriptura d'usuari).
- **GPU:** Gestió de l'acceleració per hardware abans del `ready` de l'app.

### 2. Bridge de Seguretat (`preload.cjs`)
- **Context Bridge:** Exposició segura de `electronAPI` sense Node.js a la UI.
- **Comunicació:** Mapeig complet de mètodes per a Google Sync, Diàlegs del sistema i gestió de fitxers.
- **Notificacions:** Listeners per a l'estat de la sincronització i versions.

### 3. Store de Dades (`src/stores/eventDataStore.ts`)
- **Zustand + Zundo:** Middleware per a historial de canvis (Undo/Redo).
- **Immer:** Garantia d'immutabilitat en les mutacions d'esdeveniments i personal.
- **Lògica de Persistència:** Gestió del flag `hasUnsavedChanges` que bloqueja el tancament de l'app si hi ha canvis pendents.
- **Sincronització Quirúrgica:** Accions per sincronitzar esdeveniments individuals amb Google Calendar.

### 4. Gestió de Modals (`src/stores/modalStore.ts` i `src/App.tsx`)
- **Store de Modals:** Sistema centralitzat (`useModalStore`) per obrir, tancar i actualitzar les dades de qualsevol diàleg de l'app.
- **Orquestrador de UI (`App.tsx`):** Un gran "switch" (`renderModalContent`) que munta el component de React segons el tipus de modal (`ModalType`).
- **Integració de Confirmacions:** Diàleg genèric `ConfirmDeleteModal` per a múltiples tipus d'elements, amb callbacks dinàmics de confirmació.
- **Dades de Modal:** L'objecte `ModalData` permet passar IDs, noms i funcions personalitzades per a cada interacció (PDFs, Google Settings, etc.).

### 5. Navegació i Rutes (`src/components/Navigation.tsx` i `src/App.tsx`)
- **HashRouter:** Implementació de rutes compatible amb Electron per a una navegació fluida entre mòduls.
- **Pestanyes (Tabs):** 6 rutes principals (`/`, `/summaries`, `/tech-sheets`, `/people`, `/material`, `/performances`) amb estats actius visualment diferenciats.
- **Pantalla de Benvinguda:** `WelcomeScreen` que gestiona l'estat inicial quan no hi ha cap document obert, permetent obrir fitxers recents o crear-ne de nous.
- **Navegació Dinàmica:** Ús de `NavLink` amb tooltips integrats per a una millor accessibilitat i UX.

### 6. Pantalla Principal i Llista d'Esdeveniments (`src/components/MainDisplay.tsx` i `src/components/EventFrameCard.tsx`)
- **MainDisplay:** Component contenidor que alterna entre la vista de Calendari (FullCalendar) i la llista filtrable d'esdeveniments.
- **FullCalendar:** Configuració multi-vista (mes, 4 mesos, etc.) amb gestió d'esdeveniments interactius per obrir detalls o editar.
- **EventFrameCard:** Representació visual dels esdeveniments que llista les assignacions de personal, indicant el seu estat i oferint accions ràpides (editar, duplicar, sincronització individual Google).
- **Controls de Filtre:** Sistema superior per a la cerca i filtratge dinàmic per múltiples criteris (noms, llocs, persones, dates).

### 7. Fitxes de Bolo i Personal Tècnic (`src/components/tech_sheets/`)
- **Arquitectura Buffered (`useBufferedSave`):** Sistema de doble capa de dades. Els canvis es mantenen en un buffer local (RAM) per optimitzar el rendiment de renderitzat i només es sincronitzen amb l'store global de Zustand en moments crítics (desmuntar component o guardat global).
- **Gestió de Seccions:** Formulari modular que inclou Logística, Personal Tècnic, Material, Il·luminació, So i Vídeo.
- **Drag-and-Drop (DND):** Integració de `@dnd-kit` per a la reordenació dinàmica de proveïdors i personal, operant sobre el buffer local per a una resposta instantània.
- **Integració de Material:** Consulta en temps real de l'inventari global per validar la disponibilitat d'estoc mentre s'edita la fitxa, sense necessitat de persistència immediata a disc.
- **Persistència Segura:** El flag `hasUnsavedChanges` es coordina amb el buffer per assegurar que cap edició tècnica es perdi en tancar l'aplicació.

### 8. Centre de Control de Material (`src/components/MaterialControlCenter.tsx` i `src/utils/materialAvailability.ts`)
- **Lògica de Pics (Concurrent Demand):** Càlcul de la demanda màxima d'un ítem en un sol dia dins d'un període, oferint una previsió d'estoc real i evitant falses alarmes per sumatori mensual.
- **Detecció d'Alertes:** Identificació visual automàtica dels ítems on el pic d'ús simultani supera l'estoc disponible.
- **Desglossament d'Ús:** Vista detallada que mostra en quins esdeveniments i dates s'està utilitzant cada material per facilitar la logística externa o el lloguer puntual.
- **Càlcul Dinàmic:** Algorisme de `materialAvailability.ts` que recorre totes les fitxes de bolo del projecte per obtenir una visió 360º de la demanda d'inventari.

### 9. Mòdul d'Actuacions Artístiques (Fase 4)
- **Estat del Desenvolupament:** Mòdul actualment en fase inicial ("verd"), funcional però amb gran marge de millora, refactorització i optimització de la interfície.
- **Gestió Integral d'Artistes:** Sistema per crear, editar i reordenar actuacions dins d'un esdeveniment marc.
- **Control d'Avançament (Advancing):** Seguiment visual del flux de treball en 4 fases: Rider Rebut, Contra-rider Enviat, Horaris Confirmats i Hospitality Tancat.
- **Sub-formularis Tècnics:** Gestió de dades d'alt nivell incloent Input Lists (ordenables via DND), necessitats de llums, vídeo i plànols d'escenari.
- **Mòdul de Hospitality:** Control de detalls logístics com càtering, dietes, camerinos, allotjament i aparcament per a les companyies.
- **Exportació Especialitzada:** Generació de Riders individuals per artista i Escaletes Artístiques globals per a l'esdeveniment, independents de la fitxa tècnica de producció.

### 10. Exportació i Resums (`src/utils/pdfResumExport.ts` i `src/utils/csvExport.ts`)
- **PDF Professional (`jspdf`):** Generació d'informes de resum amb taules estructurades (`jspdf-autotable`), capçaleres amb logos i numeració de pàgines.
- **Noms de Fitxer Intel·ligents:** Algorisme que genera noms de fitxer descriptius basats automàticament en els filtres aplicats per l'usuari (ex: `Llista_Esdeveniments_Persona_Pep_+Filtres.pdf`).
- **Exportació CSV:** Generació de fitxers de dades tabulars per a l'anàlisi externa en fulls de càlcul (Excel/Google Sheets).
- **Consistència Visual:** Els informes respecten l'ordenació jeràrquica (categoria, origen, nom) i els filtres actius en el moment de la generació.

### 11. Aplicació Mòbil (Expo / React Native)
- **Estructura de Navegació:** Ús de `Bottom Tab Navigator` i `Stack Navigators` per a una experiència fluida entre les 7 rutes principals (Events, Calendari, Fitxes, Persones, Material, Control, Resums).
- **Persistència de Dades:** Gestió de fitxers `.gep` i `.json` en entorns mòbils, integrant selectors natius per treballar amb emmagatzematge local i serveis al núvol (Drive, Dropbox).
- **Coherència de l'Estat:** Implementació de l'store de Zustand compartint la lògica de dades de la versió Desktop per garantir que les regles de negoci (pics de material, estats d'assignació) siguin idèntiques.
- **UI Adaptativa:** Disseny basat en components mòbils natius, incloent Botons d'Acció Flotants (FAB) per a la creació ràpida i modals optimitzats per a pantalles tàctils.
- **Mode Fosc Natiu:** Suport complet per al tema fosc amb persistència de la preferència de l'usuari.

### 12. Ecosistema Web (Landing Page)
- **Generació Estàtica (Astro + React):** Lloc web ultra-ràpid i SEO-friendly amb sortida estàtica per a un rendiment òptim.
- **Internacionalització Web:** Sistema de rutes multilingüe (`/ca/`, `/es/`, `/en/`) amb selector d'idioma integrat i navegació transparent.
- **Demo Visual (`AnimatedSplash`):** Integració del component React de l'animació d'inici original a la web per a una previsualització fidel de l'app d'escriptori.
- **Desplegament (Vercel):** Hostatjament automatitzat a `gestor-events.vercel.app` amb configuració de rutes i enviament de formularis (`gep-mailer.astro`).

## Tasques Pendents
- [x] Configuració de context de Gemini (Març 2026).
- [x] Sincronització individual per a esdeveniments (Google Calendar).
- [ ] Implementació de funcions segons les teves indicacions.
