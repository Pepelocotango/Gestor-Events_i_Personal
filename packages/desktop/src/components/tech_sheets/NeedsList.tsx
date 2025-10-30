import React, { memo } from 'react';
import TechSheetField from './TechSheetField';
import { MaterialItem, useModalStore } from '@gep/core';
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
  getMaterialAvailability: (materialId: string, startDate: string, endDate: string, eventFrameId: string, currentItemId?: string) => { available: number; total: number };
  onMoveItemUp: (listName: string, index: number) => void;
  onMoveItemDown: (listName: string, index: number) => void;
  onSortByOrigin: (listName: string) => void;
  originSuggestions: string[];
  availabilityMap: Map<string, { available: number; total: number }>;
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
  onMoveItemUp,
  onMoveItemDown,
  onSortByOrigin,
  originSuggestions,
  availabilityMap,
}) => {
  const { openModal } = useModalStore();
  const materialSuggestions = React.useMemo(() => {
    return materialItems.map(item => {
      const availability = availabilityMap.get(item.id);
      if (availability) {
        return `${item.name} [Disp: ${availability.available} / Estoc: ${availability.total}]`;
      }
      return `${item.name} [Estoc: ${item.stock}]`;
    });
  }, [materialItems, availabilityMap]);

  return (
    <>
      <div className="col-span-full flex justify-between items-center mt-3 -mb-2">
        <h4 className="text-md font-semibold text-foreground">{title}:</h4>
        {needs.length > 1 && (
          <Tooltip text="Ordena la llista de necessitats alfabèticament per origen.">
            <button
              onClick={() => onSortByOrigin(listName)}
              className="text-xs px-2 py-1 rounded-md no-print bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Ordenar per Origen
            </button>
          </Tooltip>
        )}
      </div>
      {needs.length > 0 && (
        <div className="col-span-full flex items-center gap-4 w-full text-xs font-semibold text-muted-foreground mt-2 -mb-2">
          <div className="w-1/6">Quant.</div>
          <div className="flex-grow">Descripció</div>
          <div className="w-1/4">Origen</div>
          <div className="w-24 flex-shrink-0 text-center">Accions</div>
        </div>
      )}
      {needs.map((need, index) => {
        const selectedMaterial = materialItems.find(item => item.name === need.description);
        let availabilityInfo = '';
        let quantityError = false;
        if (selectedMaterial) {
          const availability = getMaterialAvailability(selectedMaterial.id, eventFrame.startDate, eventFrame.endDate, eventFrame.id, need.id);
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
                className={quantityError ? 'border-destructive ring-2 ring-destructive/30' : ''}
              />
            </div>
            <div className="flex-grow flex items-start gap-1">
              <div className='flex-grow'>
                <TechSheetField
                  id={`${listName}-desc-${index}`}
                  label=""
                  value={selectedMaterial ? selectedMaterial.name : need.description}
                  onChange={e => onListChange(listName, index, 'description', e.target.value)}
                  suggestions={materialSuggestions}
                  infoText={availabilityInfo}
                  readOnly={!!selectedMaterial}
                />
                {selectedMaterial && selectedMaterial.notes && (
                  <p className="no-print text-xs italic text-muted-foreground mt-1">
                    <strong>Nota:</strong> {selectedMaterial.notes}
                  </p>
                )}
              </div>
              {need.description && !selectedMaterial && (
                <div className="pt-2">
                  <Tooltip text="Crear nou ítem a l'inventari amb aquest nom">
                    <button
                      type="button"
                      onClick={() => openModal('addMaterialFromTechSheet', {
                        name: need.description,
                        onAdd: (newItem: MaterialItem) => {
                          onListChange(listName, index, 'description', newItem.name);
                          onListChange(listName, index, 'materialItemId', newItem.id);
                          onListChange(listName, index, 'origin', newItem.location);
                        }
                      })}
                      className="text-primary hover:bg-primary/10 rounded-full w-7 h-7 flex items-center justify-center text-2xl font-bold no-print"
                    >
                      +
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
            <div className="w-1/4">
              <TechSheetField
                id={`${listName}-origin-${index}`}
                label=""
                value={need.origin}
                onChange={e => onListChange(listName, index, 'origin', e.target.value)}
                placeholder="Propi/Teatre/CIA/lloguer...."
                readOnly={!!selectedMaterial}
                suggestions={originSuggestions}
              />
            </div>
            <div className="w-24 flex-shrink-0 pt-2 flex items-center justify-center">
              <Tooltip text="Moure amunt">
                <button
                  type="button"
                  onClick={() => onMoveItemUp(listName, index)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:bg-accent rounded-full w-7 h-7 flex items-center justify-center text-xl font-bold no-print disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  &#x25B2;
                </button>
              </Tooltip>
              <Tooltip text="Moure avall">
                <button
                  type="button"
                  onClick={() => onMoveItemDown(listName, index)}
                  disabled={index === needs.length - 1}
                  className="text-muted-foreground hover:bg-accent rounded-full w-7 h-7 flex items-center justify-center text-xl font-bold no-print disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  &#x25BC;
                </button>
              </Tooltip>
              <Tooltip text="Eliminar aquesta necessitat">
                <button
                  type="button"
                  onClick={() => onRemoveListItem(listName, index)}
                  className="text-destructive hover:bg-destructive/10 rounded-full w-7 h-7 flex items-center justify-center text-xl font-bold no-print"
                >
                  &times;
                </button>
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
            className="add-item-button px-4 py-2 rounded-md text-sm bg-success text-success-foreground hover:bg-success/90"
          >
            + Afegir Necessitat {title}
          </button>
        </Tooltip>
      </div>
    </>
  );
};

export default memo(NeedsList);
