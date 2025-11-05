/**
 * Genera una descripció de text enriquit per a un esdeveniment de Google Calendar
 * a partir de les dades d'un EventFrame local.
 *
 * @param localFrame - L'objecte EventFrame que conté les dades de l'esdeveniment.
 * @param peopleGroups - Una llista de tots els grups de persones per buscar noms.
 * @returns Una cadena de text formatada per ser utilitzada com a descripció de l'esdeveniment.
 */
export const generateGoogleEventDescription = (localFrame, peopleGroups) => {
    const getPersonGroupById = (id) => peopleGroups.find(p => p.id === id);
    const descriptionParts = [];
    if (localFrame.generalNotes) {
        descriptionParts.push(localFrame.generalNotes);
    }
    // Secció de Personal
    if (localFrame.techSheet?.technicalProviders && localFrame.techSheet.technicalProviders.length > 0) {
        const personnelList = localFrame.techSheet.technicalProviders
            .map(provider => {
            const person = getPersonGroupById(provider.personGroupId);
            const roles = provider.roles
                .map(r => `  - ${r.quantity}x ${r.role}${r.notes ? ` (${r.notes})` : ''}`)
                .join('\n');
            return `${person ? person.name : 'Proveïdor desconegut'}:\n${roles}`;
        })
            .join('\n');
        descriptionParts.push(`--- PERSONAL TÈCNIC ---\n${personnelList}`);
    }
    // Secció d'Horaris
    if (localFrame.techSheet?.assemblySchedule && localFrame.techSheet.assemblySchedule.length > 0) {
        const scheduleList = localFrame.techSheet.assemblySchedule
            .map(item => `- ${item.time}: ${item.description}`)
            .join('\n');
        descriptionParts.push(`--- HORARIS ---\n${scheduleList}`);
    }
    // Altres detalls
    const otherDetails = [];
    if (localFrame.techSheet?.companyContact) {
        otherDetails.push(`Contacte Cia: ${localFrame.techSheet.companyContact}`);
    }
    if (localFrame.techSheet?.observations) {
        otherDetails.push(`Observacions: ${localFrame.techSheet.observations}`);
    }
    if (otherDetails.length > 0) {
        descriptionParts.push(`--- DETALLS ---\n${otherDetails.join('\n')}`);
    }
    return descriptionParts.join('\n\n');
};
//# sourceMappingURL=googleCalendarUtils.js.map