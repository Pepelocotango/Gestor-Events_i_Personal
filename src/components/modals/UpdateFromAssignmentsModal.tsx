import React, { useState, useMemo } from 'react';
import { TechSheetRoleItem, Assignment, PersonGroup } from '../../types';
import Tooltip from '../ui/Tooltip';

interface ChangeItem {
  id: string;
  label: string;
  details: string;
  type: 'add' | 'remove';
  data: any;
}

interface UpdateFromAssignmentsModalProps {
  onClose: () => void;
  onConfirm: (selectedChanges: ChangeItem[]) => void;
  toAdd: Assignment[];
  toRemove: (TechSheetRoleItem & { personGroupId: string })[];
  toKeep: (TechSheetRoleItem & { personGroupId: string })[];
  getPersonGroupById: (id: string) => PersonGroup | undefined;
}

export const UpdateFromAssignmentsModal: React.FC<UpdateFromAssignmentsModalProps> = ({
  onClose,
  onConfirm,
  toAdd,
  toRemove,
  getPersonGroupById,
}) => {
  const allChanges = useMemo(() => {
    const addItems: ChangeItem[] = toAdd.map(a => ({
      id: a.id,
      label: `Afegir: ${getPersonGroupById(a.personGroupId)?.name || 'Desconegut'}`,
      details: `(Assignació del ${a.startDate} al ${a.endDate})`,
      type: 'add',
      data: a,
    }));
    const removeItems: ChangeItem[] = toRemove.map(r => ({
      id: r.id,
      label: `Eliminar: ${getPersonGroupById(r.personGroupId)?.name || 'Desconegut'}`,
      details: `(Rol: ${r.role || 'Sense especificar'})`,
      type: 'remove',
      data: r,
    }));
    return [...addItems, ...removeItems];
  }, [toAdd, toRemove, getPersonGroupById]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(allChanges.map(c => c.id)));

  const handleToggle = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(allChanges.map(c => c.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleConfirm = () => {
    const selectedChanges = allChanges.filter(c => selectedIds.has(c.id));
    onConfirm(selectedChanges);
    onClose();
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-700 dark:text-gray-300">
        S'han detectat canvis entre les assignacions confirmades i la llista de personal tècnic.
        Selecciona els canvis que vols aplicar.
      </p>

      {allChanges.length > 0 ? (
        <>
          <div className="flex justify-end space-x-2">
            <button onClick={handleSelectAll} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Seleccionar Tot</button>
            <button onClick={handleDeselectAll} className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600">Deseleccionar Tot</button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
            {allChanges.map(change => (
              <div key={change.id} className={`p-2 rounded flex items-center ${change.type === 'add' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(change.id)}
                  onChange={() => handleToggle(change.id)}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-3"
                />
                <div>
                  <span className="font-semibold">{change.label}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{change.details}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">No hi ha canvis per aplicar.</p>
      )}

      <div className="flex justify-end space-x-3 mt-6">
        <Tooltip text="Tancar sense aplicar cap canvi">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md border border-gray-300">
            Cancel·lar
          </button>
        </Tooltip>
        <Tooltip text="Aplicar els canvis seleccionats a la fitxa tècnica">
          <button onClick={handleConfirm} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Confirmar Canvis ({selectedIds.size})
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default UpdateFromAssignmentsModal;
