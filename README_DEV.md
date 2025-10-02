![Captura de pantalla del gestor d'events i personal](imatges/en_construcció_GV.png)
### NOVA BRANCA DESENVOLUPAMENT --> DEV
 CHECKPOINT_V1.1.0
### `README.md`**

# Gestor d'Esdeveniments i Personal V1.1.0

Aplicació d'escriptori multiplataforma (Electron, React, Vite) per a la gestió integral d'esdeveniments, personal, fitxes de bolo i material amb control d'estoc.

El projecte està actualment en fase de desenvolupament actiu.

## 🚀 Novetats i Funcionalitats Clau

* **Centre de Control de Material (Redissenyat):**
  * **Càlcul de Pic de Demanda Concurrent:** La nova lògica calcula la demanda màxima d'un ítem en un sol dia dins d'un període, oferint una previsió d'estoc molt més realista.
  * **Interfície Reorganitzada:** Les columnes s'han reordenat per prioritzar la informació d'estoc i balanç. L'ordenació per defecte ara ressalta els ítems amb més problemes de disponibilitat.
  * **Desglossament Enriquit:** El desglossament per esdeveniment ara inclou les dates, proporcionant un context immediat.

* **Millores en Exportacions (PDF i CSV):**
  * **Ordenació Jeràrquica:** Els informes PDF de resum i CSV ara presenten les dades ordenades jeràrquicament per categoria, origen i nom, facilitant la seva anàlisi.
  * **PDF de Resum Millorat:** S'ha afegit la columna "Origen" i s'han reorganitzat les columnes per a una major claredat.
  * **Correcció d'Exportació Detallada:** Solucionat un error que generava un PDF detallat buit si no se seleccionava cap esdeveniment al filtre. Ara, l'informe sempre reflecteix les dades visibles a la taula.

* **Gestió d'Estat amb Zustand:**
  * Estat global optimitzat amb selectors independents per evitar bucles infinits de renderitzat.
  * Historial desfer/refer interactiu amb modal, botons i descripcions clares d'acció.

* **Backups i Tancament Intel·ligent:**
  * Diàleg de sortida únic amb opcions clares: Desa, Desa com..., Tanca sense desar, Cancel·la.
  * Backups automàtics incondicionals a cada desat o tancament, amb neteja i rotació intel·ligent.

* **Separació de Configuració Google:**
  * Configuració local (`google-config.json`) independent de la configuració de cada document.
  * Sincronització multi-calendari i gestió d'IDs separada per usuari i projecte.

* **Instància Única:**
  * Bloqueig d'instància per evitar errors d'escriptura i finestres duplicades.

* **Menú Personalitzat en React:**
  * Substitució del menú natiu d'Electron per un component React, amb accions IPC centralitzades.

* **Altres millores:**
  * **Disseny Fluid (Full-Width):** L'aplicació ara utilitza un disseny d'amplada completa que aprofita tot l'espai de la pantalla, reemplaçant l'anterior contenidor centrat per optimitzar la visualització en monitors grans.
  * Refactorització de stores, modals, tech_sheets i utils.
  * Gestió d'errors robusta amb logs de sessió i ErrorBoundary.

---

## Funcionalitats Principals

L'aplicació està dissenyada per cobrir tot el cicle de vida de la gestió d'un esdeveniment, oferint les següents eines:

*   **Gestió d'Esdeveniments i Assignacions:**
    *   Crea "esdeveniments marc" amb dates i notes generals.
    *   Assigna personal per dies concrets i controla'n l'estat (Confirmat, Pendent, No disponible, Mixt).
    *   El sistema detecta automàticament conflictes si una persona és assignada a múltiples llocs el mateix dia.

*   **Planificació i Visualització:**
    *   **Calendari Avançat:** Visualitza tots els esdeveniments en múltiples formats (2, 4 o 6 mesos, mes, setmana i agenda). 
    *   **Llista Dinàmica:** Filtra i ordena els esdeveniments per nom, lloc, persona, estat o data per a una visió detallada.

*   **Documentació Tècnica (Fitxes de Bolo):**
    *   Genera fitxes tècniques completes per a cada esdeveniment.
    *   Gestiona el personal per proveïdors i rols, i les necessitats de material (il·luminació, so, vídeo, etc.).
    *   **Reordena els proveïdors de personal amb drag-and-drop** per a una organització visual i lògica.
    *   Pobla automàticament la llista de personal a partir de les assignacions confirmades.

*   **Inventari de Material:**
    *   Manté una base de dades centralitzada de material amb control d'estoc.
    *   El sistema comprova la disponibilitat de l'estoc en temps real en assignar material a una fitxa de bolo.

*   **Connectivitat i Gestió de Dades:**
    *   **Integració amb Google Calendar:** Sincronitza els esdeveniments de l'aplicació a un calendari dedicat de Google i visualitza altres calendaris teus en mode de només lectura.
    *   **Importació/Exportació:** Desa i carrega totes les dades de l'aplicació en format JSON. La càrrega de dades de personal i material permet fusionar o reemplaçar la informació existent.
    *   **Exportació a PDF/CSV:** Exporta resums, llistes de personal, inventaris i fitxes de bolo a formats professionals com PDF i CSV.

> Per a una anàlisi tècnica detallada de l'arquitectura i les funcionalitats, consulta la nostra [**guia de desenvolupament (DEVELOPING.md)**](DEVELOPING.md).



## 💾 Descàrrega i Instal·lació

Pots descarregar l'última versió de l'aplicació directament des de la nostra secció de [**Releases a GitHub**](https://github.com/Pepelocotango/Gestor-Events_i_Personal/releases).

Cada versió inclou binaris compilats per a Windows, macOS i Linux. Assegura't de descarregar el fitxer correcte per al teu sistema operatiu.

### Requisits Mínims del Sistema

L'aplicació es construeix amb Electron 29, la qual cosa defineix els següents requisits mínims:

*   **Windows:** Windows 10 (només 64-bit) o superior.
*   **macOS:** macOS 10.15 (Catalina) o superior.
*   **Linux:** Es recomana una distribució moderna com Ubuntu 20.04, Debian 11, Fedora 34 o equivalents més recents (requereix glibc 2.31 o superior).

    > **Nota important per a Linux:** L'aplicació es distribueix com a AppImage, que requereix la llibreria `libfuse2`. En sistemes com **Ubuntu 22.04 o posteriors**, aquesta llibreria no ve instal·lada per defecte. Si l'aplicació no s'obre, necessitaràs instal·lar-la manualment amb la comanda:
    > ```sh
    > sudo apt-get install libfuse2
    > ```

---


### Instruccions per Plataforma

#### 🪟 **Windows**

Oferim dues versions per a Windows:

1.  **Instal·lador (`...-Installer.exe`):**
    *   **Recomanat per a la majoria d'usuaris.**
    *   Descarrega i executa el fitxer `.exe` que conté la paraula `Installer`.
    *   Això instal·larà l'aplicació al teu sistema, creant una drecera a l'escriptori i una entrada al menú d'inici per a un accés fàcil.

2.  **Versió Portable (`...-Portable.exe`):**
    *   **Ideal per executar sense instal·lar, per exemple des d'un pen-drive.**
    *   Descarrega el fitxer `.exe` que conté la paraula `Portable`.
    *   Pots executar l'aplicació directament amb un doble clic sense que s'instal·li res al teu sistema.

####  **macOS**

Per a macOS, la distribució es fa a través d'un fitxer `.dmg`:

*   Descarrega el fitxer `...-macOS-10.15+.dmg`.
*   Fes-hi doble clic per obrir-lo. S'obrirà una finestra del Finder.
*   Per instal·lar l'aplicació, simplement **arrossega la icona de l'aplicació a la drecera de la carpeta d'Aplicacions** que apareix a la mateixa finestra.
*   Ja pots executar l'aplicació des de la teva carpeta d'Aplicacions o mitjançant Launchpad.

> **Nota IMPORTANT!:** La primera vegada que obris l'aplicació, com que no està descarregada des de l'App Store, macOS podria mostrar un avís de seguretat.
Per obrir-la, CTRL+clic o fes clic dret sobre la icona de l'aplicació, selecciona "Obrir" i confirma l'acció al diàleg que apareixerà.
Si el pas anterior no funciona, prova de anar a preferències de sistema i donar-li permís d'execució a la App. ( gràcies Isaac!)

#### 🐧 **Linux**

Per a Linux, utilitzem el format `AppImage`, que no requereix instal·lació:

*   Descarrega el fitxer `...-Linux-Ubuntu18.04+.AppImage`.
*   **Dona-li permisos d'execució.** La manera més fàcil és fent clic dret sobre el fitxer > Propietats > Permisos > i marcar la casella "Permet executar el fitxer com un programa".
    *   Alternativament, des de la terminal: `chmod +x GestorEsdeveniments-*.AppImage`
*   Fes doble clic sobre el fitxer per executar l'aplicació.

---


### 📂 Fitxers d'Exemple

Per ajudar-te a començar, hem inclòs una carpeta anomenada `examples json` amb fitxers de dades que pots utilitzar.

*   **`example_all.json`**: És un arxiu de projecte complet amb esdeveniments, personal i material. Per utilitzar-lo:
    1.  Ves al menú **`Arxiu > Obrir...`**.
    2.  Selecciona el fitxer `example_all.json`.
    3.  L'aplicació carregarà el projecte. Pots desar els canvis amb `Guardar` o `Guardar com...`.

*   **`example_person.json`**: Conté una llista de contactes. Aquesta funció està pensada per **importar** contactes a un projecte existent.
    1.  Obre o crea un projecte.
    2.  Ves al menú **`Arxiu > Importar / Exportar > Importar Persones...`**.
    3.  Selecciona `example_person.json`.
    4.  L'aplicació et preguntarà si vols **fusionar** la nova llista amb l'existent (afegint només les persones que no existeixin) o **reemplaçar** completament la llista actual.

*   **`example_material.json`**: Un inventari de material d'exemple. Funciona de la mateixa manera que la importació de persones.
    1.  Obre o crea un projecte.
    2.  Ves al menú **`Arxiu > Importar / Exportar > Importar Material...`**.
    3.  Tria entre **fusionar** l'inventari o **reemplaçar-lo**.

## ✒️ Autoria

-   **Autor Principal:** Pëp 
-   **Co-autoria i Suport Tècnic:** Isaac ;) / Google Gemini - Google Studio IA - Jules / Github Copilot / Perplexity / ChatGPT / Claude /

### Captures de pantalla:    
![Captura de pantalla del gestor d'events i personal](0_CONTEXT_i_eines/imatges%20i%20recursos/screenshot1mac.jpeg)


## 📄 Llicència

Aquest projecte està sota la llicència **GNU General Public License v3.0**.

Això significa que ets lliure d'utilitzar, estudiar, modificar i compartir aquest software. No obstant això, qualsevol treball derivat que distribueixis ha de ser publicat sota aquesta mateixa llicència, garantint que el codi romangui sempre lliure i obert per a tota la comunitat.

Pots llegir el text complet de la llicència al fitxer [LICENSE](LICENSE) del projecte.

---

## Desenvolupament

## 🔒 Tancament Intel·ligent i Backups Incondicionals

L'aplicació garanteix que el teu treball estigui sempre protegit, fins i tot si decideixes no desar els canvis.

-   **Diàleg de Sortida Únic:** En intentar tancar l'aplicació amb canvis no desats, es mostra un únic diàleg que t'ofereix un control clar i professional: `Desa`, `Desa com...`, `Tanca sense desar` o `Cancel·la`.
-   **Backups de Seguretat Sempre:** Independentment de l'opció que triïs (fins i tot `Tanca sense desar`), l'aplicació crea automàticament un backup de la teva sessió de treball a la carpeta de dades de l'aplicació. Això assegura que sempre tinguis una còpia de seguretat de l'últim estat del teu treball, proporcionant una xarxa de seguretat robusta contra la pèrdua accidental de dades.

## ⚡ Configuració de Google: Separació Local vs Document

La configuració de Google Calendar es gestiona de forma separada:
- La configuració local (`google-config.json`) manté calendaris gestionats, calendaris externs i preferències de l'usuari.
- Quan obres un document, només s'actualitzen els calendaris gestionats i l'ID actiu; la resta de preferències romanen intactes.
- Això garanteix que la configuració personal no es perdi ni se sobreescrigui accidentalment.

Si vols contribuir al projecte, consulta la nostra [guia de desenvolupament](DEVELOPING.md) per obtenir informació sobre com configurar l'entorn i entendre els canvis recents.
