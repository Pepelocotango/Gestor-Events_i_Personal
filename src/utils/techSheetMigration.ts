import { TechSheetData, EventFrame, ConditionalStatus, NeedItem } from '../types';
import { formatDateDMY } from './dateFormat';
import logger from './logger';

const isObject = (v: any) => v && typeof v === 'object' && !Array.isArray(v);

// This is a minimal version of createDefaultTechSheet to avoid circular dependencies
const createDefaultTechSheetForMigration = (eventFrame: EventFrame): TechSheetData => {
  const defaultConditional = () => ({ status: 'unset' as const, details: '', data: { needs: [] } });
  return {
    eventName: eventFrame.name,
    location: eventFrame.place || '',
    date: formatDateDMY(eventFrame.startDate),
    showTime: '',
    showDuration: '',
    technicalProviders: [],
    generalNotes: '',
    parking: { status: 'unset', details: '' },
    preAssembly: { status: 'unset', details: '' },
    schedule: { status: 'unset', details: '', data: [] },
    dressingRooms: '',
    actorsNumber: 0,
    actors: '',
    companyTechniciansNumber: 0,
    companyTechnicians: '',
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


export const migrateTechSheetData = (data: any, eventFrame: EventFrame): TechSheetData => {
  try {
    // Check if data is already in the new format
    if (data && isObject(data.lighting) && isObject(data.sound)) {
        return data as TechSheetData;
    }

    const oldData = data || {};
    const defaultSheet = createDefaultTechSheetForMigration(eventFrame);

    const fromStringToStatus = (val: any): ConditionalStatus => {
        if (typeof val !== 'string' || val.trim() === '' || val.trim() === '--') return 'unset';
        if (val.toUpperCase().startsWith('SI')) return 'yes';
        if (val.toUpperCase().startsWith('NO')) return 'no';
        return 'yes';
    };

    const extractDetails = (val: any): string => {
        if (typeof val !== 'string') return '';
        return val.replace(/^SI:?\s*/i, '').trim();
    };

    const migrateNeeds = (oldNeeds: any, oldDetails?: any) => {
        const needs = (Array.isArray(oldNeeds) ? oldNeeds : []) as NeedItem[];
        const details = extractDetails(oldDetails);
        const status = fromStringToStatus(oldDetails);
        // If there are needs but status is unset, make it 'yes'
        const finalStatus = (status === 'unset' && needs.length > 0) ? 'yes' : status;
        return { status: finalStatus, details, data: { needs } };
    };

    const newSheet: TechSheetData = {
        ...defaultSheet,

        eventName: oldData.eventName || eventFrame.name,
        location: oldData.location || eventFrame.place || '',
        date: oldData.date || (eventFrame.startDate === eventFrame.endDate ? formatDateDMY(eventFrame.startDate) : `${formatDateDMY(eventFrame.startDate)} - ${formatDateDMY(eventFrame.endDate)}`),
        showTime: oldData.showTime || '',
        showDuration: oldData.showDuration || '',
        technicalProviders: (oldData.technicalProviders || []).map((p: any) => ({
            ...p,
            roles: (p.roles || []).map((r: any) => ({ ...r, printNotes: r.printNotes ?? true }))
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
            data: (oldData.assemblySchedule || []).map((item: any, index: number) => ({ id: `migrated-sched-${index}`, date: '', time: item.time || '', description: item.description || '' })),
        },
        dressingRooms: oldData.dressingRooms || '',
        actorsNumber: oldData.actorsNumber || 0,
        actors: oldData.actors || '',
        companyTechniciansNumber: oldData.companyTechniciansNumber || 0,
        companyTechnicians: oldData.companyTechnicians || '',

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
    };

    return newSheet;

  } catch (error) {
    logger.error("Error migrating tech sheet data. Returning default sheet.", { error, originalData: data });
    return createDefaultTechSheetForMigration(eventFrame);
  }
};
