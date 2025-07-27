import React, { useState, FormEvent, useMemo, useCallback } from 'react';
import { useEventData } from '../contexts/EventDataContext';
import { MaterialItem } from '../types';
import { TrashIcon, EditIcon, PdfIcon } from '../constants';
import { exportMaterialToPdf } from '../utils/pdfGenerator';
import CollapsibleSection from './ui/CollapsibleSection';

const SortArrow = ({ direction }: { direction: 'ascending' | 'descending' | null }) => {
  if (!direction) return null;
  return <span>{direction === 'ascending' ? ' ↑' : ' ↓'}</span>;
};

const MaterialDisplay: React.FC = () => {
  const { materialItems, addMaterialItem, updateMaterialItem, deleteMaterialItem, showToast } = useEventData();
  
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState(1);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof MaterialItem | null; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });
  
  const commonInputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  const categories = useMemo(() => Array.from(new Set(materialItems.map((item: MaterialItem) => item.category))).sort(), [materialItems]);

  const resetForm = () => {
    setEditingItem(null);
    setName('');
    setCategory('');
    setStock(1);
    setLocation('');
    setNotes('');
    setErrors({});
  };

  const handleEdit = (item: MaterialItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setStock(item.stock);
    setLocation(item.location);
    setNotes(item.notes || '');
  };
  
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "El nom és obligatori.";
    if (!category.trim()) newErrors.category = "La categoria és obligatòria.";
    if (stock < 0) newErrors.stock = "L'estoc no pot ser negatiu.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const itemData = { name, category, stock: Number(stock), location, notes };
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
    if (window.confirm(`Segur que vols eliminar "${item.name}"?`)) {
      deleteMaterialItem(item.id);
      showToast('Material eliminat.', 'success');
      if (editingItem?.id === item.id) {
        resetForm();
      }
    }
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

  const filteredItems = materialItems.filter((item: MaterialItem) => {
    const searchTerm = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm) ||
      item.location.toLowerCase().includes(searchTerm)
    );
  });
  
  const sortedItemsByCategory = useMemo(() => {
    const grouped: { [category: string]: MaterialItem[] } = {};
    filteredItems.forEach(item => {
      const category = item.category || 'Sense Categoria';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    // Ara, ordena els ítems dins de cada categoria
    if (sortConfig.key) {
      const key = sortConfig.key;
      Object.values(grouped).forEach(items => {
        items.sort((a, b) => {
          const valA = a[key];
          const valB = b[key];

          let comparison = 0;
          if (typeof valA === 'number' && typeof valB === 'number') {
            comparison = valA - valB;
          } else if (valA !== undefined && valB !== undefined) {
            comparison = String(valA).localeCompare(String(valB), 'ca', { sensitivity: 'base' });
          } else if (valA !== undefined) {
            comparison = 1;
          } else if (valB !== undefined) {
            comparison = -1;
          }

          return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
      });
    }

    return Object.entries(grouped).sort(([catA], [catB]) => catA.localeCompare(catB));
  }, [filteredItems, sortConfig]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestor de Material</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna del formulari */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">
              {editingItem ? 'Editar Material' : 'Afegir Nou Material'}
            </h4>
            
            <div>
              <label htmlFor="mat-name" className="block text-sm font-medium">Nom</label>
              <input type="text" id="mat-name" value={name} onChange={e => setName(e.target.value)} className={commonInputClass} required />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="mat-category" className="block text-sm font-medium">Categoria</label>
              <input type="text" id="mat-category" value={category} onChange={e => setCategory(e.target.value)} className={commonInputClass} list="category-suggestions" required />
              <datalist id="category-suggestions">
                {categories.map((cat: string) => <option key={cat} value={cat} />)}
              </datalist>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="mat-stock" className="block text-sm font-medium">Estoc</label>
                <input type="number" id="mat-stock" value={stock} onChange={e => setStock(Number(e.target.value))} className={commonInputClass} min="0" required />
                {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
              </div>
              <div>
                <label htmlFor="mat-location" className="block text-sm font-medium">Ubicació</label>
                <input type="text" id="mat-location" value={location} onChange={e => setLocation(e.target.value)} className={commonInputClass} />
              </div>
            </div>

            <div>
              <label htmlFor="mat-notes" className="block text-sm font-medium">Notes</label>
              <textarea id="mat-notes" value={notes} onChange={e => setNotes(e.target.value)} className={commonInputClass} rows={3}></textarea>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              {editingItem && <button type="button" onClick={resetForm} className="px-3 py-1.5 text-sm font-medium bg-gray-200 dark:bg-gray-600 rounded-md">Cancel·lar</button>}
              <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md">{editingItem ? 'Actualitzar' : 'Afegir'}</button>
            </div>
          </form>
        </div>

        {/* Columna de la llista */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium">Inventari</h4>
            <div className="flex items-center gap-2">
                <input type="search" placeholder="Cerca..." value={search} onChange={e => setSearch(e.target.value)} className={`${commonInputClass} mt-0 w-auto`} />
                <button
                  onClick={handleExportPdf}
                  className="p-2 rounded-md bg-red-100 dark:bg-red-800/50 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-700/60"
                  title="Exportar llista a PDF"
                  aria-label="Exportar llista de material a PDF"
                  disabled={filteredItems.length === 0}
                >
                  <PdfIcon className="w-5 h-5" />
                </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            <div className="hidden md:flex items-center gap-2 p-2 text-xs font-bold text-gray-500 dark:text-gray-400 border-b dark:border-gray-600 mb-2">
              <button onClick={() => requestSort('name')} className="w-2/5 text-left hover:text-gray-800 dark:hover:text-gray-200">
                Nom
                {sortConfig.key === 'name' && <SortArrow direction={sortConfig.direction} />}
              </button>
              <button onClick={() => requestSort('stock')} className="w-1/5 text-left hover:text-gray-800 dark:hover:text-gray-200">
                Estoc
                {sortConfig.key === 'stock' && <SortArrow direction={sortConfig.direction} />}
              </button>
              <button onClick={() => requestSort('location')} className="w-2/5 text-left hover:text-gray-800 dark:hover:text-gray-200">
                Ubicació
                {sortConfig.key === 'location' && <SortArrow direction={sortConfig.direction} />}
              </button>
              <div className="w-16 flex-shrink-0 text-right">Accions</div>
            </div>
            {filteredItems.length > 0 ? (
              sortedItemsByCategory.map(([category, items]) => (
                <CollapsibleSection 
                  key={category} 
                  title={`${category} (${items.length})`}
                  defaultOpen={true}
                  headerClassName="bg-gray-50 dark:bg-gray-700/50 text-md"
                  contentClassName="space-y-2"
                >
                  {items.map((item: MaterialItem) => (
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
                          <button onClick={() => handleEdit(item)} className="p-1"><EditIcon className="w-4 h-4 text-blue-600" /></button>
                          <button onClick={() => handleDelete(item)} className="p-1"><TrashIcon className="w-4 h-4 text-red-600" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CollapsibleSection>
              ))
            ) : <p className="text-center text-gray-500">No s'ha trobat material o l'inventari està buit.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialDisplay;