import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  const { addMaterialItem, updateMaterialItem, deleteMaterialItem } = useEventDataStore.getState();
  const materialItems = useEventDataStore(state => state.materialItems);
  const { openModal } = useModalStore();
  
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof MaterialItem; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [sortMode, setSortMode] = useState<'category' | 'name'>('category');

  const commonInputClass = "mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  const categories = useMemo(() => Array.from(new Set(materialItems.map((item: MaterialItem) => item.category))).sort((a,b) => a.localeCompare(b, 'ca', { sensitivity: 'base' })), [materialItems]);
  const locations = useMemo(() => Array.from(new Set(materialItems.map((item: MaterialItem) => item.location).filter(Boolean))).sort((a,b) => a.localeCompare(b, 'ca', { sensitivity: 'base' })), [materialItems]);

  const resetForm = () => {
    setEditingItem(null);
  };

  const handleEdit = (item: MaterialItem) => {
    setEditingItem(item);
  };
  
  const handleSubmit = (itemData: Omit<MaterialItem, 'id'>) => {
    if (editingItem) {
      updateMaterialItem({ ...editingItem, ...itemData });
      showToast('Material actualitzat.', 'success');
    } else {
      addMaterialItem(itemData);
      showToast('Nou material afegit.', 'success');
    }
    resetForm();
  };

  const handleDelete = (item: MaterialItem) => {
    openModal('confirmDelete', {
      itemType: 'Material',
      itemName: item.name,
      onConfirm: () => {
        deleteMaterialItem(item.id);
        showToast('Material eliminat.', 'success');
        if (editingItem?.id === item.id) {
          resetForm();
        }
      },
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
        acc[category] = true; // Default to all expanded
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
    <div key={item.id} className="p-3 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700/60">
      <div className="flex justify-between items-start gap-2">
        <div className="w-2/5">
          <p className="font-semibold">{item.name}</p>
          {item.notes && <p className="text-xs italic mt-1 text-gray-500 dark:text-gray-400">{item.notes}</p>}
        </div>
        <div className="w-1/5">
          <p className="text-sm text-gray-600 dark:text-gray-300">{item.stock}</p>
        </div>
        <div className="w-2/5">
          <p className="text-sm text-gray-600 dark:text-gray-300">{item.location}</p>
        </div>
        <div className="w-16 flex-shrink-0 flex items-center justify-end space-x-2">
          <Tooltip text={`Editar ${item.name}`}>
            <button onClick={() => handleEdit(item)} className="p-1"><EditIcon className="w-4 h-4 text-blue-600" /></button>
          </Tooltip>
          <Tooltip text={`Eliminar ${item.name}`}>
            <button onClick={() => handleDelete(item)} className="p-1"><TrashIcon className="w-4 h-4 text-red-600" /></button>
          </Tooltip>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestor de Material</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna del formulari */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
            {editingItem ? 'Editar Material' : 'Afegir Nou Material'}
          </h4>
          <MaterialForm
            key={editingItem ? editingItem.id : 'new'}
            initialData={editingItem || {}}
            onSubmit={handleSubmit}
            onCancel={editingItem ? resetForm : undefined}
            submitButtonText={editingItem ? 'Actualitzar' : 'Afegir'}
            categories={categories}
            locations={locations}
            materialItems={materialItems}
          />
        </div>

        {/* Columna de la llista */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium">Inventari</h4>
            <div className="flex items-center gap-2">
                <Tooltip text="Cercar per nom, categoria o ubicació">
                  <input type="search" placeholder="Cerca..." value={search} onChange={e => setSearch(e.target.value)} className={`${commonInputClass} mt-0 w-auto`} />
                </Tooltip>
                <Tooltip text="Exportar llista a PDF">
                  <button
                    onClick={handleExportPdf}
                    className="p-2 rounded-md bg-red-100 dark:bg-red-800/50 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-700/60"
                    aria-label="Exportar llista de material a PDF"
                    disabled={filteredItems.length === 0}
                  >
                    <PdfIcon className="w-5 h-5" />
                  </button>
                </Tooltip>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-3 border-b dark:border-gray-700 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Ordenar per:</span>
              <Tooltip text="Agrupar per categoria i ordenar dins de cada grup">
                <button onClick={() => handleSortModeChange('category')} className={`px-2 py-1 text-sm rounded-md ${sortMode === 'category' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Categoria</button>
              </Tooltip>
              <Tooltip text="Ordenar tota la llista per nom d'ítem">
                <button onClick={() => handleSortModeChange('name')} className={`px-2 py-1 text-sm rounded-md ${sortMode === 'name' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Nom d'Ítem</button>
              </Tooltip>
            </div>
            {sortMode === 'category' && Object.keys(expandedCategories).length > 0 && (
              <Tooltip text="Expandir o col·lapsar totes les categories">
                <button onClick={toggleAll} className="px-2 py-1 text-sm rounded-md bg-gray-200 dark:bg-gray-600">
                  {Object.values(expandedCategories).every(Boolean) ? 'Col·lapsar Tot' : 'Expandir Tot'}
                </button>
              </Tooltip>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {sortMode === 'category' && (
              <div className="hidden md:flex items-center gap-2 p-2 text-xs font-bold text-gray-500 dark:text-gray-400 border-b dark:border-gray-600 mb-2">
                <Tooltip text="Ordenar per nom">
                  <button onClick={() => requestSort('name')} className="w-2/5 text-left hover:text-gray-800 dark:hover:text-gray-200">
                    Nom
                    {sortConfig.key === 'name' && <SortArrow direction={sortConfig.direction} />}
                  </button>
                </Tooltip>
                <Tooltip text="Ordenar per estoc">
                  <button onClick={() => requestSort('stock')} className="w-1/5 text-left hover:text-gray-800 dark:hover:text-gray-200">
                    Estoc
                    {sortConfig.key === 'stock' && <SortArrow direction={sortConfig.direction} />}
                  </button>
                </Tooltip>
                <Tooltip text="Ordenar per ubicació">
                  <button onClick={() => requestSort('location')} className="w-2/5 text-left hover:text-gray-800 dark:hover:text-gray-200">
                    Ubicació
                    {sortConfig.key === 'location' && <SortArrow direction={sortConfig.direction} />}
                  </button>
                </Tooltip>
                <div className="w-16 flex-shrink-0 text-right">Accions</div>
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
                    headerClassName="bg-gray-50 dark:bg-gray-700/50 text-md"
                    contentClassName="space-y-2"
                  >
                    {items.map(renderItemRow)}
                  </CollapsibleSection>
                ))
              ) : (
                <div className="space-y-2">
                  {(sortedItems as MaterialItem[]).map(renderItemRow)}
                </div>
              )
            ) : <p className="text-center text-gray-500">No s'ha trobat material o l'inventari està buit.</p>}
          </div>
        </div>
      </div>

      <CollapsibleSection
        title="Centre de Control de Material"
        defaultOpen={false}
        headerClassName="text-xl font-semibold"
      >
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
          <MaterialControlCenter showToast={showToast} />
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default MaterialDisplay;