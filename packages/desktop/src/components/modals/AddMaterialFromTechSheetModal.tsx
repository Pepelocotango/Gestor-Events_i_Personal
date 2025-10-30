import React, { useEffect, useMemo } from 'react';
import { useEventDataStore, useModalStore, MaterialItem } from '@gep/core';
import MaterialForm from '../forms/MaterialForm';

const AddMaterialFromTechSheetModal: React.FC = () => {
  const { addMaterialItem } = useEventDataStore.getState();
  const materialItems = useEventDataStore(state => state.materialItems);
  const { closeModal, data: modalData } = useModalStore();

  const name = modalData?.name;
  const onAdd = modalData?.onAdd;

  const categories = useMemo(() => Array.from(new Set(materialItems.map(item => item.category))), [materialItems]);

  useEffect(() => {
    if (!name || typeof onAdd !== 'function') {
      console.warn('AddMaterialFromTechSheetModal opened with invalid data, closing.');
      closeModal();
    }
  }, [name, onAdd, closeModal]);

  const handleSubmit = (itemData: Omit<MaterialItem, 'id'>) => {
    if (typeof onAdd !== 'function') {
      console.error("Error: onAdd no és una funció. Tancant modal.");
      closeModal();
      return;
    }
    const finalData = { ...itemData, name: name || itemData.name };
    const newItem = addMaterialItem(finalData);

    if (newItem) {
      onAdd(newItem);
    }

    closeModal();
  };

  if (!name || typeof onAdd !== 'function') {
    return null;
  }

  return (
    <div className="p-6 rounded-lg shadow-lg w-full max-w-lg mx-auto">
      <MaterialForm
        initialData={{ name }}
        onSubmit={handleSubmit}
        onCancel={closeModal}
        submitButtonText="Afegir Material"
        categories={categories}
      />
    </div>
  );
};

export default AddMaterialFromTechSheetModal;
