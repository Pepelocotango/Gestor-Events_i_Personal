import { EventFrame, PersonGroup, MaterialControlRow } from '../types';
type ActiveFilters = {
    filterText?: string | null;
    filterStatus?: string | null;
    filterDate?: string | null;
    localFilterUIPerson?: string | null;
    filterPlace?: string | null;
    filterUIEventFrame?: string | null;
};
export declare const escapeCsvCell: (cellData: string | number | boolean | undefined | null) => string;
export declare const exportEventListToCsv: (eventFrames: EventFrame[], peopleGroups: PersonGroup[], activeFilters: ActiveFilters) => {
    csvContent: string;
    fileName: string;
};
export declare const exportMaterialControlCsv: (data: MaterialControlRow[]) => {
    csvContent: string;
    fileName: string;
};
export {};
//# sourceMappingURL=csvUtils.d.ts.map