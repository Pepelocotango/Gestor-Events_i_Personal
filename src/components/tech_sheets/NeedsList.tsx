import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { MaterialItem } from '../../types';
import Tooltip from '../ui/Tooltip';
import NeedItem from './NeedItem';

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
  sortDirection: 'asc' | 'desc';
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
  sortDirection,
  originSuggestions,
  availabilityMap,
}) => {
  const { t } = useTranslation();
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
          <Tooltip text={t('tech_sheets.needs.sort_tooltip')}>
            <button
              onClick={() => onSortByOrigin(listName)}
              className="text-xs px-2 py-1 rounded-md no-print bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-1"
            >
              {t('tech_sheets.needs.sort_by_origin')}
              <span className="text-xs">
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
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
      {needs.map((need, index) => (
  <NeedItem
    key={need.id || `${listName}-need-${index}`}
    need={need}
    index={index}
    listName={listName}
    isLast={index === needs.length - 1}
    materialItems={materialItems}
    eventFrame={eventFrame}
    onListChange={onListChange}
    onRemoveListItem={onRemoveListItem}
    onMoveItemUp={onMoveItemUp}
    onMoveItemDown={onMoveItemDown}
    getMaterialAvailability={getMaterialAvailability}
    originSuggestions={originSuggestions}
    materialSuggestions={materialSuggestions}
  />
))}
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

