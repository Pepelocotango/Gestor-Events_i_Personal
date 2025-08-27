import React, { memo } from 'react';
import TechSheetField from './TechSheetField';
import { MaterialItem } from '../../types';
import Tooltip from '../ui/Tooltip';

interface NeedsListProps {
  needs: any[];
  title: string;
  listName: string;
  materialItems: MaterialItem[];
  eventFrame: any;
  onListChange: (listName: string, index: number, field: string, value: any) => void;
  onRemoveListItem: (listName: string, index: number) => void;
  onAddListItem: (listName: string) => void;
  getMaterialAvailability: (materialId: string, startDate: string, endDate: string, eventFrameId: string) => { available: number; total: number };
}

const NeedsList: React.FC<NeedsListProps> = ({
  needs,
  title,
  listName,
  materialItems,
  eventFrame,
  onListChange,
  onRemoveListItem,
  onAddListItem,
  getMaterialAvailability,
}) => {
  const materialSuggestions = React.useMemo(() => materialItems.map(item => item.name), [materialItems]);

  return (
    <>
      <h4 className="col-span-full text-md font-semibold text-gray-700 dark:text-gray-300 mt-3 -mb-2">{title}:</h4>
      {needs.length > 0 && (
        <div className="col-span-full flex items-center gap-4 w-full text-xs font-semibold text-gray-500 dark:text-gray-400 -mb-2">
          <div className="w-1/6">Quant.</div>
          <div className="w-2/5">Descripció</div>
          <div className="w-2/5">Origen</div>
          <div className="w-auto flex-shrink-0"></div>
        </div>
      )}
      {needs.map((need, index) => {
        const selectedMaterial = materialItems.find(item => item.name === need.description);
        let availabilityInfo = '';
        let quantityError = false;
        if (selectedMaterial) {
          const availability = getMaterialAvailability(selectedMaterial.id, eventFrame.startDate, eventFrame.endDate, eventFrame.id);
          availabilityInfo = `(Disp: ${availability.available} / ${availability.total})`;
          if (Number(need.quantity) > availability.available) {
            quantityError = true;
          }
        }
        return (
          <div key={need.id || `${listName}-need-${index}`} className="col-span-full flex items-start gap-4 w-full">
            <div className="w-1/6">
              <TechSheetField
                id={`${listName}-qty-${index}`}
                label=""
                type="number"
                value={need.quantity}
                onChange={e => onListChange(listName, index, 'quantity', e.target.value)}
                placeholder="XX"
                className={quantityError ? 'border-red-500 ring-2 ring-red-300' : ''}
              />
            </div>
            <div className="w-2/5">
              <TechSheetField
                id={`${listName}-desc-${index}`}
                label=""
                value={need.description}
                onChange={e => onListChange(listName, index, 'description', e.target.value)}
                suggestions={materialSuggestions}
                infoText={availabilityInfo}
              />
            </div>
            <div className="w-2/5">
              <TechSheetField
                id={`${listName}-origin-${index}`}
                label=""
                value={need.origin}
                onChange={e => onListChange(listName, index, 'origin', e.target.value)}
                placeholder="CIA / TÀG"
              />
            </div>
            <div className="w-auto flex-shrink-0 pt-2">
              <Tooltip text="Eliminar aquesta necessitat">
                <button
                  type="button"
                  onClick={() => onRemoveListItem(listName, index)}
                  className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold no-print"
                >×</button>
              </Tooltip>
            </div>
          </div>
        )
      })}
      <div className="col-span-full mt-2 no-print">
        <Tooltip text={`Afegir una nova línia de necessitat de ${title.toLowerCase()}`}>
          <button
            type="button"
            onClick={() => onAddListItem(listName)}
            className="add-item-button px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
          >
            + Afegir Necessitat {title}
          </button>
        </Tooltip>
      </div>
    </>
  );
};

export default memo(NeedsList);
