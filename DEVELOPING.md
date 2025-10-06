# Guia de Desenvolupament

Aquest document proporciona informació tècnica per a desenvolupadors que vulguin contribuir o entendre l'arquitectura interna de l'aplicació.

## 🎨 Sistema de Temes i Gestió de Colors

Per garantir la consistència visual i facilitar el manteniment, l'aplicació utilitza un sistema de temes centralitzat. Tota la paleta de colors es gestiona des d'una única font de veritat, i els fitxers de l'aplicació es generen automàticament a partir d'aquesta.

### 1. La Font Única de la Veritat: `theme.config.cjs`

- **Fitxer Clau:** `theme.config.cjs` a l'arrel del projecte.
- **Propòsit:** Aquest fitxer és l'únic lloc on s'han de definir o modificar els colors de l'aplicació. Conté:
    - `light`: Un objecte amb els colors per al tema clar en format string HSL (`"H S% L%"`).
    - `dark`: Un objecte amb els colors per al tema fosc.
    - `pdfExtras`: Colors addicionals que no són part del sistema de temes CSS però que es necessiten per a la generació de PDFs.
    - `pdfMapping`: Un mapeig que indica quin color de tema (`light` o `dark`) s'ha d'utilitzar per a cada variable de color en el context dels PDFs.

**Mai no s'han de modificar els colors directament a `src/index.css` o `src/utils/themeDefinition.ts`.**

### 2. Generació Automàtica de Fitxers de Tema

- **Script:** `scripts/build-theme.cjs`
- **Comanda:** `npm run build:theme`

Aquest script llegeix `theme.config.cjs` i genera dos fitxers crucials:

- **`src/index.css`**: Injecta les variables de color CSS per als selectors `:root` (tema clar) i `.dark` (tema fosc). Aquestes variables són les que utilitza Tailwind CSS a tota l'aplicació.
- **`src/utils/themeDefinition.ts`**: Genera un objecte TypeScript (`themeHslColors`) que conté els colors en format d'array HSL (`[H, S, L]`). Aquest objecte s'utilitza en llocs on les variables CSS no són accessibles, com durant la generació de documents PDF.

### 3. Com Actualitzar un Color (Flux de Treball)

1.  Obre el fitxer `theme.config.cjs`.
2.  Modifica el valor HSL del color que vulguis canviar al tema `light`, `dark` o a tots dos.
3.  Desa el fitxer.
4.  Executa la següent comanda a la terminal:
    ```bash
    npm run build:theme
    ```
5.  Això és tot. L'script actualitzarà automàticament tots els fitxers necessaris. El comando `npm run build` també executa aquest script, de manera que els canvis sempre estaran sincronitzats en fer una nova compilació.

---
## Arquitectura General (Resum)

- **Frontend:** React amb Vite.
- **Escriptori:** Electron.
- **Gestió d'Estat:** Zustand.
- **Estils:** Tailwind CSS.
- **Llenguatge:** TypeScript.

Per a més detalls sobre les funcionalitats, consulta el [README_DEV.md](README_DEV.md).