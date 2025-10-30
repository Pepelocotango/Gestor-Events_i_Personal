import React, { useState } from 'react';
import { ShowToastFunction } from '@/types';
import { createNewCalendar } from '@/stores/googleConfigStore';
import Tooltip from '../ui/Tooltip';

interface CreateCalendarModalProps {
  onClose: () => void;
  showToast: ShowToastFunction;
}

const CreateCalendarModal: React.FC<CreateCalendarModalProps> = ({ onClose, showToast }) => {
  const [suffix, setSuffix] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!suffix.trim()) {
      showToast('El sufix no pot estar buit.', 'warning');
      return;
    }
    setIsCreating(true);
    try {
      const result = await createNewCalendar(suffix.trim());
      if (result) {
        showToast(result.message, result.type);
        if (result.success) {
          onClose();
        }
      }
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-foreground">Crear Nou Calendari de l'App</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Introdueix un sufix únic per al nou calendari (ex: Teatre Principal). Aquest sufix s'afegirà al nom base "Gestor d'Esdeveniments (App)".
        </p>
      </div>

      <div>
        <label htmlFor="calendar-suffix" className="block text-sm font-medium text-muted-foreground">
          Sufix del Calendari
        </label>
        <Tooltip text="Sufix que s'afegirà al nom del calendari. Ha de ser únic.">
          <input
            type="text"
            id="calendar-suffix"
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary sm:text-sm"
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

      <div className="flex justify-end space-x-2 pt-4 border-t border-border">
        <Tooltip text="Tancar sense crear un nou calendari">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium rounded-md border bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
          >
            Cancel·lar
          </button>
        </Tooltip>
        <Tooltip text="Crear un nou calendari a Google Calendar amb el sufix especificat">
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isCreating ? 'Creant...' : 'Crear Calendari'}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default CreateCalendarModal;
