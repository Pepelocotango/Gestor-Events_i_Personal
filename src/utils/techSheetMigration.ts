import { TechSheetData, EventFrame, ConditionalString, ConditionalQuantityAndString, ConditionalNeeds } from '../types';
import { formatDateDMY } from './dateFormat';

const isObject = (v: any) => v && typeof v === 'object' && !Array.isArray(v);

const defaultConditionalString = (): ConditionalString => ({ enabled: false, details: '' });
const defaultConditionalQuantityAndString = (): ConditionalQuantityAndString => ({ enabled: false, quantity: 0, details: '' });
const defaultConditionalNeeds = (): ConditionalNeeds => ({ enabled: false, details: '', needs: [] });

export const migrateTechSheetData = (data: any, eventFrame: EventFrame): TechSheetData => {
  if (data && isObject(data.preAssembly)) {
    const needsKeys = ['lighting', 'sound', 'video', 'machinery', 'otherEquipment', 'rentals'];
    needsKeys.forEach(key => {
      if (data[key] && !data[key].needs) {
        data[key].needs = [];
      }
    });
    return data as TechSheetData;
  }

  const oldData = data || {};

  const newSheet: TechSheetData = {
    eventName: oldData.eventName || eventFrame.name,
    location: oldData.location || eventFrame.place || '',
    date: oldData.date || (eventFrame.startDate === eventFrame.endDate ? formatDateDMY(eventFrame.startDate) : `${formatDateDMY(eventFrame.startDate)} - ${formatDateDMY(eventFrame.endDate)}`),
    showTime: oldData.showTime || '',
    showDuration: oldData.showDuration || '',
    technicalProviders: oldData.technicalProviders || [],
    parkingInfo: (() => {
      const val = oldData.parkingInfo;
      if (typeof val === 'string') {
        if (val.startsWith('SI')) return { enabled: true, details: val.replace(/^SI:?\s*/, '') };
        if (val.startsWith('NO')) return defaultConditionalString();
        return val.trim() ? { enabled: true, details: val } : defaultConditionalString();
      }
      return defaultConditionalString();
    })(),
    preAssembly: (() => {
      const val = oldData.preAssemblySchedule;
      if (typeof val === 'string' && val.startsWith('SI')) {
        return { enabled: true, details: val.replace(/^SI:?\s*/, '') };
      }
      return defaultConditionalString();
    })(),
    detailedSchedule: {
      enabled: typeof oldData.preAssemblySchedule === 'string' && oldData.preAssemblySchedule.startsWith('SI'),
      items: (oldData.assemblySchedule || []).map((item: any) => ({
        id: item.id,
        time: item.time,
        description: item.description,
        date: eventFrame.startDate,
      })),
    },
    dressingRooms: (() => {
        const val = oldData.dressingRooms;
        if (typeof val === 'string' && val.trim()) {
            const match = val.match(/(\d+)/);
            const quantity = match ? parseInt(match[0], 10) : 1;
            const details = /^\d+\s*$/.test(val.trim()) ? '' : val;
            return { enabled: true, quantity, details };
        }
        return defaultConditionalQuantityAndString();
    })(),
    actors: {
      enabled: (oldData.actorsNumber || 0) > 0,
      quantity: oldData.actorsNumber || 0,
      names: oldData.actors || '',
    },
    companyTechnicians: {
      enabled: (oldData.companyTechniciansNumber || 0) > 0,
      quantity: oldData.companyTechniciansNumber || 0,
      names: oldData.companyTechnicians || '',
    },
    lighting: { enabled: (oldData.lightingNeeds?.length || 0) > 0, details: '', needs: oldData.lightingNeeds || [] },
    sound: { enabled: (oldData.soundNeeds?.length || 0) > 0, details: '', needs: oldData.soundNeeds || [] },
    machinery: { enabled: (oldData.machineryNeeds?.length || 0) > 0, details: '', needs: oldData.machineryNeeds || [] },
    video: (() => {
      const enabled = typeof oldData.videoDetails === 'string' && oldData.videoDetails.startsWith('SI');
      return {
        enabled,
        details: enabled ? oldData.videoDetails.replace(/^SI:?\s*/, '') : '',
        needs: oldData.videoNeeds || [],
      };
    })(),
    otherEquipment: (() => {
      const val = oldData.otherEquipment;
      if (typeof val === 'string' && val.startsWith('SI')) {
        return { enabled: true, details: val.replace(/^SI:?\s*/, ''), needs: [] };
      }
      return defaultConditionalNeeds();
    })(),
    rentals: (() => {
      const val = oldData.rentals;
      if (typeof val === 'string' && val.startsWith('SI')) {
        return { enabled: true, details: val.replace(/^SI:?\s*/, ''), needs: [] };
      }
      return defaultConditionalNeeds();
    })(),
    controlLocation: oldData.controlLocation ? { enabled: true, details: oldData.controlLocation } : defaultConditionalString(),
    blueprints: oldData.blueprints ? { enabled: true, details: oldData.blueprints } : defaultConditionalString(),
    companyContact: oldData.companyContact ? { enabled: true, details: oldData.companyContact } : defaultConditionalString(),
    observations: oldData.observations ? { enabled: true, details: oldData.observations } : defaultConditionalString(),
  };

  return newSheet;
};
