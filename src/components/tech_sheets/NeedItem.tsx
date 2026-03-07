import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import TechSheetField from './TechSheetField';
import { MaterialItem } from '../../types';
import Tooltip from '../ui/Tooltip';
import { useModalStore } from '../../stores/modalStore';

interface NeedItemProps {
  need: any;
  index: number;
  listName: string;
  isLast: boolean;
  materialItems: MaterialItem[];
  eventFrame: any;
  onListChange: (listName: string, index: number, field: string, value: any) => void;
  onRemoveListItem: (listName: string, index: number) => void;
  onMoveItemUp: (listName: string, index: number) => void;
  onMoveItemDown: (listName: string, index: number) => void;
  getMaterialAvailability: (materialId: string, startDate: string, endDate: string, eventFrameId: string, currentItemId?: string) => { available: number; total: number };
  originSuggestions: string[];
  materialSuggestions: string[];
}

const NeedItem: React.FC<NeedItemProps> = ({
  need,
  index,
  listName,
  isLast,
  materialItems,
  eventFrame,
  onListChange,
  onRemoveListItem,
  onMoveItemUp,
  onMoveItemDown,
  getMaterialAvailability,
  originSuggestions,
  materialSuggestions,
}) => {
  const { t } = useTranslation();
  const { openModal } = useModalStore();

  const selectedMaterial = materialItems.find(item => item.name === need.description);

  let availabilityInfo = '';
  let quantityError = false;
  if (selectedMaterial) {
    const availability = getMaterialAvailability(
      selectedMaterial.id,
      eventFrame.startDate,
      eventFrame.endDate,
      eventFrame.id,
      need.id
    );
    availabilityInfo = `(${t('tech_sheets.needs.availability_prefix')}: ${availability.available} / ${availability.total})`;
    if (Number(need.quantity) > availability.available) {
      quantityError = true;
    }
  }

  const handleQtyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onListChange(listName, index, 'quantity', e.target.value),
    [onListChange, listName, index]
  );

  const handleDescChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onListChange(listName, index, 'description', e.target.value),
    [onListChange, listName, index]
  );

  const handleOriginChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onListChange(listName, index, 'origin', e.target.value),
    [onListChange, listName, index]
  );

  const handleMoveUp = useCallback(
    () => onMoveItemUp(listName, index),
    [onMoveItemUp, listName, index]
  );

  const handleMoveDown = useCallback(
    () => onMoveItemDown(listName, index),
    [onMoveItemDown, listName, index]
  );

  const handleRemove = useCallback(
    () => onRemoveListItem(listName, index),
    [onRemoveListItem, listName, index]
  );

  const handleAddToInventory = useCallback(() => {
    openModal('addMaterialFromTechSheet', {
      name: need.description,
      onAdd: (newItem: MaterialItem) => {
        onListChange(listName, index, 'description', newItem.name);
        onListChange(listName, index, 'materialItemId', newItem.id);
        onListChange(listName, index, 'origin', newItem.location);
      },
    });
  }, [openModal, need.description, onListChange, listName, index]);

  return (
    <div className="col-span-full flex items-start gap-4 w-full">
      <div className="w-1/6">
        <TechSheetField
          id={`${listName}-qty-${index}`}
          label=""
          type="number"
          value={need.quantity}
          onChange={handleQtyChange}
          placeholder={t('tech_sheets.needs.quantity_placeholder')}
          className={quantityError ? 'border-destructive ring-2 ring-destructive/30' : ''}
        />
      </div>
      <div className="flex-grow flex items-start gap-1">
        <div className="flex-grow">
          <TechSheetField
            id={`${listName}-desc-${index}`}
            label=""
            value={selectedMaterial ? selectedMaterial.name : need.description}
            onChange={handleDescChange}
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
                onClick={handleAddToInventory}
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
          onChange={handleOriginChange}
          placeholder={t('tech_sheets.needs.origin_placeholder')}
          readOnly={!!selectedMaterial}
          suggestions={originSuggestions}
        />
      </div>
      <div className="w-24 flex-shrink-0 pt-2 flex items-center justify-center">
        <Tooltip text={t('common.move_up')}>
          <button
            type="button"
            onClick={handleMoveUp}
            disabled={index === 0}
            className="text-muted-foreground hover:bg-accent rounded-full w-7 h-7 flex items-center justify-center text-xl font-bold no-print disabled:opacity-30 disabled:cursor-not-allowed"
          >
            &#x25B2;
          </button>
        </Tooltip>
        <Tooltip text={t('common.move_down')}>
          <button
            type="button"
            onClick={handleMoveDown}
            disabled={isLast}
            className="text-muted-foreground hover:bg-accent rounded-full w-7 h-7 flex items-center justify-center text-xl font-bold no-print disabled:opacity-30 disabled:cursor-not-allowed"
          >
            &#x25BC;
          </button>
        </Tooltip>
        <Tooltip text={t('tech_sheets.needs.remove_tooltip')}>
          <button
            type="button"
            onClick={handleRemove}
            className="text-destructive hover:bg-destructive/10 rounded-full w-7 h-7 flex items-center justify-center text-xl font-bold no-print"
          >
            &times;
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default memo(NeedItem);
