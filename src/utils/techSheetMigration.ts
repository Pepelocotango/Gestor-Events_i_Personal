import { TechSheetData, EventFrame, ConditionalStatus } from '../types';
import { formatDateDMY } from './dateFormat';
import logger from './logger';

const isObject = (v: any) => v && typeof v === 'object' && !Array.isArray(v);

// This is a minimal version of createDefaultTechSheet to avoid circular dependencies
const createDefaultTechSheetForMigration = (eventFrame: EventFrame): TechSheetData => {
  const defaultConditional = () => ({ status: 'unset' as const, details: '' });
  return {
    eventName: eventFrame.name,
    location: eventFrame.place || '',
    date: formatDateDMY(eventFrame.startDate),
    showTime: '',
    showDuration: '',
    technicalProviders: [],
    generalNotes: `Notes generals per a ${eventFrame.name}`,
    parking: defaultConditional(),
    preAssembly: defaultConditional(),
    schedule: { status: 'unset', details: '', data: [] },
    dressingRooms: '',
    actorsNumber: 0,
    actors: '',
    companyTechniciansNumber: 0,
    companyTechnicians: '',
    lightingNeeds: [],
    soundNeeds: [],
    video: defaultConditional(),
    videoNeeds: [],
    machineryNeeds: [],
    rentals: defaultConditional(),
    rentalsNeeds: [],
    otherEquipment: defaultConditional(),
    otherEquipmentNeeds: [],
    electrical: defaultConditional(),
    electricalNeeds: [],
    structures: defaultConditional(),
    structuresNeeds: [],
    platforms: defaultConditional(),
    platformsNeeds: [],
    consumables: defaultConditional(),
    consumablesNeeds: [],
    curtains: defaultConditional(),
    curtainsNeeds: [],
    transport: defaultConditional(),
    transportNeeds: [],
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
    showPersonnelNotesInPdf: true,
  };
};


export const migrateTechSheetData = (data: any, eventFrame: EventFrame): TechSheetData => {
  try {
    // Check if data is already in the new format
    if (data && isObject(data.schedule) && Array.isArray(data.schedule.data)) {
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

    const newSheet: TechSheetData = {
        ...defaultSheet, // Start with defaults

        // Overwrite with old data if it exists
        eventName: oldData.eventName || eventFrame.name,
        location: oldData.location || eventFrame.place || '',
        date: oldData.date || (eventFrame.startDate === eventFrame.endDate ? formatDateDMY(eventFrame.startDate) : `${formatDateDMY(eventFrame.startDate)} - ${formatDateDMY(eventFrame.endDate)}`),
        showTime: oldData.showTime || '',
        showDuration: oldData.showDuration || '',
        technicalProviders: oldData.technicalProviders || [],

        generalNotes: oldData.generalNotes || `Notes generals per a ${eventFrame.name}`,
        parking: {
            status: fromStringToStatus(oldData.parkingInfo),
            details: extractDetails(oldData.parkingInfo),
        },
        preAssembly: {
            status: fromStringToStatus(oldData.preAssemblySchedule),
            details: extractDetails(oldData.preAssemblySchedule),
        },
        schedule: {
            status: fromStringToStatus(oldData.preAssemblySchedule), // Schedule visibility is tied to preAssembly in old data
            details: '',
            data: (oldData.assemblySchedule || []).map((item: any, index: number) => ({ id: `migrated-sched-${index}`, date: '', time: item.time || '', description: item.description || '' })),
        },
        dressingRooms: oldData.dressingRooms || '',
        actorsNumber: oldData.actorsNumber || 0,
        actors: oldData.actors || '',
        companyTechniciansNumber: oldData.companyTechniciansNumber || 0,
        companyTechnicians: oldData.companyTechnicians || '',
        lightingNeeds: oldData.lightingNeeds || [],
        soundNeeds: oldData.soundNeeds || [],
        video: {
            status: fromStringToStatus(oldData.videoDetails),
            details: extractDetails(oldData.videoDetails),
        },
        videoNeeds: oldData.videoNeeds || [],
        machineryNeeds: oldData.machineryNeeds || [],
        rentals: {
            status: fromStringToStatus(oldData.rentals),
            details: extractDetails(oldData.rentals),
        },
        rentalsNeeds: oldData.rentalsNeeds || [],
        otherEquipment: {
            status: fromStringToStatus(oldData.otherEquipment),
            details: extractDetails(oldData.otherEquipment),
        },
        otherEquipmentNeeds: oldData.otherEquipmentNeeds || [],
        controlLocation: oldData.controlLocation || '',
        blueprints: oldData.blueprints || '',
        contacts: oldData.companyContact ? [{ id: 'migrated-contact-1', name: oldData.companyContact, role: '', phone: '', email: '' }] : (oldData.contacts || []),
        observations: oldData.observations || '',

        // Keep existing PDF visibility settings if they exist, otherwise default
        showLogistics: oldData.showLogistics ?? true,
        showPreAssembly: oldData.showPreAssembly ?? true,
        showSchedule: oldData.showSchedule ?? true,
        showNeeds: oldData.showNeeds ?? true,
        showOther: oldData.showOther ?? true,
        showGeneralNotesInPdf: oldData.showGeneralNotesInPdf ?? true,
        showPersonnelNotesInPdf: oldData.showPersonnelNotesInPdf ?? true,
    };

    return newSheet;

  } catch (error) {
    logger.error("Error migrating tech sheet data. Returning default sheet.", { error, originalData: data });
    return createDefaultTechSheetForMigration(eventFrame);
  }
};
