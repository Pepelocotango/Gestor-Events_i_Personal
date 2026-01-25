import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import TechSheetField from './TechSheetField';
import { MaterialItem } from '../../types';
import Tooltip from '../ui/Tooltip';
import { useModalStore } from '../../stores/modalStore';

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
  const { t } = useTranslation();
  const { openModal } = useModalStore();
  const materialSuggestions = React.useMemo(() => {
    return materialItems.map(item => {
      const availability = availabilityMap.get(item.id);
      if (availability) {
        return `${item.name} [${t('tech_sheets.needs.availability_prefix')}: ${availability.available} / ${t('tech_sheets.needs.stock_prefix')}: ${availability.total}]`;
      }
      return `${item.name} [${t('tech_sheets.needs.stock_prefix')}: ${item.stock}]`;
    });
  }, [materialItems, availabilityMap, t]);

  return (
    <>
      <div className="col-span-full flex justify-between items-center mt-3 -mb-2">
        <h4 className="text-md font-semibold text-foreground">{title}:</h4>
        {needs.length > 1 && (
          <Tooltip text={t('tech_sheets.needs.sort_origin_tooltip')}>
            <button
              onClick={() => onSortByOrigin(listName)}
              className="text-xs px-2 py-1 rounded-md no-print bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              {t('tech_sheets.needs.sort_origin')}
            </button>
          </Tooltip>
        )}
      </div>
      {needs.length > 0 && (
        <div className="col-span-full flex items-center gap-4 w-full text-xs font-semibold text-muted-foreground mt-2 -mb-2">
          <div className="w-1/6">{t('tech_sheets.needs.header_qty')}</div>
          <div className="flex-grow">{t('tech_sheets.needs.header_desc')}</div>
          <div className="w-1/4">{t('tech_sheets.needs.header_origin')}</div>
          <div className="w-24 flex-shrink-0 text-center">{t('tech_sheets.needs.header_actions')}</div>
        </div>
      )}
      {needs.map((need, index) => {
        const selectedMaterial = materialItems.find(item => item.name === need.description);
        let availabilityInfo = '';
        let quantityError = false;
        if (selectedMaterial) {
          const availability = getMaterialAvailability(selectedMaterial.id, eventFrame.startDate, eventFrame.endDate, eventFrame.id, need.id);
          availabilityInfo = `(${t('tech_sheets.needs.availability_prefix')}: ${availability.available} / ${availability.total})`;
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
                    <strong>{t('common.note')}:</strong> {selectedMaterial.notes}
                  </p>
                )}
              </div>
              {need.description && !selectedMaterial && (
                <div className="pt-2">
                  <Tooltip text={t('tech_sheets.needs.add_to_inventory_tooltip')}>
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
                placeholder={t('tech_sheets.needs.origin_placeholder')}
                readOnly={!!selectedMaterial}
                suggestions={originSuggestions}
              />
            </div>
            <div className="w-24 flex-shrink-0 pt-2 flex items-center justify-center">
              <Tooltip text={t('common.move_up')}>
                <button
                  type="button"
                  onClick={() => onMoveItemUp(listName, index)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:bg-accent rounded-full w-7 h-7 flex items-center justify-center text-xl font-bold no-print disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  &#x25B2;
                </button>
              </Tooltip>
              <Tooltip text={t('common.move_down')}>
                <button
                  type="button"
                  onClick={() => onMoveItemDown(listName, index)}
                  disabled={index === needs.length - 1}
                  className="text-muted-foreground hover:bg-accent rounded-full w-7 h-7 flex items-center justify-center text-xl font-bold no-print disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  &#x25BC;
                </button>
              </Tooltip>
              <Tooltip text={t('tech_sheets.needs.remove_tooltip')}>
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
        <Tooltip text={t('tech_sheets.needs.add_item_tooltip', { title: title.toLowerCase() })}>
          <button
            type="button"
            onClick={() => onAddListItem(listName)}
            className="add-item-button px-4 py-2 rounded-md text-sm bg-success text-success-foreground hover:bg-success/90"
          >
            {t('tech_sheets.needs.add_item', { title: title })}
          </button>
        </Tooltip>
      </div>
    </>
  );
};

export default memo(NeedsList);

