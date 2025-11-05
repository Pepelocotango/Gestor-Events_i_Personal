import { EventFrame, AssignmentStatus } from '../types';
/**
 * Selector per obtenir les vistes filtrades d'eventFrames
 * Aquest selector evita bucles de renderitzat perquè calcula les dades derivades al moment
 */
export declare const selectFilteredEventFrames: (state: {
    eventFrames: EventFrame[];
    peopleGroups: {
        id: string;
        name: string;
    }[];
    filterText: string;
    filterStatus: AssignmentStatus | "";
    filterDate: string;
    localFilterUIPerson: string;
    filterPlace: string;
    filterUIEventFrame: string | null;
    showArchived?: boolean;
}) => EventFrame[];
//# sourceMappingURL=selectors.d.ts.map