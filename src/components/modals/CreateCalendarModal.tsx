import React, { useState } from 'react';
import { ShowToastFunction } from '@/types';
import { useEventDataStore } from '@/stores/eventDataStore';
import Tooltip from '../ui/Tooltip';

interface CreateCalendarModalProps {
  onClose: () => void;
  showToast: ShowToastFunction;
}

const CreateCalendarModal: React.FC<CreateCalendarModalProps> = ({ onClose, showToast }) => {
  const { refreshGoogleEvents } = useEventDataStore.getState();
  const [suffix, setSuffix] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!suffix.trim()) {
      showToast('El sufix no pot estar buit.', 'warning');
      return;
    }
    setIsCreating(true);
    if (window.electronAPI?.createNewAppCalendar) {
      try {
        const result = await window.electronAPI.createNewAppCalendar(suffix.trim());
        if (result.success) {
          showToast('Nou calendari creat i seleccionat com a actiu.', 'success');
          await refreshGoogleEvents(showToast);
          // Dispatch event to notify settings modal to refresh
          window.dispatchEvent(new CustomEvent('googleConfigChanged'));
          onClose();
        } else {
          showToast(result.message || 'No s\'ha pogut crear el calendari.', 'error');
        }
      } catch (err) {
        showToast((err as Error).message, 'error');
      } finally {
        setIsCreating(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Crear Nou Calendari de l'App</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Introdueix un sufix únic per al nou calendari (ex: Teatre Principal). Aquest sufix s'afegirà al nom base "Gestor d'Esdeveniments (App)".
        </p>
      </div>

      <div>
        <label htmlFor="calendar-suffix" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Sufix del Calendari
        </label>
        <Tooltip text="Sufix que s'afegirà al nom del calendari. Ha de ser únic.">
          <input
            type="text"
            id="calendar-suffix"
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Ex: Teatre Principal"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreate();
              }
            }}
          />
        </Tooltip>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-700">
        <Tooltip text="Tancar sense crear un nou calendari">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel·lar
          </button>
        </Tooltip>
        <Tooltip text="Crear un nou calendari a Google Calendar amb el sufix especificat">
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
          >
            {isCreating ? 'Creant...' : 'Crear Calendari'}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default CreateCalendarModal;
