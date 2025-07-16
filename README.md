### NOVA BRANCA DESENVOLUPAMENT -->DEV

### `README.md`**

# Gestor d'Esdeveniments i Personal v0.4.0_DEV





Aplicació d'escriptori multiplataforma (construïda amb Electron, React i Vite) per a la gestió integral d'esdeveniments, personal i les seves assignacions, fitxes de bolo i material amb control de stock.


 El projecte està actualment en fase de desenvolupament actiu.

## 💾 Descàrrega i Instal·lació

Pots descarregar l'última versió de l'aplicació directament des de la nostra secció de [**Releases a GitHub**](https://github.com/Pepelocotango/Gestor-Events_i_Personal/releases).

Cada versió inclou binaris compilats per a Windows, macOS i Linux. Assegura't de descarregar el fitxer correcte per al teu sistema operatiu.

### Requisits Mínims del Sistema

*   **Windows:** Windows 10 (64-bit) o superior.
*   **macOS:** macOS 10.15 (Catalina) o superior.
*   **Linux:** Ubuntu 18.04, Debian 10, Fedora 28 o qualsevol distribució equivalent o més recent.

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

> **Nota:** La primera vegada que obris l'aplicació, com que no està descarregada des de l'App Store, macOS podria mostrar un avís de seguretat.
Per obrir-la, fes clic dret sobre la icona de l'aplicació, selecciona "Obrir" i confirma l'acció al diàleg que apareixerà.
Si el pas anterior no funciona, prova de anar a preferències de sistema i donar-li permís d'execució a la App. ( gràcies Isaac!)

#### 🐧 **Linux**

Per a Linux, utilitzem el format `AppImage`, que no requereix instal·lació:

*   Descarrega el fitxer `...-Linux-Ubuntu18.04+.AppImage`.
*   **Dona-li permisos d'execució.** La manera més fàcil és fent clic dret sobre el fitxer > Propietats > Permisos > i marcar la casella "Permet executar el fitxer com un programa".
    *   Alternativament, des de la terminal: `chmod +x GestorEsdeveniments-*.AppImage`
*   Fes doble clic sobre el fitxer per executar l'aplicació.

---


### 📂 Fitxers d'Exemple

Per ajudar-te a començar, hem inclòs una carpeta anomenada `examples json` amb fitxers de dades que pots carregar a l'aplicació. Utilitza els botons de la secció **Controls**:

*   **`example_all .json`**: És un arxiu complet amb esdeveniments, personal i material. Es carrega amb el botó **`Carregar Tot`**.
    *   ⚠️ **Atenció:** Aquesta acció **esborra totes les dades actuals** i les reemplaça amb el contingut del fitxer.

*   **`example_person.json`**: Conté una llista de contactes. Es carrega amb el botó **`Carregar Persones`**.
    *   ⚠️ **Atenció:** Aquesta acció **reemplaça completament** la teva llista de persones actual.

*   **`example_material.json`**: Un inventari de material d'exemple. Es carrega amb el botó **`Carregar Material`**.
    *   ✅ Aquesta acció és segura: **afegeix els nous articles** del fitxer al teu inventari existent sense esborrar res.

## ✒️ Autoria

-   **Autor Principal:** Pëp 
-   **Co-autoria i Suport Tècnic:** Isaac ;) / Gemini / Github Copilot / Perplexity / ChatGPT / Claude

### Captures de pantalla:    
![Captura de pantalla del gestor d'events i personal](imatges%20i%20recursos/screenshot1mac.jpeg)


## 📄 Llicència

Aquest projecte està sota la llicència MIT.

> Copyright (c) 2025 Pëp
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

---
