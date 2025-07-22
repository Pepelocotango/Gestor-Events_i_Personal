
---
### important!!! 

Pla Tècnic d'Optimització:
Optimitzar TechnicalPersonnelSection:
Modificarem el component TechnicalPersonnelSection.tsx per embolicar-lo amb React.memo.
Revisarem el component pare (TechSheetForm.tsx) i ens assegurarem que totes les funcions que se li passen com a props estiguin memoritzades amb useCallback.
Optimitzar NeedsList:
Aplicarem el mateix procés al component NeedsList.tsx, embolcallant-lo amb React.memo.
De nou, verificarem a TechSheetForm.tsx que les funcions passades a NeedsList estiguin dins d'un useCallback.
Optimitzar TechSheetField:
Aquest component es reutilitza molt. Embolcallar-lo amb React.memo també pot donar un petit guany de rendiment, especialment dins de les llistes llargues.
Aquest enfocament de "baix a dalt" (optimitzant els components fills primer) és la manera més eficient de millorar el rendiment.

### 📝 **Pla d'Acció Recomanat (Tasques Pendents)**

Aquest és el pla actualitzat amb les tasques pendents, organitzades per prioritat.

### millorar formulari fitxes bolo
analitzar i fer brainstorm , te motls logs

### millorar sortides pdf

millorar visualment molt més atractiu les fitxes de bolo sortida pdf
fer un brainstorm d'aixó

millorar i implementar sortides existents csv a pdf també.

### modals ( finestres) més grans

### afegir als builders de github actions .yml incloure en els comprimits el readme, developing, llicència i carpeta exemples json. s'ha provat no funciona.

### millorar exemples json de tot

### llista material ordenar per nom, categoria etc...


  


#### **✨ Millores de Funcionalitat i UX (Prioritat Mitjana)**

1.  **Epic: Millores d'Integració amb Google Calendar:**
    *   **Sincronitzar Detalls d'Assignacions:** Actualment només se sincronitza la informació general del marc. Podem afegir un resum de les assignacions (persona i estat) a la descripció de l'esdeveniment de Google.


2.  **Reorganitzar la Interfície (`Controls.tsx`):**
    *   **Proposta:** La barra de controls té molts botons. Podríem simplificar-la movent les accions de "Carregar/Guardar" (Tot, Persones, Material) a un submenú desplegable per netejar la interfície.
    *   **Acció Recomanada:** Crear un component de menú desplegable i reorganitzar els botons dins de `Controls.tsx`.

#### **🛠️ Millores Tècniques i Neteja (Prioritat Baixa)**

1.  **Optimitzar la Sincronització amb Google (`main.cjs`):**
    *   **Deute Tècnic:** La sincronització actual esborra i reescriu tots els esdeveniments, la qual cosa és ineficient.
    *   **Acció Recomanada (a futur):** Implementar una **sincronització diferencial (delta sync)** que només actualitzi, creï o esborri els esdeveniments que han canviat, basant-se en la data de modificació.



#### implementar factures i presupostos
nova "pagina"


