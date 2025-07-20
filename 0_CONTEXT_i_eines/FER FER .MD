

### ✅ **Tasques Completades (Validat al Codi)**

Bon progrés! Les següents tasques crítiques ja estan implementades i funcionant:

1.  **Refactorització de `TechSheetForm.tsx`:** **FET.** El component ha estat descompost amb èxit. La lògica de generació de PDF s'ha mogut a `src/utils/pdfGenerator.ts`, i s'han creat els components `TechnicalPersonnelSection.tsx` i `NeedsList.tsx` per gestionar seccions específiques.
2.  **Gestió d'Inventari de Material:** **FET.** La funcionalitat per afegir, editar, eliminar i carregar material està completament implementada a `MaterialDisplay.tsx` i `useEventDataManager.ts`.

---

### 📝 **Pla d'Acció Recomanat (Tasques Pendents)**

Aquest és el pla actualitzat amb les tasques pendents, organitzades per prioritat.

#### **🎯 Prioritat Alta: Bugs i Funcionalitat Clau**

1.  **Corregir Bug Visual al Calendari:**
    *   **Problema:** En la vista mensual, l'últim dia de la setmana (diumenge) a l'última fila no mostra el número.
    *   **Acció Recomanada:** Investigar el CSS, possiblement a `tailwind.config.cjs` o `index.css`, per a un conflicte d'estils (`overflow`, `padding`) o una mala interacció amb la llibreria FullCalendar. És un bug purament visual que hem de solucionar.

2.  **Vincular Material a Assignacions de Personal:**
    *   **Proposta:** Millorar les fitxes de bolo permetent vincular ítems de l'inventari de material directament a un rol o proveïdor de personal.
    *   **Acció Recomanada:**
        1.  Modificar la `interface TechSheetRoleItem` a `types.ts` per incloure un array opcional `materialIds: string[]`.
        2.  Actualitzar la interfície a `TechnicalPersonnelSection.tsx` per permetre afegir material a cada rol.
        3.  Reflectir aquest vincle al PDF generat per `pdfGenerator.ts`.

#### **✨ Millores de Funcionalitat i UX (Prioritat Mitjana)**

1.  **Epic: Millores d'Integració amb Google Calendar:**
    *   **Sincronitzar Detalls d'Assignacions:** Actualment només se sincronitza la informació general del marc. Podem afegir un resum de les assignacions (persona i estat) a la descripció de l'esdeveniment de Google.
    *   **Sincronitzar Colors dels Calendaris:** A `GoogleSettingsModal.tsx` ja obtenim els colors. Hem de passar-los a `MainDisplay.tsx` i aplicar-los als esdeveniments de Google per a una identificació visual immediata.
    *   **Corregir Visualització en Mode Fosc:** A la vista "Agenda" del calendari, els dies es veuen en blanc sobre fons clar. Cal afegir estils a `tailwind.config.cjs` per corregir-ho.
    *   **Millorar Visualització del Dia "Avui":** El dia actual no destaca prou, especialment en mode fosc. Podem millorar-ne l'estil a `tailwind.config.cjs`.

2.  **Reorganitzar la Interfície (`Controls.tsx`):**
    *   **Proposta:** La barra de controls té molts botons. Podríem simplificar-la movent les accions de "Carregar/Guardar" (Tot, Persones, Material) a un submenú desplegable per netejar la interfície.
    *   **Acció Recomanada:** Crear un component de menú desplegable i reorganitzar els botons dins de `Controls.tsx`.

#### **🛠️ Millores Tècniques i Neteja (Prioritat Baixa)**

1.  **Optimitzar la Sincronització amb Google (`main.cjs`):**
    *   **Deute Tècnic:** La sincronització actual esborra i reescriu tots els esdeveniments, la qual cosa és ineficient.
    *   **Acció Recomanada (a futur):** Implementar una **sincronització diferencial (delta sync)** que només actualitzi, creï o esborri els esdeveniments que han canviat, basant-se en la data de modificació.

2.  **Neteja de Codi a `vite.config.ts`:**
    *   **Problema:** La variable `GEMINI_API_KEY` està definida però no s'utilitza enlloc.
    *   **Acció Recomanada:** Eliminar la definició `process.env.GEMINI_API_KEY` per mantenir el codi net. És una tasca ràpida i senzilla.

