import React, { useState, useMemo } from 'react';
import { TechSheetRoleItem, Assignment, PersonGroup } from '../../types';
import Tooltip from '../ui/Tooltip';

interface ChangeItem {
  id: string;
  label: string;
  details: string;
  type: 'add' | 'remove' | 'update';
  data: any;
}

interface UpdateFromAssignmentsModalProps {
  onClose: () => void;
  onConfirm: (selectedChanges: ChangeItem[]) => void;
  toAdd: Assignment[];
  toRemove: TechSheetRoleItem[];
  toUpdate: { assignment: Assignment; currentRole: TechSheetRoleItem; newNotes: string }[];
  getPersonGroupById: (id: string) => PersonGroup | undefined;
}

export const UpdateFromAssignmentsModal: React.FC<UpdateFromAssignmentsModalProps> = ({
  onClose,
  onConfirm,
  toAdd,
  toRemove,
  toUpdate,
  getPersonGroupById,
}) => {
  const allChanges = useMemo(() => {
    const addItems: ChangeItem[] = toAdd.map(a => ({
      id: a.id,
      label: `Afegir: ${getPersonGroupById(a.personGroupId)?.name || 'Desconegut'}`,
      details: `(Nova assignació)`,
      type: 'add',
      data: a,
    }));
    const removeItems: ChangeItem[] = toRemove.map((r: any) => ({
      id: r.id,
      label: `Eliminar: Rol de ${getPersonGroupById(r.personGroupId)?.name || 'Desconegut'}`,
      details: `(Rol actual: ${r.role || 'Sense especificar'})`,
      type: 'remove',
      data: r,
    }));
    const updateItems: ChangeItem[] = toUpdate.map(u => ({
      id: u.assignment.id,
      label: `Actualitzar: ${getPersonGroupById(u.assignment.personGroupId)?.name || 'Desconegut'}`,
      details: `(Notes actualitzades)`,
      type: 'update',
      data: u,
    }));
    return [...addItems, ...updateItems, ...removeItems];
  }, [toAdd, toRemove, toUpdate, getPersonGroupById]);

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
      <p className="text-muted-foreground">
        S'han detectat canvis entre les assignacions confirmades i la llista de personal tècnic.
        Selecciona els canvis que vols aplicar.
      </p>

      {allChanges.length > 0 ? (
        <>
          <div className="flex justify-end space-x-2">
            <button onClick={handleSelectAll} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">Seleccionar Tot</button>
            <button onClick={handleDeselectAll} className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-accent">Deseleccionar Tot</button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 p-2 border rounded-md bg-muted/50">
            {allChanges.map(change => {
              const bgColor = change.type === 'add'
                ? 'bg-success/10'
                : change.type === 'remove'
                ? 'bg-destructive/10'
                : 'bg-warning/10';

              return (
              <div key={change.id} className={`p-2 rounded flex items-center ${bgColor}`}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(change.id)}
                  onChange={() => handleToggle(change.id)}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-ring mr-3"
                />
                <div>
                  <span className="font-semibold text-foreground">{change.label}</span>
                  <span className="text-sm text-muted-foreground ml-2">{change.details}</span>
                </div>
              </div>
              )
            })}
          </div>
        </>
      ) : (
        <p className="text-center text-muted-foreground py-4">No hi ha canvis per aplicar.</p>
      )}

      <div className="flex justify-end space-x-3 mt-6">
        <Tooltip text="Tancar sense aplicar cap canvi">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent rounded-md border border-border">
            Cancel·lar
          </button>
        </Tooltip>
        <Tooltip text="Aplicar els canvis seleccionats a la fitxa tècnica">
          <button onClick={handleConfirm} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md">
            Confirmar Canvis ({selectedIds.size})
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default UpdateFromAssignmentsModal;