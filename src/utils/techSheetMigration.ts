import { TechSheetData, EventFrame } from '../types';
import { formatDateDMY } from './dateFormat';

const isObject = (v: any) => v && typeof v === 'object' && !Array.isArray(v);


export const migrateTechSheetData = (data: any, eventFrame: EventFrame): TechSheetData => {
  // Check if data is already in the new format (with status field)
  if (data && isObject(data.preAssembly) && 'status' in data.preAssembly) {
    const needsKeys: (keyof TechSheetData)[] = ['lighting', 'sound', 'video', 'machinery', 'otherEquipment', 'rentals'];
    needsKeys.forEach(key => {
      const section = data[key];
      // This is the fix for the crash. Ensure the section is an object before trying to access .needs
      if (isObject(section) && !section.needs) {
        section.needs = [];
      }
    });
    return data as TechSheetData;
  }

  const oldData = data || {};
  const fromStringToStatus = (val: any) => {
    if (typeof val !== 'string' || val.trim() === '' || val.trim() === '--') return 'unset';
    if (val.startsWith('SI')) return 'yes';
    if (val.startsWith('NO')) return 'no';
    return 'yes'; // Default to 'yes' if there is text but no SI/NO prefix
  };

  const fromEnabledToStatus = (val: any) => {
    if (typeof val === 'boolean') return val ? 'yes' : 'no';
    return 'unset';
  }

  const newSheet: TechSheetData = {
    eventName: oldData.eventName || eventFrame.name,
    location: oldData.location || eventFrame.place || '',
    date: oldData.date || (eventFrame.startDate === eventFrame.endDate ? formatDateDMY(eventFrame.startDate) : `${formatDateDMY(eventFrame.startDate)} - ${formatDateDMY(eventFrame.endDate)}`),
    showTime: oldData.showTime || '',
    showDuration: oldData.showDuration || '',
    technicalProviders: oldData.technicalProviders || [],

    parkingInfo: {
      status: fromStringToStatus(oldData.parkingInfo),
      details: typeof oldData.parkingInfo === 'string' ? oldData.parkingInfo.replace(/^SI:?\s*/, '') : '',
    },
    preAssembly: {
      status: fromStringToStatus(oldData.preAssemblySchedule),
      details: typeof oldData.preAssemblySchedule === 'string' ? oldData.preAssemblySchedule.replace(/^SI:?\s*/, '') : '',
    },
    detailedSchedule: {
      status: fromStringToStatus(oldData.preAssemblySchedule),
      items: (oldData.assemblySchedule || []).map((item: any) => ({ ...item, date: eventFrame.startDate })),
    },
    dressingRooms: {
        status: fromStringToStatus(oldData.dressingRooms),
        quantity: parseInt(oldData.dressingRooms?.match(/(\d+)/)?.[0] || '0', 10),
        details: typeof oldData.dressingRooms === 'string' ? oldData.dressingRooms : '',
    },
    actors: {
      status: fromEnabledToStatus((oldData.actorsNumber || 0) > 0),
      quantity: oldData.actorsNumber || 0,
      names: oldData.actors || '',
    },
    companyTechnicians: {
      status: fromEnabledToStatus((oldData.companyTechniciansNumber || 0) > 0),
      quantity: oldData.companyTechniciansNumber || 0,
      names: oldData.companyTechnicians || '',
    },
    lighting: { status: (oldData.lightingNeeds?.length || 0) > 0 ? 'yes' : 'unset', details: '', needs: oldData.lightingNeeds || [] },
    sound: { status: (oldData.soundNeeds?.length || 0) > 0 ? 'yes' : 'unset', details: '', needs: oldData.soundNeeds || [] },
    machinery: { status: (oldData.machineryNeeds?.length || 0) > 0 ? 'yes' : 'unset', details: '', needs: oldData.machineryNeeds || [] },
    video: {
      status: fromStringToStatus(oldData.videoDetails),
      details: typeof oldData.videoDetails === 'string' ? oldData.videoDetails.replace(/^SI:?\s*/, '') : '',
      needs: oldData.videoNeeds || [],
    },
    otherEquipment: {
      status: fromStringToStatus(oldData.otherEquipment),
      details: typeof oldData.otherEquipment === 'string' ? oldData.otherEquipment.replace(/^SI:?\s*/, '') : '',
      needs: [],
    },
    rentals: {
      status: fromStringToStatus(oldData.rentals),
      details: typeof oldData.rentals === 'string' ? oldData.rentals.replace(/^SI:?\s*/, '') : '',
      needs: [],
    },
    controlLocation: { status: oldData.controlLocation ? 'yes' : 'unset', details: oldData.controlLocation || '' },
    blueprints: { status: oldData.blueprints ? 'yes' : 'unset', details: oldData.blueprints || '' },
    companyContact: { status: oldData.companyContact ? 'yes' : 'unset', details: oldData.companyContact || '' },
    observations: { status: oldData.observations ? 'yes' : 'unset', details: oldData.observations || '' },
  };

  return newSheet;
};
