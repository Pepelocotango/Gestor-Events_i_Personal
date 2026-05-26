/**
 * =============================================================================
 * ADD MATERIAL FROM TECH SHEET MODAL
 * =============================================================================
 * DESCRIPCIÓ:
 * Modal per afegir material des de la fitxa tècnica d'un esdeveniment.
 *
 * ÍNDEX:
 * - COMPONENT PRINCIPAL: AddMaterialFromTechSheetModal amb formulari de material.
 * =============================================================================
 */

import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useEventDataStore } from '../../stores/eventDataStore';
import { useModalStore } from '../../stores/modalStore';
import { MaterialItem } from '../../types';
import MaterialForm from '../forms/MaterialForm';

const AddMaterialFromTechSheetModal: React.FC = () => {
  const { t } = useTranslation();
  const { addMaterialItem } = useEventDataStore.getState();
  const materialItems = useEventDataStore(state => state.materialItems);
  const { closeModal, data: modalData } = useModalStore();

  const name = modalData?.name;
  const onAdd = modalData?.onAdd;

  // Llista de categories existents per a l'autocompletat
  const categories = useMemo(() => Array.from(new Set(materialItems.map(item => item.category))), [materialItems]);

  // Si les dades necessàries no estan presents, tanca el modal.
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
    // Assegurem que el nom no es perdi
    const finalData = { ...itemData, name: name || itemData.name };
    const newItem = addMaterialItem(finalData);

    if (newItem) {
      onAdd(newItem);
    }

    closeModal();
  };

  // No renderitzar res si les dades no són vàlides (useEffect s'encarregarà de tancar)
  if (!name || typeof onAdd !== 'function') {
    return null;
  }

  return (
    <div className="p-6 rounded-lg shadow-lg w-full max-w-lg mx-auto">
      <MaterialForm
        initialData={{ name }}
        onSubmit={handleSubmit}
        onCancel={closeModal}
        submitButtonText={t('modals.add_material_form.submit_button')}
        categories={categories}
      />
    </div>
  );
};

export default AddMaterialFromTechSheetModal;
