import { formatDateDMY } from './dateFormat';
import { logger } from './logger';
const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
// This is a minimal version of createDefaultTechSheet to avoid circular dependencies
const createDefaultTechSheetForMigration = (eventFrame) => {
    const defaultConditional = () => ({ status: 'unset', details: '', data: { needs: [] } });
    return {
        eventName: eventFrame.name,
        location: eventFrame.place || '',
        date: formatDateDMY(eventFrame.startDate),
        showTimes: [],
        showDuration: '',
        technicalProviders: [],
        generalNotes: '',
        parking: { status: 'unset', details: '' },
        preAssembly: { status: 'unset', details: '' },
        schedule: { status: 'unset', details: '', data: [] },
        dressingRooms: { status: 'unset', details: '' },
        actorsInfo: { status: 'unset', details: '', data: { number: 0, names: '' } },
        techniciansInfo: { status: 'unset', details: '', data: { number: 0, names: '' } },
        lighting: defaultConditional(),
        sound: defaultConditional(),
        video: defaultConditional(),
        machinery: defaultConditional(),
        rentals: defaultConditional(),
        otherEquipment: defaultConditional(),
        electrical: defaultConditional(),
        structures: defaultConditional(),
        platforms: defaultConditional(),
        consumables: defaultConditional(),
        curtains: defaultConditional(),
        transport: defaultConditional(),
        controlLocation: '',
        blueprints: '',
        contacts: [],
        observations: '',
        showLogistics: true,
        showPreAssembly: true,
        showSchedule: true,
        showNeeds: true,
        showOther: true,
        showGeneralNotesInPdf: true,
    };
};
export const migrateTechSheetData = (data, eventFrame) => {
    try {
        // Check if data is already in the new format
        if (data && isObject(data.lighting) && isObject(data.sound)) {
            return data;
        }
        const oldData = data || {};
        const defaultSheet = createDefaultTechSheetForMigration(eventFrame);
        const fromStringToStatus = (val) => {
            if (typeof val !== 'string' || val.trim() === '' || val.trim() === '--')
                return 'unset';
            if (val.toUpperCase().startsWith('SI'))
                return 'yes';
            if (val.toUpperCase().startsWith('NO'))
                return 'no';
            return 'yes';
        };
        const extractDetails = (val) => {
            if (typeof val !== 'string')
                return '';
            return val.replace(/^SI:?\s*/i, '').trim();
        };
        const migrateNeeds = (oldNeeds, oldDetails) => {
            const needs = (Array.isArray(oldNeeds) ? oldNeeds : []);
            const details = extractDetails(oldDetails);
            const status = fromStringToStatus(oldDetails);
            // If there are needs but status is unset, make it 'yes'
            const finalStatus = (status === 'unset' && needs.length > 0) ? 'yes' : status;
            return { status: finalStatus, details, data: { needs } };
        };
        const newSheet = {
            ...defaultSheet,
            eventName: oldData.eventName || eventFrame.name,
            location: oldData.location || eventFrame.place || '',
            date: oldData.date || (eventFrame.startDate === eventFrame.endDate ? formatDateDMY(eventFrame.startDate) : `${formatDateDMY(eventFrame.startDate)} - ${formatDateDMY(eventFrame.endDate)}`),
            showTimes: oldData.showTime ? [{ id: 'migrated-time-1', time: oldData.showTime }] : [],
            showDuration: oldData.showDuration || '',
            technicalProviders: (oldData.technicalProviders || []).map((p) => ({
                ...p,
                roles: (p.roles || []).map((r) => ({ ...r, printNotes: r.printNotes ?? true }))
            })),
            generalNotes: oldData.generalNotes || '',
            parking: {
                status: fromStringToStatus(oldData.parkingInfo),
                details: extractDetails(oldData.parkingInfo),
            },
            preAssembly: {
                status: fromStringToStatus(oldData.preAssemblySchedule),
                details: extractDetails(oldData.preAssemblySchedule),
            },
            schedule: {
                status: fromStringToStatus(oldData.preAssemblySchedule),
                details: '',
                data: (oldData.assemblySchedule || []).map((item, index) => ({ id: `migrated-sched-${index}`, date: '', time: item.time || '', description: item.description || '' })),
            },
            lighting: migrateNeeds(oldData.lightingNeeds),
            sound: migrateNeeds(oldData.soundNeeds),
            machinery: migrateNeeds(oldData.machineryNeeds),
            video: migrateNeeds(oldData.videoNeeds, oldData.videoDetails),
            rentals: migrateNeeds(oldData.rentalsNeeds, oldData.rentals),
            otherEquipment: migrateNeeds(oldData.otherEquipmentNeeds, oldData.otherEquipment),
            controlLocation: oldData.controlLocation || '',
            blueprints: oldData.blueprints || '',
            contacts: oldData.companyContact ? [{ id: 'migrated-contact-1', name: oldData.companyContact, role: '', phone: '', email: '' }] : (oldData.contacts || []),
            observations: oldData.observations || '',
            showLogistics: oldData.showLogistics ?? true,
            showPreAssembly: oldData.showPreAssembly ?? true,
            showSchedule: oldData.showSchedule ?? true,
            showNeeds: oldData.showNeeds ?? true,
            showOther: oldData.showOther ?? true,
            showGeneralNotesInPdf: oldData.showGeneralNotesInPdf ?? true,
            technicalPersonnelNotes: oldData.technicalPersonnelNotes || '',
            showTechnicalPersonnelNotesInPdf: oldData.showTechnicalPersonnelNotesInPdf ?? true,
            technicalNeedsNotes: oldData.technicalNeedsNotes || '',
            showTechnicalNeedsNotesInPdf: oldData.showTechnicalNeedsNotesInPdf ?? true,
            showScheduleNotesInPdf: oldData.showScheduleNotesInPdf ?? true,
        };
        return newSheet;
    }
    catch (error) {
        logger.error("Error migrating tech sheet data. Returning default sheet.", { error, originalData: data });
        return createDefaultTechSheetForMigration(eventFrame);
    }
};
//# sourceMappingURL=techSheetMigration.js.map