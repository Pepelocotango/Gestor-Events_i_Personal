import React, { useState, useEffect } from 'react';
import { useEventDataStore } from '../../stores/eventDataStore';
import { useModalStore } from '../../stores/modalStore';
import { MaterialItem } from '../../types';

const AddMaterialFromTechSheetModal: React.FC = () => {
  const { addMaterialItem } = useEventDataStore.getState();
  const { closeModal, data: modalData } = useModalStore();

  const name = modalData?.name;
  const onAdd = modalData?.onAdd;

  const [category, setCategory] = useState('');
  const [stock, setStock] = useState(1);
  const [location, setLocation] = useState('');

  useEffect(() => {
    // If the modal is opened without the required data, close it as a safeguard.
    if (!name || typeof onAdd !== 'function') {
      console.warn('AddMaterialFromTechSheetModal opened with invalid data, closing.');
      closeModal();
    }
  }, [name, onAdd, closeModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !location) {
      alert('La categoria i l\'origen són obligatoris.');
      return;
    }

    // Safeguard against undefined name/onAdd, even though useEffect should prevent this.
    if (!name || !onAdd) {
        closeModal();
        return;
    }

    const newItemData: Omit<MaterialItem, 'id'> = {
      name,
      category,
      stock,
      location,
      notes: '',
    };

    const newItem = addMaterialItem(newItemData);

    if (newItem) {
        onAdd(newItem);
    }

    closeModal();
  };

  // Render nothing if the data is not valid, useEffect will handle closing it.
  if (!name || typeof onAdd !== 'function') {
    return null;
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Afegir Material a l'Inventari</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom del Material</label>
          <input
            type="text"
            id="name"
            value={name}
            disabled
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Inicial</label>
          <input
            type="number"
            id="stock"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            required
            min="0"
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Origen / Ubicació</label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
            Cancel·lar
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Afegir Material
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMaterialFromTechSheetModal;
