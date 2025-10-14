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

  const commonInputClass = "mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm";

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
      itemName: `Segur que vols eliminar <strong>${item.name}</strong>?`,
      onConfirm: () => {
        deleteMaterialItem(item.id);
        if (editingItem?.id === item.id) {
          resetForm();
        }
      },
      confirmButtonText: 'Eliminar',
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
    <div key={item.id} className="p-3 border border-border rounded-md bg-muted/50">
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
          <Tooltip text={`Editar ${item.name}`}>
            <button onClick={() => handleEdit(item)} className="p-1 text-primary hover:text-primary/80"><EditIcon className="w-4 h-4" /></button>
          </Tooltip>
          <Tooltip text={`Eliminar ${item.name}`}>
            <button onClick={() => handleDelete(item)} className="p-1 text-destructive hover:text-destructive/80"><TrashIcon className="w-4 h-4" /></button>
          </Tooltip>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <CollapsibleSection
        title="Gestor de Material"
        defaultOpen={true}
        onHeaderDoubleClick={toggleAll}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna del formulari */}
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md">
            <h4 className="text-lg font-medium mb-4">
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
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium">Inventari</h4>
              <div className="flex items-center gap-2">
                  <Tooltip text="Cercar per nom, categoria o ubicació">
                    <input type="search" placeholder="Cerca..." value={search} onChange={e => setSearch(e.target.value)} className={`${commonInputClass} mt-0 w-auto`} />
                  </Tooltip>
                  <Tooltip text="Exportar llista a PDF">
                    <button
                      onClick={handleExportPdf}
                      className="p-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20"
                      aria-label="Exportar llista de material a PDF"
                      disabled={filteredItems.length === 0}
                    >
                      <PdfIcon className="w-5 h-5" />
                    </button>
                  </Tooltip>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-3 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Ordenar per:</span>
                <Tooltip text="Agrupar per categoria i ordenar dins de cada grup">
                  <button onClick={() => handleSortModeChange('category')} className={`px-2 py-1 text-sm rounded-md ${sortMode === 'category' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>Categoria</button>
                </Tooltip>
                <Tooltip text="Ordenar tota la llista per nom d'ítem">
                  <button onClick={() => handleSortModeChange('name')} className={`px-2 py-1 text-sm rounded-md ${sortMode === 'name' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>Nom d'Ítem</button>
                </Tooltip>
              </div>
              {sortMode === 'category' && Object.keys(expandedCategories).length > 0 && (
                <Tooltip text="Expandir o col·lapsar totes les categories">
                  <button onClick={toggleAll} className="px-2 py-1 text-sm rounded-md bg-secondary text-secondary-foreground">
                    {Object.values(expandedCategories).every(Boolean) ? 'Col·lapsar Tot' : 'Expandir Tot'}
                  </button>
                </Tooltip>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              {sortMode === 'category' && (
                <div className="hidden md:flex items-center gap-2 p-2 text-xs font-bold text-muted-foreground border-b border-border mb-2">
                  <Tooltip text="Ordenar per nom">
                    <button onClick={() => requestSort('name')} className="w-2/5 text-left hover:text-foreground">
                      Nom
                      {sortConfig.key === 'name' && <SortArrow direction={sortConfig.direction} />}
                    </button>
                  </Tooltip>
                  <Tooltip text="Ordenar per estoc">
                    <button onClick={() => requestSort('stock')} className="w-1/5 text-left hover:text-foreground">
                      Estoc
                      {sortConfig.key === 'stock' && <SortArrow direction={sortConfig.direction} />}
                    </button>
                  </Tooltip>
                  <Tooltip text="Ordenar per ubicació">
                    <button onClick={() => requestSort('location')} className="w-2/5 text-left hover:text-foreground">
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
                      headerClassName="bg-muted/50 text-md"
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
              ) : <p className="text-center text-muted-foreground">No s'ha trobat material o l'inventari està buit.</p>}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Centre de Control de Material"
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