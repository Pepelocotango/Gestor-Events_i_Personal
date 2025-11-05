import type { EventFrame, PersonGroup } from '../types';
/**
 * Genera una descripció de text enriquit per a un esdeveniment de Google Calendar
 * a partir de les dades d'un EventFrame local.
 *
 * @param localFrame - L'objecte EventFrame que conté les dades de l'esdeveniment.
 * @param peopleGroups - Una llista de tots els grups de persones per buscar noms.
 * @returns Una cadena de text formatada per ser utilitzada com a descripció de l'esdeveniment.
 */
export declare const generateGoogleEventDescription: (localFrame: EventFrame, peopleGroups: PersonGroup[]) => string;
//# sourceMappingURL=googleCalendarUtils.d.ts.map