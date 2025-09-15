import { EventFrame, Assignment, AssignmentStatus } from '../types';

/**
 * Selector per obtenir les vistes filtrades d'eventFrames
 * Aquest selector evita bucles de renderitzat perquè calcula les dades derivades al moment
 */
export const selectFilteredEventFrames = (state: {
  eventFrames: EventFrame[];
  peopleGroups: { id: string; name: string }[];
  filterText: string;
  filterStatus: AssignmentStatus | '';
  filterDate: string;
  localFilterUIPerson: string;
  filterPlace: string;
  filterUIEventFrame: string | null;
}) => {
  const {
    eventFrames,
    peopleGroups,
    filterText,
    filterStatus,
    filterDate,
    localFilterUIPerson,
    filterPlace,
    filterUIEventFrame
  } = state;

  // Crear mapa de persones per eficiència
  const peopleMap = new Map<string, string>();
  peopleGroups.forEach(p => peopleMap.set(p.id, p.name));

  try {
    let frames = [...eventFrames];

    // Aplicar filtres
    if (filterUIEventFrame) {
      frames = frames.filter(ef => ef.id === filterUIEventFrame);
    }
    
    if (filterPlace) {
      const normPlace = filterPlace.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      frames = frames.filter(ef => 
        ef.place && 
        ef.place.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normPlace)
      );
    }
    
    if (!filterUIEventFrame) {
      if (filterText) {
        const lowerFilterText = filterText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        frames = frames.filter(ef => {
          const efFields = [ef.name, ef.place || '', ef.generalNotes || '']
            .join(' ')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          
          const assignFields = ef.assignments
            .map((a: Assignment) => [
              peopleMap.get(a.personGroupId) || '', 
              a.notes || ''
            ].join(' '))
            .join(' ')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          
          return efFields.includes(lowerFilterText) || assignFields.includes(lowerFilterText);
        });
      }
      
      if (filterStatus) {
        frames = frames.filter(ef => 
          ef.assignments.some((a: Assignment) => 
            a.status === filterStatus || 
            (a.status === AssignmentStatus.Mixed && 
             a.dailyStatuses && 
             Object.values(a.dailyStatuses).includes(filterStatus))
          )
        );
      }
      
      if (localFilterUIPerson) {
        frames = frames.filter(ef => 
          ef.assignments.some(a => a.personGroupId === localFilterUIPerson)
        );
      }
      
      if (filterDate) {
        frames = frames.filter(ef => 
          new Date(ef.startDate) <= new Date(filterDate) && 
          new Date(ef.endDate) >= new Date(filterDate)
        );
      }
    }

    return frames;
  } catch (error) {
    console.error('[selectFilteredEventFrames] Error aplicant filtres:', error);
    return [];
  }
};
