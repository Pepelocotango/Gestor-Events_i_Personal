import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EventFrame, PackingListItem } from '../../types';
import { useEventDataStore } from '../../stores/eventDataStore';
import { useModalStore } from '../../stores/modalStore';
import { notificationService } from '../../utils/notificationService';
import { exportPackingListToPdf } from '../../utils/pdfGenerator';
import { BriefcaseIcon, PlusIcon, DocumentArrowDownIcon, TrashIcon } from '@heroicons/react/24/outline';
import Tooltip from '../ui/Tooltip';

interface LogisticsModalProps {
  eventFrame: EventFrame;
  onClose: () => void;
}

const LogisticsModal: React.FC<LogisticsModalProps> = ({ eventFrame, onClose }) => {
  const { t } = useTranslation();
  const { materialItems, generatePackingListFromNeeds, addPackingItem, removePackingItem, updatePackingItem, togglePackingItemLoaded } = useEventDataStore();
  const { openModal } = useModalStore();
  
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItemData, setNewItemData] = useState({
    materialItemId: '',
    quantity: 1,
    notes: ''
  });

  const packingList = eventFrame.packingList;
  const statusText = packingList ? t(`logistics.status_${packingList.status}`) : t('logistics.status_draft');

  const handleImportFromNeeds = () => {
    if (packingList && packingList.items.length > 0) {
      // Demanar confirmació si la llista no està buida
      openModal('confirmDelete', {
        message: t('logistics.confirm_regenerate_message'),
        onConfirm: () => {
          const result = generatePackingListFromNeeds(eventFrame.id);
          if (result.success) {
            notificationService.success(result.message);
          } else {
            notificationService.error(result.message);
          }
        }
      });
    } else {
      // Generar directament si està buida
      const result = generatePackingListFromNeeds(eventFrame.id);
      if (result.success) {
        notificationService.success(result.message);
      } else {
        notificationService.error(result.message);
      }
    }
  };

  const handleAddItem = () => {
    if (!newItemData.materialItemId) {
      notificationService.error(t('logistics.select_material_error'));
      return;
    }

    const result = addPackingItem(eventFrame.id, {
      materialItemId: newItemData.materialItemId,
      quantity: newItemData.quantity,
      originSource: t('logistics.origin_manual'),
      isLoaded: false,
      notes: newItemData.notes
    });

    if (result) {
      setNewItemData({ materialItemId: '', quantity: 1, notes: '' });
      setShowAddItemForm(false);
      notificationService.success(t('logistics.item_added_success'));
    }
  };

  const handleRemoveItem = (itemId: string) => {
    removePackingItem(eventFrame.id, itemId);
    notificationService.success(t('logistics.item_removed_success'));
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    updatePackingItem(eventFrame.id, itemId, { quantity });
  };

  const handleToggleLoaded = (itemId: string) => {
    togglePackingItemLoaded(eventFrame.id, itemId);
  };

  const handlePrintPackingList = async () => {
    try {
      await exportPackingListToPdf(eventFrame, materialItems, (message: string, type?: 'success' | 'error' | 'info' | 'warning') => {
        if (type === 'success') {
          notificationService.success(message);
        } else if (type === 'error') {
          notificationService.error(message);
        } else if (type === 'warning') {
          notificationService.warning(message);
        } else {
          notificationService.info(message);
        }
      });
    } catch (error) {
      notificationService.error(t('logistics.print_error'));
    }
  };

  const getMaterialName = (materialItemId: string): string => {
    const material = materialItems.find(m => m.id === materialItemId);
    return material ? material.name : t('logistics.material_not_found');
  };

  const getMaterialCategory = (materialItemId: string): string => {
    const material = materialItems.find(m => m.id === materialItemId);
    return material ? material.category : t('logistics.unknown_category');
  };

  const groupedItems = packingList?.items.reduce((groups, item) => {
    const category = getMaterialCategory(item.materialItemId);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, PackingListItem[]>) || {};

  return (
    <div className="space-y-6">
      {/* Capçalera amb estat */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{eventFrame.name}</h3>
          <p className="text-sm text-muted-foreground">
            {t('logistics.status')}: <span className="font-medium">{statusText}</span>
          </p>
        </div>
        {packingList?.lastUpdated && (
          <p className="text-xs text-muted-foreground">
            {t('logistics.last_updated')}: {new Date(packingList.lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

        {/* Barra d'eines */}
        <div className="flex flex-wrap gap-2">
          <Tooltip text={t('logistics.import_from_needs_tooltip')}>
            <button
              onClick={handleImportFromNeeds}
              className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <span>⚡</span>
              {t('logistics.import_from_needs')}
            </button>
          </Tooltip>

          <Tooltip text={t('logistics.add_item_tooltip')}>
            <button
              onClick={() => setShowAddItemForm(true)}
              className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              {t('logistics.add_item')}
            </button>
          </Tooltip>

          <Tooltip text={t('logistics.print_list_tooltip')}>
            <button
              onClick={handlePrintPackingList}
              className="flex items-center gap-2 px-3 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              {t('logistics.print_list')}
            </button>
          </Tooltip>
        </div>

        {/* Formulari d'afegir ítem */}
        {showAddItemForm && (
          <div className="border border-border rounded-lg p-4 bg-card">
            <h4 className="font-medium mb-3">{t('logistics.add_manual_item')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={newItemData.materialItemId}
                onChange={(e) => setNewItemData(prev => ({ ...prev, materialItemId: e.target.value }))}
                className="px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">{t('logistics.select_material')}</option>
                {materialItems.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.category})
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                value={newItemData.quantity}
                onChange={(e) => setNewItemData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder={t('logistics.quantity')}
              />

              <input
                type="text"
                value={newItemData.notes}
                onChange={(e) => setNewItemData(prev => ({ ...prev, notes: e.target.value }))}
                className="px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder={t('logistics.notes')}
              />

              <div className="flex gap-2">
                <button
                  onClick={handleAddItem}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  {t('common.add')}
                </button>
                <button
                  onClick={() => setShowAddItemForm(false)}
                  className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Llista d'ítems */}
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-medium text-foreground mb-2">{category}</h4>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                        {t('logistics.loaded')}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                        {t('logistics.quantity')}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                        {t('logistics.material_name')}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                        {t('logistics.origin')}
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={item.isLoaded}
                            onChange={() => handleToggleLoaded(item.id)}
                            className="w-4 h-4 text-primary focus:ring-primary border-border rounded"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            className="w-20 px-2 py-1 bg-input border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {getMaterialName(item.materialItemId)}
                        </td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">
                          {item.originSource}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-destructive hover:text-destructive/90 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Missatge si no hi ha ítems */}
        {!packingList || packingList.items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BriefcaseIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('logistics.empty_list_message')}</p>
            <button
              onClick={handleImportFromNeeds}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {t('logistics.import_from_needs')}
            </button>
          </div>
        ) : null}

        {/* Peu del modal */}
        <div className="flex justify-end pt-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
  );
};

export default LogisticsModal;
