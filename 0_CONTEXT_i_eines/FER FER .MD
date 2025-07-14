

# Pla de Millora i Tasques Pendents

A continuació es detallen les tasques, propostes de millora i correccions necessàries per a l'aplicació, organitzades per prioritat i àrea d'actuació.

## 🎯 Prioritats Clau (Acció Immediata)

Aquestes són les tasques més urgents que afecten la funcionalitat principal, l'estabilitat o són bloquejants.

1.  **Refactorització Crítica de `TechSheetForm.tsx` (Alta Prioritat)**
    *   **Problema:** El component és massa gran, complex i difícil de mantenir. Gestiona un estat massiu i la lògica de generació de PDF.
    *   **Acció:** Descompondre'l en components més petits (p. ex., `TechnicalPersonnelSection`, `NeedsList`) i extreure la lògica de generació del PDF a un mòdul d'utilitat (`src/utils/pdfGenerator.ts`).
    *   **Impacte:** Millora radical de la mantenibilitat i salut del projecte a llarg termini.

2.  **Implementar la Funció de Guardar Material (Funcionalitat Clau)**
    *   **Requeriment:** Actualment, el material només es pot carregar, però no es pot guardar de forma persistent a la base de dades. Cal implementar la funcionalitat de **guardar i gestionar un inventari de material**.
    *   **Acció:** Desenvolupar el model de dades, les vistes i la lògica necessària per a la gestió de material.

3.  **Correcció de Bug Crític al Calendari**
    *   **Bug:** En visualitzar el calendari per mes, el ÚLTIM número del dia de la setmana de l'última columna (diumenge) desapareix. ES RENDERITZA DIFERENT.
    *   **Acció:** Investigar i corregir el renderitzat de la vista mensual del calendari per evitar la pèrdua de dades visuals.

## ✨ Noves Funcionalitats i Millores Generals

Funcionalitats que aporten un valor significatiu a l'aplicació.

*   **Fusió de Personal i Material:**
    *   Poder combinar la vista o gestió de les assignacions de personal amb les de material per tenir una visió completa de les necessitats d'un esdeveniment.

*   **Sincronització d'Assignacions amb Google Calendar:**
    *   Afegir les assignacions de l'aplicació com a notes o detalls dins dels esdeveniments corresponents a Google Calendar, a més de les notes generals ja implementades.

*   **Mode "Només Lectura" per a Calendaris:**
    *   Mostrar una indicació visual clara ("només lectura") en calendaris importats de Google.
    *   Bloquejar l'edició d'aquests esdeveniments des de l'aplicació per evitar modificacions no desitjades a la font original (Google Calendar).

*   **Nom Personalitzat per al Calendari:**
    *   Permetre a l'usuari assignar un nom o àlies personalitzat al calendari dins de l'aplicació per a una millor organització.

## 🎨 Millores d'Interfície i Experiència d'Usuari (UI/UX)

Ajustos visuals i d'usabilitat per fer l'aplicació més intuïtiva i agradable.

*   **Millora Visual del Dia "Avui":**
    *   **Mode Fosc:** Millorar la visualització del dia actual, ja que actualment no destaca prou.
    *   **Mode Clar:** Aplicar també el fons taronja (o un altre color destacat) al dia "Avui" per a una millor consistència visual.

*   **Sincronització de Colors dels Calendaris:**
    *   Reflectir a l'aplicació els mateixos colors que l'usuari té configurats per als seus calendaris a Google. Això permetrà diferenciar visualment els esdeveniments per calendari d'origen.

*   **Millora del Mode Fosc a la Vista d'Agenda:**
    *   Corregir la visualització dels dies a la vista "Agenda" del calendari quan el tema fosc està activat, ja que actualment es mostren en blanc i dificulten la lectura.

*   **Migració de Botons al Menú:**
    *   Reorganitzar la interfície movent botons d'acció principals a un menú de navegació o barra lateral per netejar la vista principal i millorar l'estructura.

## 🛠️ Propostes de Millora Tècnica (Refactorització)

Anàlisi i propostes per optimitzar el codi base, millorar el rendiment i assegurar l'escalabilitat del projecte.

### 1. Refactorització de `TechSheetForm.tsx` (Alta Prioritat)
*   **Observació:** Component monolític que gestiona un estat (`formData`) molt gran, la lògica de múltiples sub-components i la generació del PDF.
*   **Proposta:**
    *   **Componentitzar:** Descompondre `TechSheetForm` en components més petits i especialitzats (`TechnicalPersonnelSection.tsx`, `NeedsList.tsx`, `ScheduleSection.tsx`).
    *   **Extreure la lògica del PDF:** Moure la funció `handleExportToPdf` a un fitxer d'utilitat (`src/utils/pdfGenerator.ts`).
*   **Recomanació:** Aquesta és la refactorització més important per a la salut del projecte.

### 2. Optimització de la Sincronització amb Google (`main.cjs`)
*   **Observació:** El mètode actual buida completament el calendari a Google i torna a pujar tots els esdeveniments. És ineficient i pot excedir els límits de l'API de Google amb un volum alt de dades.
*   **Proposta:** Implementar una **sincronització intel·ligent (delta sync)**:
    1.  Obtenir esdeveniments de Google amb la seva data de modificació (`updated`).
    2.  Comparar cada esdeveniment local (`lastModified`) amb la seva contrapart a Google.
    3.  Enviar només operacions `update`, `insert` o `delete` per als esdeveniments que han canviat.
*   **Recomanació:** Plantejar com una millora de rendiment per a una futura versió.

### 3. Optimització del Hook `useEventDataManager.ts`
*   **Observació:** La detecció de conflictes (`addAssignment`, `updateAssignment`) itera sobre totes les assignacions cada vegada, la qual cosa podria alentir l'aplicació amb centenars d'assignacions.
*   **Proposta:** Optimitzar la cerca de conflictes utilitzant estructures de dades més eficients (com un mapa de dates generat amb `useMemo`) que s'actualitzin només quan les assignacions canviïn.
*   **Recomanació:** Mantenir en observació i abordar si es detecta lentitud en l'edició o creació d'assignacions.

### 4. Neteja de Codi Mort o Experimental
*   **Observació:** El fitxer `vite.config.ts` defineix una variable d'entorn `GEMINI_API_KEY` que no sembla utilitzar-se.
*   **Proposta:** Si és un vestigi d'un experiment, eliminar-la per evitar confusió i mantenir el codi net.
*   **Recomanació:** Netejar-la.

### Conclusió i Propers Passos
La base del projecte és excel·lent. Les propostes se centren a millorar la mantenibilitat i l'eficiència a llarg termini.

**Pla d'acció suggerit:**
1.  **Començar per la refactorització de `TechSheetForm.tsx`:** Iniciar amb l'extracció de la lògica del PDF i després planificar la divisió del component.
2.  **Abordar les tasques d'alta prioritat:** Implementar el guardat de material i corregir el bug visual del calendari.
3.  **Optimitzar `useEventDataManager.ts`:** Revisar la funció de conflictes per aplicar millores senzilles.
4.  **Tractar la sincronització de Google** com una tasca de millora a mitjà/llarg termini.
5.  **Eliminar la variable `GEMINI_API_KEY`** de la configuració de Vite.