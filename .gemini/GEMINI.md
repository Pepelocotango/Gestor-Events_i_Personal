# Context i Directrius del Projecte: Gestor-Events_i_Personal (GEP)

Aquest és un gestor d'esdeveniments, personal i logística de material complet, dissenyat per a entorns professionals i de producció técnica d'espectacles. Està concebut com un ecosistema multiplataforma (Escriptori, Mòbil i Web) integrat en un únic repositori gestionat com a Monorepo amb `pnpm`.

---

## 🛠️ Pila Tecnològica i Arquitectura

L'ecosistema s'organitza en tres grans pilars que comparteixen un model de dades unificat escrit en **TypeScript**:

1. **Aplicació d'Escriptori (Desktop App)**:
   - **Contenidor natiu**: [`Electron`](https://www.electronjs.org/) (procés principal a `main.cjs` i preload segur a `preload.cjs`).
   - **Frontend**: [`React 18`](https://react.dev/), [`Vite 6`](https://vite.dev/), [`Tailwind CSS 3`](https://tailwindcss.com/).
   - **Gestió d'Estat**: [`Zustand`](https://github.com/pmndrs/zustand) (amb middleware `immer` i `temporal` de `zundo` per a un historial d'accions desfer/refer global).
   - **Internacionalització**: `react-i18next` amb suport complet en Català, Castellà i Anglès.

2. **Aplicació Mòbil (Mobile App — [`Gestor-Events_i_Personal/mobile_app`](Gestor-Events_i_Personal/mobile_app))**:
   - Desenvolupada amb **React Native** i **Expo** (flux gestionat amb Expo Application Services EAS).
   - Compartició total de tipus i lògica de dades de Zustand amb la versió desktop.
   - Integració segura de fitxers al dispositiu mitjançant el **Storage Access Framework (SAF)** d'Android.

3. **Aplicacions Web ([`Gestor-Events_i_Personal/apps_web`](Gestor-Events_i_Personal/apps_web))**:
   - **Landing Page (`apps_web/landing`)**: Desenvolupada amb **Astro** i **React** per a presentació, descàrregues dinàmiques directes des de GitHub Releases i un Product Tour interactiu.
   - **Documentació Tècnica (`apps_web/documentation`)**: Manual tècnic construït amb **Docusaurus**.

---

## 🧭 Directrius i Regles d'Or per a l'IA (CRÍTICS)

Quan treballis en aquest repositori, has d'adherir-te estrictament a les següents directrius de desenvolupament:

1. **Idioma de Treball**: 
   - Tota la comunicació, descripcions de commits, explicacions, comentaris de codi i qualsevol text que es mostri a l'usuari final s'ha d'escriure obligatòriament en **Català (ca)**.
   
2. **Control de Versions (Git)**:
   - **REGLA ABSOLUTA**: No realitzis commits ni operacions de versionat (`git commit`, `git push`) sense instrucció explícita i directa de l'usuari.

3. **Modificacions de Codi**:
   - En modificar qualsevol arxiu, utilitza exclusivament les eines d'edició específiques o fes-ho mitjançant canvis exactes. No deixis mai marcadors de posició o comentaris de tipus `// rest of code unchanged`. Tot el codi s'ha de mantenir robust, compilat i sense advertències de TypeScript.
   - **TypeScript Estricte**: No saltis les comprovacions de tipus. El projecte utilitza regles estrictes a [`tsconfig.json`](Gestor-Events_i_Personal/tsconfig.json). L'ús d'`any` o ignorar errors de tipus està prohibit.

4. **Preservació de Documentació i Memòria**:
   - Qualsevol decisió arquitectònica important, nova funcionalitat de producció, correcció de bug crític o canvi del model de dades s'ha de registrar i documentar de manera immediata al fitxer de bitàcola [`.gemini/MEMORIA_PROJECTE.md`](Gestor-Events_i_Personal/.gemini/MEMORIA_PROJECTE.md).
   - Mantingues al dia l'arxiu [`ARBRE_DIRECTORIS.txt`](Gestor-Events_i_Personal/ARBRE_DIRECTORIS.txt) si es creen, s'eliminen o es reestructuren carpetes o fitxers clau.

5. **Interacció amb l'Usuari**:
   - Sigues directe, clar i d'un perfil profundament tècnic. Evita fórmules excessivament cordials o introduccions innecessàries. El teu objectiu és complir la tasca amb precisió industrial.
