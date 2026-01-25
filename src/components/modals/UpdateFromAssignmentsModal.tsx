import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const allChanges = useMemo(() => {
    const addItems: ChangeItem[] = toAdd.map(a => ({
      id: a.id,
      label: t('modals.update_assignments.type_add', { name: getPersonGroupById(a.personGroupId)?.name || t('modals.update_assignments.unknown_person') }),
      details: t('modals.update_assignments.details_new'),
      type: 'add',
      data: a,
    }));
    const removeItems: ChangeItem[] = toRemove.map((r: any) => ({
      id: r.id,
      label: t('modals.update_assignments.type_remove', { name: getPersonGroupById(r.personGroupId)?.name || t('modals.update_assignments.unknown_person') }),
      details: t('modals.update_assignments.details_current_role', { role: r.role || t('tech_sheets.personnel.unknown') }),
      type: 'remove',
      data: r,
    }));
    const updateItems: ChangeItem[] = toUpdate.map(u => ({
      id: u.assignment.id,
      label: t('modals.update_assignments.type_update', { name: getPersonGroupById(u.assignment.personGroupId)?.name || t('modals.update_assignments.unknown_person') }),
      details: t('modals.update_assignments.details_notes'),
      type: 'update',
      data: u,
    }));
    return [...addItems, ...updateItems, ...removeItems];
  }, [toAdd, toRemove, toUpdate, getPersonGroupById, t]);

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
        {t('modals.update_assignments.description')}
      </p>

      {allChanges.length > 0 ? (
        <>
          <div className="flex justify-end space-x-2">
            <button onClick={handleSelectAll} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">{t('modals.update_assignments.select_all')}</button>
            <button onClick={handleDeselectAll} className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-accent">{t('modals.update_assignments.deselect_all')}</button>
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
        <p className="text-center text-muted-foreground py-4">{t('modals.update_assignments.no_changes')}</p>
      )}

      <div className="flex justify-end space-x-3 mt-6">
        <Tooltip text={t('modals.update_assignments.cancel_tooltip')}>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent rounded-md border border-border">
            {t('common.cancel')}
          </button>
        </Tooltip>
        <Tooltip text={t('modals.update_assignments.confirm_tooltip')}>
          <button onClick={handleConfirm} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md">
            {t('modals.update_assignments.confirm_button', { count: selectedIds.size })}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default UpdateFromAssignmentsModal;