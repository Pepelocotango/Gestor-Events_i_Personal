# Memòria del Projecte - GEP

## Estat del Projecte (Març 2026)
- **Repositori:** Creat i amb estructura bàsica de desktop (`src/`) i mòbil (`mobile_app/`).
- **Objectiu:** Crear un gestor d'esdeveniments complet amb visualització de calendaris, personal i gestió de material.
- **Novetat:** Sincronització individual d'esdeveniments amb Google Calendar (v1.6.3+).

## Decisions d'Arquitectura i Disseny
- La comunicació ha de ser en català.
- Ús de la carpeta `.gemini/` per emmagatzemar context i memòria de sessió.
- Implementació de `sync-single-event-with-google` al backend per permetre actualitzacions quirúrgiques sense esborrar tot el calendari.
- Ús de `notificationService` en lloc de `showToast` dins de l'store global.

## Tasques Pendents
- [x] Configuració de context de Gemini (Març 2026).
- [x] Sincronització individual per a esdeveniments (Google Calendar).
- [ ] Implementació de funcions segons les teves indicacions.
