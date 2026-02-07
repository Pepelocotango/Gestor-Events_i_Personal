# Diff i novetats: commit d7ae802 → estat actual

**Commit de referència:** `d7ae80277adf5f1c5a47914d6a4d0ddc6f146818`  
**Resum:** 42 fitxers canviats, +12.627 línies, -7.472 línies.

---

## 1. Nou mòdul d’actuacions (FASE 4)

S’ha afegit un **mòdul complet per a la gestió d’actuacions artístiques** dins dels esdeveniments.

### Components nous

| Component | Descripció |
|-----------|------------|
| **PerformancesDisplay.tsx** | Vista principal: selector d’esdeveniment, llista + detall, exportació PDF. |
| **PerformanceList.tsx** | Llista ordenable (drag-and-drop) amb botó “Afegir actuació” i indicadors de dades tècniques. |
| **SortablePerformance.tsx** | Element d’actuació amb editar/eliminar i indicador si té input list. |
| **PerformanceDetailContainer.tsx** | Contenidor amb pestanyes: Bàsic \| Tècnic \| Hospitality. |
| **PerformanceBasicForm.tsx** | Formulari bàsic: nom, contacte (persona, email, telèfon), horaris (arribada, soundcheck, show, sortida), notes. |
| **PerformanceTechForm.tsx** | Formulari tècnic: taula dinàmica d’input list (canal, etiqueta, mic/DI, notes), notes de llums, vídeo i escenari. |
| **PerformanceHospitalityForm.tsx** | Formulari d’hospitalitat: camerinos, càtering, dietes, logística de viatge, pàrquing. |
| **PerformanceAdvancing.tsx** | Control d’avançament: 4 estats (Rider Rebut, Contra-rider Enviat, Horaris Confirmats, Hospitality Tancat) amb barra de progrés i badges. |
| **SortableInputRow.tsx** | Fila ordenable per a l’input list tècnic. |

### Model de dades (types.ts)

- **Performance**: id, name, type, contactName/Phone/Email, notes, status, horaris (arrival, soundCheck, show, departure, duration), techData, hospitalityData, advancing.
- **PerformanceAdvancing**: riderReceived, counterRiderSent, schedulesConfirmed, hospitalityClosed.
- **PerformanceTechData**: inputList (InputListItem[]), lightingNotes, videoNotes, stageRequirements.
- **PerformanceHospitalityData**: dressingRooms, cateringNotes, dietaryRequirements, travelLogistics, parkingNotes.
- **InputListItem**: id, channel, label, micRider, micContra, stand, notes (amb camps opcionals patchColor, patchNumber).
- **EventFrame**: nou camp opcional `performances?: Performance[]`.

### Integració a l’app

- **Navigation**: nou enllaç “Actuacions” amb ruta `/performances` i tooltip.
- **App.tsx**: ruta `<Route path="/performances" element={<PerformancesDisplay />} />` i lazy load de `PerformancesDisplay`.
- **eventDataStore**: noves accions `addPerformance`, `updatePerformance`, `deletePerformance` i lògica per mantenir `performances` dins de cada `EventFrame`.

---

## 2. Exportació PDF (pdfGenerator.ts)

S’han afegit **tres funcions d’exportació** relacionades amb actuacions:

1. **exportPerformanceToPdf**  
   Rider individual d’una actuació: capçalera de l’esdeveniment, seccions bàsic, tècnic i hospitality, taules d’input list, colors temàtics.

2. **exportEventPerformancesSummaryPdf**  
   Resum en PDF de totes les actuacions de l’esdeveniment.

3. **exportRegidoriaSummaryPdf**  
   **Full de Ruta del Regidor**: combina horaris generals de la fitxa de bolo amb horaris d’actuacions (prefixos [ARRIBADA], [PROVES], [SHOW]), notes crítiques de regidoria i ordenació cronològica.

El fitxer `pdfGenerator.ts` ha crescut amb la lògica per a taules, capçaleres i formatació d’aquests PDFs.

---

## 3. Sessió i persistència (preload + Electron)

- **preload.cjs**: exposats a la renderer `getSessionData` i `saveSessionData` (invocacions IPC `get-session-data` i `save-session-data`).
- **PerformancesDisplay**: utilitza aquestes APIs per **recordar l’últim esdeveniment de actuacions visualitzat** (`lastViewedPerformanceEventId`), carregant-lo en obrir la vista i desant-lo en canviar de esdeveniment.

---

## 4. Hook useDebouncedSave

- **Nou fitxer** `src/hooks/useDebouncedSave.ts`: hook genèric per desar amb debounce.
- Opcions: `initialData`, `onSave`, `delay` (per defecte 2000 ms).
- Retorna: `data`, `updateField`, `setData`, `saveNow`, `isDirty`.
- Sincronitza amb `initialData` quan canvia i evita desats excessius en formularis (p. ex. actuacions).

---

## 5. Utilitats de dates

- **src/utils/dateFormat.ts**: noves funcions (o ampliació) per a **formatatge de dates** (probablement usades als PDFs i a la UI d’actuacions).

---

## 6. Constants i traduccions

- **constants.tsx**: nous ídols o literals per al mòdul d’actuacions (p. ex. icones).
- **src/locales** (ca, en, es): noves claus i18n per a `performances.*` (nav_title, formularis, advancing, etc.). Els fitxers s’han reordenat/refactoritzat (moltes línies tocades).

---

## 7. Internacionalització (i18n) i parser

- **apps_web/landing** i **mobile_app**: fitxers de traducció (ca, en, es) refactoritzats; s’han creat `*_old.json` com a còpia abans de reorganitzar les claus.
- **i18next-parser**: nous fitxers de configuració `i18next-parser.config.cjs`, `i18next-parser.mobile.config.cjs`, `i18next-parser.web.config.cjs` per escanejar claus i18n per projecte.

---

## 8. Documentació i estructura

- **ARBRE_DIRECTORIS.txt**: documentada la nova carpeta `performances/` i els components FASE 4, i actualitzades les referències a PerformancesDisplay i pdfGenerator.
- **DEVELOPING.md**: branca actualitzada a `00DEV_GEP`; nova secció “11. MÒDUL D’ACTUACIONS (FASE 4)” amb visió general, components, model de dades, control d’avançament, exportació PDF, integració amb l’store, patrons (lazy loading, debounce, i18n), flux de treball i extensions futures (integració amb material i horaris).
- **ESQUEMA_UI_DESKTOP.md**: nova secció “8. Secció d’Actuacions” amb descripció de la UI: selector d’esdeveniment, layout dues columnes, pestanyes Bàsic/Tècnic/Hospitality, control d’avançament, exportacions PDF i UX.

---

## 9. Altres canvis

- **package.json / package-lock.json**: nous dependències o actualitzacions (p. ex. relacionades amb i18next-parser o altres eines).
- **unificar.py**: script nou (probablement per unificar o netejar traduccions).

---

## Resum en una frase

Des del commit **d7ae802** fins ara, el projecte incorpora el **mòdul d’actuacions (FASE 4)** amb gestió d’artistes per esdeveniment, control d’avançament visual, formularis bàsic/tècnic/hospitalitat, exportació de riders i Full de Ruta del Regidor en PDF, persistència de l’últim esdeveniment de actuacions vist, hook de desat amb debounce, i documentació i i18n actualitzades.
