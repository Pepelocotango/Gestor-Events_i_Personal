/**
 * =============================================================================
 * MATERIAL DISPLAY
 * =============================================================================
 * DESCRIPCIÓ:
 * Component per mostrar i gestionar el material amb filtres i exportació.
 *
 * ÍNDEX:
 * - IMPORTS I DEPENDÈNCIES: Llibreries React, stores i components UI.
 * - SUB-COMPONENTS: SortArrow per indicar direcció d'ordenació.
 * - COMPONENT PRINCIPAL: MaterialDisplay amb llista de material.
 * - ESTAT I FILTRATGE: Estat de filtres i ordenació.
 * - HANDLERS: Gestió d'edició, esborrat i exportació.
 * - RENDERITZAT: Estructura de taula amb material.
 * =============================================================================
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalStore } from '../stores/modalStore';
import MaterialControlCenter from './MaterialControlCenter';
import { useEventDataStore } from '../stores/eventDataStore';
import { MaterialItem, ShowToastFunction } from '../types';
import { TrashIcon, EditIcon, PdfIcon } from '../constants';
import { exportMaterialToPdf } from '../utils/pdfGenerator';
import CollapsibleSection from './ui/CollapsibleSection';
import Tooltip from './ui/Tooltip';
import MaterialForm from './forms/MaterialForm';

const SortArrow = ({ direction }: { direction: 'ascending' | 'descending' | null }) => {
  if (!direction) return null;
  return <span>{direction === 'ascending' ? ' ↑' : ' ↓'}</span>;
};

interface MaterialDisplayProps {
  showToast: ShowToastFunction;
}

const MaterialDisplay: React.FC<MaterialDisplayProps> = ({ showToast }) => {
  const { t } = useTranslation();
  const { addMaterialItem, updateMaterialItem, deleteMaterialItem } = useEventDataStore.getState();
  const materialItems = useEventDataStore(state => state.materialItems);
  const { openModal } = useModalStore();

  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof MaterialItem; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [sortMode, setSortMode] = useState<'category' | 'name'>('category');

  const commonInputClass = "mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm";

  const categories = useMemo(() => Array.from(new Set(materialItems.map((item: MaterialItem) => item.category))).sort((a, b) => a.localeCompare(b, 'ca', { sensitivity: 'base' })), [materialItems]);
  const locations = useMemo(() => Array.from(new Set(materialItems.map((item: MaterialItem) => item.location).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ca', { sensitivity: 'base' })), [materialItems]);

  const resetForm = () => {
    setEditingItem(null);
  };

  const handleEdit = (item: MaterialItem) => {
    setEditingItem(item);
  };

  const handleSubmit = (itemData: Omit<MaterialItem, 'id'>) => {
    if (editingItem) {
      updateMaterialItem({ ...editingItem, ...itemData });
      showToast(t('material.item_updated_toast'), 'success');
    } else {
      addMaterialItem(itemData);
      showToast(t('material.item_added_toast'), 'success');
    }
    resetForm();
  };

  const handleDelete = (item: MaterialItem) => {
    openModal('confirmDelete', {
      itemType: t('material.item_type'),
      itemName: t('material.delete_item_confirm_msg', { name: item.name }),
      onConfirm: () => {
        deleteMaterialItem(item.id);
        if (editingItem?.id === item.id) {
          resetForm();
        }
      },
      confirmButtonText: t('common.delete'),
      intent: 'destructive',
    });
  };

  const handleExportPdf = () => {
    exportMaterialToPdf(filteredItems, showToast);
  };

  const requestSort = useCallback((key: keyof MaterialItem) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const filteredItems = useMemo(() => materialItems.filter((item: MaterialItem) => {
    const searchTerm = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm) ||
      item.location.toLowerCase().includes(searchTerm)
    );
  }), [materialItems, search]);

  const sortedItems = useMemo(() => {
    const sortableItems = [...filteredItems];

    if (sortMode === 'category') {
      const grouped: { [category: string]: MaterialItem[] } = {};
      sortableItems.forEach(item => {
        const category = item.category || 'Sense Categoria';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(item);
      });

      Object.values(grouped).forEach(items => {
        items.sort((a, b) => {
          const valA = a[sortConfig.key];
          const valB = b[sortConfig.key];
          let comparison = 0;
          if (typeof valA === 'number' && typeof valB === 'number') comparison = valA - valB;
          else if (valA !== undefined && valB !== undefined) comparison = String(valA).localeCompare(String(valB), 'ca', { sensitivity: 'base' });
          else if (valA !== undefined) comparison = 1;
          else if (valB !== undefined) comparison = -1;
          return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
      });
      return Object.entries(grouped).sort(([catA], [catB]) => catA.localeCompare(catB, 'ca', { sensitivity: 'base' }));
    } else { // sortMode === 'name'
      sortableItems.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name, 'ca', { sensitivity: 'base' });
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
      return sortableItems;
    }
  }, [filteredItems, sortConfig, sortMode]);

  useEffect(() => {
    if (sortMode === 'category') {
      const initialExpandedState = (sortedItems as [string, MaterialItem[]][]).reduce((acc, [category]) => {
        acc[category] = false; // Default to all collapsed
        return acc;
      }, {} as { [key: string]: boolean });
      setExpandedCategories(initialExpandedState);
    }
  }, [sortedItems, sortMode]);

  const handleSortModeChange = (mode: 'category' | 'name') => {
    setSortMode(mode);
    if (mode === 'category') {
      setSortConfig({ key: 'category', direction: 'ascending' });
    } else { // mode === 'name'
      setSortConfig({ key: 'name', direction: 'ascending' });
    }
  };

  const toggleAll = () => {
    const allCurrentlyExpanded = Object.values(expandedCategories).every(Boolean);
    const newState = { ...expandedCategories };
    for (const key in newState) {
      newState[key] = !allCurrentlyExpanded;
    }
    setExpandedCategories(newState);
  };

  const handleToggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const renderItemRow = (item: MaterialItem) => (
    <li key={item.id} className="p-2 border border-border rounded-md bg-muted/50 hover:bg-accent transition-colors">
      <div className="flex justify-between items-start gap-2">
        <div className="w-2/5">
          <p className="font-semibold text-foreground">{item.name}</p>
          {item.notes && <p className="text-xs italic mt-1 text-muted-foreground">{item.notes}</p>}
        </div>
        <div className="w-1/5">
          <p className="text-sm text-foreground">{item.stock}</p>
        </div>
        <div className="w-2/5">
          <p className="text-sm text-foreground">{item.location}</p>
        </div>
        <div className="w-16 flex-shrink-0 flex items-center justify-end space-x-2">
          <Tooltip text={`${t('common.edit')} ${item.name}`}>
            <button onClick={() => handleEdit(item)} className="p-1 text-primary hover:text-primary/80"><EditIcon className="w-4 h-4" /></button>
          </Tooltip>
          <Tooltip text={`${t('common.delete')} ${item.name}`}>
            <button onClick={() => handleDelete(item)} className="p-1 text-destructive hover:text-destructive/80"><TrashIcon className="w-4 h-4" /></button>
          </Tooltip>
        </div>
      </div>
    </li>
  );

  return (
    <div className="space-y-4">
      <CollapsibleSection
        title={t('material.manager_title')}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Columna del formulari (25%) */}
          <div className="lg:col-span-1">
            <CollapsibleSection
              title={editingItem ? t('material.edit_item_title') : t('material.add_item_title')}
              defaultOpen={true}
            >
              <MaterialForm
                key={editingItem ? editingItem.id : 'new'}
                initialData={editingItem || {}}
                onSubmit={handleSubmit}
                onCancel={editingItem ? resetForm : undefined}
                submitButtonText={editingItem ? t('material.update_button') : t('material.add_button')}
                categories={categories}
                locations={locations}
                materialItems={materialItems}
              />
            </CollapsibleSection>
          </div>

          {/* Columna de la llista (75%) */}
          <div className="lg:col-span-2">
            <CollapsibleSection
              title={t('material.inventory_title')}
              defaultOpen={false}
            >
              <div className="flex items-center justify-end mb-2 gap-2">
                <Tooltip text={t('material.search_tooltip')}>
                  <input type="search" placeholder={t('material.search_placeholder')} value={search} onChange={e => setSearch(e.target.value)} className={`${commonInputClass} mt-0 w-auto`} />
                </Tooltip>
                <Tooltip text={t('material.export_pdf_tooltip')}>
                  <button
                    onClick={handleExportPdf}
                    className="p-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20"
                    aria-label={t('material.export_pdf_tooltip')}
                    disabled={filteredItems.length === 0}
                  >
                    <PdfIcon className="w-5 h-5" />
                  </button>
                </Tooltip>
              </div>
              <div className="flex items-center gap-4 mb-3 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{t('material.sort_by')}</span>
                  <Tooltip text={t('material.sort_category_tooltip')}>
                    <button onClick={() => handleSortModeChange('category')} className={`px-2 py-1 text-sm rounded-md ${sortMode === 'category' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>{t('material.sort_category')}</button>
                  </Tooltip>
                  <Tooltip text={t('material.sort_name_tooltip')}>
                    <button onClick={() => handleSortModeChange('name')} className={`px-2 py-1 text-sm rounded-md ${sortMode === 'name' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>{t('material.sort_name')}</button>
                  </Tooltip>
                </div>
                {sortMode === 'category' && Object.keys(expandedCategories).length > 0 && (
                  <Tooltip text={t('material.toggle_all_tooltip')}>
                    <button onClick={toggleAll} className="px-2 py-1 text-sm rounded-md bg-secondary text-secondary-foreground">
                      {Object.values(expandedCategories).every(Boolean) ? t('material.collapse_all') : t('material.expand_all')}
                    </button>
                  </Tooltip>
                )}
              </div>

              <div className="max-h-[60vh] overflow-y-auto space-y-2">
                {sortMode === 'category' && (
                  <div className="hidden md:flex items-center gap-2 p-2 text-xs font-bold text-muted-foreground border-b border-border mb-2">
                    <Tooltip text={t('material.sort_name_header_tooltip')}>
                      <button onClick={() => requestSort('name')} className="w-2/5 text-left hover:text-foreground">
                        {t('material.header_name')}
                        {sortConfig.key === 'name' && <SortArrow direction={sortConfig.direction} />}
                      </button>
                    </Tooltip>
                    <Tooltip text={t('material.sort_stock_header_tooltip')}>
                      <button onClick={() => requestSort('stock')} className="w-1/5 text-left hover:text-foreground">
                        {t('material.header_stock')}
                        {sortConfig.key === 'stock' && <SortArrow direction={sortConfig.direction} />}
                      </button>
                    </Tooltip>
                    <Tooltip text={t('material.sort_location_header_tooltip')}>
                      <button onClick={() => requestSort('location')} className="w-2/5 text-left hover:text-foreground">
                        {t('material.header_location')}
                        {sortConfig.key === 'location' && <SortArrow direction={sortConfig.direction} />}
                      </button>
                    </Tooltip>
                    <div className="w-16 flex-shrink-0 text-right">{t('material.header_actions')}</div>
                  </div>
                )}
                {filteredItems.length > 0 ? (
                  sortMode === 'category' ? (
                    (sortedItems as [string, MaterialItem[]][]).map(([category, items]) => (
                      <CollapsibleSection
                        key={category}
                        title={`${category} (${items.length})`}
                        isExpanded={expandedCategories[category]}
                        onToggle={() => handleToggleCategory(category)}
                        headerClassName="bg-muted/50 text-md"
                        contentClassName="space-y-2"
                      >
                        <ul className="space-y-2 list-none">
                          {items.map(renderItemRow)}
                        </ul>
                      </CollapsibleSection>
                    ))
                  ) : (
                    <ul className="space-y-2">
                      {(sortedItems as MaterialItem[]).map(renderItemRow)}
                    </ul>
                  )
                ) : <p className="text-center text-muted-foreground">{t('material.no_items_found')}</p>}
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={t('material.control_center_title')}
        defaultOpen={false}
        headerClassName="text-xl font-semibold"
      >
        <div className="p-4 bg-muted rounded-b-lg border-t border-border">
          <MaterialControlCenter showToast={showToast} />
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default MaterialDisplay;