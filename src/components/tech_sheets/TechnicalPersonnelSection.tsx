import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TechSheetProvider, TechSheetRoleItem, PersonGroup, AssignmentStatus, Assignment, TechSheetData } from '../../types';
import TechSheetSection from './TechSheetSection';
import TechSheetField from './TechSheetField';
import { useRoleSuggestions } from '../../constants';
import Tooltip from '../ui/Tooltip';
import { useModalStore } from '../../stores/modalStore';
import { useEventDataStore } from '../../stores/eventDataStore';
import { formatDateDMY } from '../../utils/dateFormat';
import SortableProvider from './SortableProvider';

interface TechnicalPersonnelSectionProps {
  showTechnicalPersonnelNotesInPdf?: boolean;
  technicalPersonnelNotes?: string;
  technicalProviders: TechSheetProvider[];
  peopleGroups: PersonGroup[];
  eventFrame: any;
  onProviderChange: (providerIndex: number, personGroupId: string) => void;
  onRoleChange: (providerIndex: number, roleIndex: number, field: keyof TechSheetRoleItem, value: any) => void;
  onFieldChange: (field: keyof TechSheetData, value: any) => void;
  onAddProvider: () => void;
  onRemoveProvider: (providerIndex: number) => void;
  onAddRole: (providerIndex: number) => void;
  onRemoveRole: (providerIndex: number, roleIndex: number) => void;
  getPersonGroupById: (id: string) => PersonGroup | undefined;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onConfirmUpdate: (selectedChanges?: any[]) => void;
  onDragEnd: (event: DragEndEvent) => void;
  dragHandle?: React.ReactNode;
}

const TechnicalPersonnelSection: React.FC<TechnicalPersonnelSectionProps> = ({
  showTechnicalPersonnelNotesInPdf,
  technicalPersonnelNotes,
  technicalProviders,
  peopleGroups,
  eventFrame,
  onProviderChange,
  onRoleChange,
  onFieldChange,
  onAddProvider,
  onRemoveProvider,
  onAddRole,
  onRemoveRole,
  showToast,
  onConfirmUpdate,
  onDragEnd,
}) => {
  const { t } = useTranslation();
  const roleSuggestions = useRoleSuggestions();
  const openModal = useModalStore(state => state.openModal);
  const peopleMap = useMemo(() => {
    const m = new Map<string, string>();
    peopleGroups.forEach(p => m.set(p.id, p.name));
    return m;
  }, [peopleGroups]);

  const assignmentsMap = useMemo(() => {
    const map = new Map<string, Assignment>();
    if (eventFrame?.assignments) {
      for (const assignment of eventFrame.assignments) {
        map.set(assignment.id, assignment);
      }
    }
    return map;
  }, [eventFrame?.assignments]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <TechSheetSection title={t('tech_sheets.personnel.title')}
      layout="single-column"
      headerActions={
        <Tooltip text={t('tech_sheets.personnel.update_tooltip')}>
          <button
            type="button"
            onClick={() => {
              // Eliminem l'alerta per veure els logs a la consola correcta
              console.log('🔥🔥🔥 BOTÓ ACTUALITZA CLICAT!!! 🔥🔥🔥');
              console.log('[DEBUG_UPDATE] Botó "Actualitza des d\'assignacions" clicat');
              console.log('[DEBUG_UPDATE] Dades d\'entrada - eventFrame.assignments:', eventFrame.assignments);
              console.log('[DEBUG_UPDATE] Total assignacions:', eventFrame.assignments?.length || 0);
              
              const getAssignmentNotes = (assignment: Assignment) => {
                let notes = assignment.notes || '';
                if (assignment.status === AssignmentStatus.Mixed && assignment.dailyStatuses) {
                  const confirmedDays = Object.entries(assignment.dailyStatuses)
                    .filter(([, status]) => status === AssignmentStatus.Yes)
                    .map(([date]) => formatDateDMY(date));
                  if (confirmedDays.length > 0) {
                    const daysString = `${t('common.days')}: ${confirmedDays.join(', ')}`;
                    notes = notes ? `${notes}\n${daysString}` : daysString;
                  }
                }
                return notes;
              };

              console.log('[DEBUG_UPDATE] Inici filtratge - Estat de les assignacions:');
              eventFrame.assignments.forEach((a: Assignment, index: number) => {
                console.log(`  [${index}] ID: ${a.id}, Status: ${a.status}, PersonGroupId: ${a.personGroupId}`);
              });

              const confirmedAssignments = eventFrame.assignments.filter((a: Assignment) =>
                a.status === AssignmentStatus.Yes || (a.status === AssignmentStatus.Mixed && Object.values(a.dailyStatuses || {}).includes(AssignmentStatus.Yes))
              );
              
              console.log('[DEBUG_UPDATE] Resultat filtratge - confirmedAssignments:', confirmedAssignments);
              console.log('[DEBUG_UPDATE] Total assignacions confirmades:', confirmedAssignments.length);

              const confirmedAssignmentsMap = new Map(confirmedAssignments.map((a: Assignment) => [a.id, a]));
              const currentRolesMap = new Map(technicalProviders.flatMap(p => p.roles).filter(r => r.assignmentId).map(r => [r.assignmentId!, r]));
              
              console.log('[DEBUG_UPDATE] Estat actual - currentRolesMap:');
              currentRolesMap.forEach((role, assignmentId) => {
                console.log(`  AssignmentID: ${assignmentId}, Role: ${role.role}, Notes: "${role.notes}"`);
              });
              console.log('[DEBUG_UPDATE] Total rols actuals amb assignmentId:', currentRolesMap.size);

              const toAdd = confirmedAssignments.filter((a: Assignment) => {
                const exists = currentRolesMap.has(a.id);
                console.log(`[DEBUG_UPDATE] Comparant assignació ${a.id} (${a.personGroupId}) amb mapa actual... existeix? ${exists}`);
                return !exists;
              });
              
              console.log('[DEBUG_UPDATE] Resultat toAdd:', toAdd);
              console.log('[DEBUG_UPDATE] Total elements a afegir:', toAdd.length);

              const toRemove = technicalProviders.flatMap(p =>
                p.roles
                  .filter(r => {
                    const shouldRemove = !r.assignmentId || !confirmedAssignmentsMap.has(r.assignmentId!);
                    console.log(`[DEBUG_UPDATE] Comprovant rol ${r.id} (assignmentId: ${r.assignmentId})... s\'ha d\'esborrar? ${shouldRemove}`);
                    return shouldRemove;
                  })
                  .map(r => ({ ...r, personGroupId: p.personGroupId }))
              );
              
              console.log('[DEBUG_UPDATE] Resultat toRemove:', toRemove);
              console.log('[DEBUG_UPDATE] Total elements a esborrar:', toRemove.length);

              const toUpdate = confirmedAssignments
                .filter((a: Assignment) => currentRolesMap.has(a.id))
                .map((a: Assignment) => {
                  const currentRole = currentRolesMap.get(a.id)!;
                  const newNotes = getAssignmentNotes(a);
                  console.log(`[DEBUG_UPDATE] Comprovant actualització per assignació ${a.id}:`);
                  console.log(`  Notes originals: "${a.notes || ''}"`);
                  console.log(`  Notes actuals a la fitxa: "${currentRole.notes || ''}"`);
                  console.log(`  Noves notes calculades: "${newNotes}"`);
                  console.log(`  Comparació (newNotes !== currentRole.notes): ${newNotes !== currentRole.notes}`);
                  return {
                    assignment: a,
                    currentRole,
                    newNotes,
                  };
                })
                .filter((item: { newNotes: string; currentRole: { notes?: string } }) => {
                  const shouldUpdate = item.newNotes !== item.currentRole.notes;
                  console.log(`[DEBUG_UPDATE] Filtrant actualització - s\'ha d\'actualitzar? ${shouldUpdate}`);
                  return shouldUpdate;
                });
              
              console.log('[DEBUG_UPDATE] Resultat toUpdate:', toUpdate);
              console.log('[DEBUG_UPDATE] Total elements a actualitzar:', toUpdate.length);

              console.log('[DEBUG_UPDATE] Arrays finals resultants:');
              console.log('  toAdd:', toAdd);
              console.log('  toRemove:', toRemove);
              console.log('  toUpdate:', toUpdate);
              console.log(`[DEBUG_UPDATE] Resums: toAdd=${toAdd.length}, toRemove=${toRemove.length}, toUpdate=${toUpdate.length}`);
              
              if (toAdd.length === 0 && toRemove.length === 0 && toUpdate.length === 0) {
                console.log('[DEBUG_UPDATE] BLOQUEIG: No s\'han detectat canvis - el modal NO s\'obrirà');
                showToast(t('tech_sheets.personnel.no_changes_toast'), 'info');
                return;
              }
              
              console.log('[DEBUG_UPDATE] Obrint modal amb les dades de canvis...');
              openModal('updateFromAssignments', {
                toAdd,
                toRemove,
                toUpdate,
                getPersonGroupById: (id: string) => ({ id, name: peopleMap.get(id) || t('tech_sheets.personnel.unknown') }),
                onConfirm: onConfirmUpdate,
              });
            }}
            className="ml-2 px-2 py-1 rounded text-xs font-medium shadow no-print bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <span className="font-bold">⟳</span> <span className="hidden sm:inline">{t('tech_sheets.personnel.update_from_assignments')}</span>
          </button>
        </Tooltip>
      }
    >
      <div className="col-span-full">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-muted-foreground">{t('tech_sheets.personnel.notes_label')}</label>
          <Tooltip text={t('tech_sheets.personnel.print_tooltip')}>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showTechnicalPersonnelNotesInPdf"
                name="showTechnicalPersonnelNotesInPdf"
                checked={showTechnicalPersonnelNotesInPdf ?? true}
                onChange={(e) => onFieldChange('showTechnicalPersonnelNotesInPdf', e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary focus:ring-ring"
              />
              <label htmlFor="showTechnicalPersonnelNotesInPdf" className="text-sm font-medium text-muted-foreground">{t('tech_sheets.form.general.print_in_pdf')}</label>
            </div>
          </Tooltip>
        </div>
        <TechSheetField
          id="technicalPersonnelNotes"
          label=""
          value={technicalPersonnelNotes || ''}
          onChange={(e) => onFieldChange('technicalPersonnelNotes', e.target.value)}
          as="textarea"
          rows={3}
          placeholder={t('tech_sheets.personnel.notes_placeholder')}
          tooltipText={t('tech_sheets.personnel.notes_tooltip')}
        />
      </div>

      <div className="col-span-full space-y-6 mt-6">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={technicalProviders.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {technicalProviders.map((provider, providerIndex) => {
              return (
                <SortableProvider key={provider.id} id={provider.id}>
                  <ProviderCard
                    provider={provider}
                    providerIndex={providerIndex}
                    peopleGroups={peopleGroups}
                    assignmentsMap={assignmentsMap}
                    onProviderChange={onProviderChange}
                    onRoleChange={onRoleChange}
                    onAddRole={onAddRole}
                    onRemoveRole={onRemoveRole}
                    onRemoveProvider={onRemoveProvider}
                    roleSuggestions={roleSuggestions}
                  />
                </SortableProvider>
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
      <div className="col-span-full mt-4 no-print">
        <Tooltip text={t('tech_sheets.personnel.add_provider_tooltip')}>
          <button type="button" onClick={onAddProvider} className="px-4 py-2 rounded-md text-sm font-semibold bg-success text-success-foreground hover:bg-success/90">{t('tech_sheets.personnel.add_provider')}</button>
        </Tooltip>
      </div>
    </TechSheetSection>
  );
};

interface ProviderCardProps {
  provider: TechSheetProvider;
  providerIndex: number;
  peopleGroups: PersonGroup[];
  assignmentsMap: Map<string, Assignment>;
  onProviderChange: (providerIndex: number, personGroupId: string) => void;
  onRoleChange: (providerIndex: number, roleIndex: number, field: keyof TechSheetRoleItem, value: any) => void;
  onAddRole: (providerIndex: number) => void;
  onRemoveRole: (providerIndex: number, roleIndex: number) => void;
  onRemoveProvider: (providerIndex: number) => void;
  dragHandle?: React.ReactNode;
  roleSuggestions: string[];
}

const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  providerIndex,
  peopleGroups,
  assignmentsMap,
  onProviderChange,
  onRoleChange,
  onAddRole,
  onRemoveRole,
  onRemoveProvider,
  dragHandle,
  roleSuggestions,
}) => {
  const { t } = useTranslation();
  const selectedPerson = peopleGroups.find(pg => pg.id === provider.personGroupId);
  const { updateAssignment } = useEventDataStore.getState();

  const handleRoleChange = (roleIndex: number, newRole: string) => {
    const roleItem = provider.roles[roleIndex];
    // 1. Update local form state for immediate UI feedback
    onRoleChange(providerIndex, roleIndex, 'role', newRole);

    // 2. If linked to an assignment, update the central store
    if (roleItem.assignmentId) {
      const assignment = assignmentsMap.get(roleItem.assignmentId);
      if (assignment && assignment.role !== newRole) {
        updateAssignment({ ...assignment, role: newRole });
      }
    }
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-muted/50 relative pl-8">
      {dragHandle}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 flex items-start gap-4">
          <div className="w-2/3">
            <label className="block text-sm font-medium text-muted-foreground">{t('tech_sheets.personnel.provider_label', { index: providerIndex + 1 })}</label>
            <select
              value={provider.personGroupId}
              onChange={(e) => onProviderChange(providerIndex, e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="" disabled>{t('tech_sheets.personnel.select_placeholder')}</option>
              {peopleGroups.map(pg => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
            </select>
          </div>
          <div className="w-1/3">
            <TechSheetField
              id={`provider-role-${providerIndex}`}
              label={t('tech_sheets.personnel.base_role_label')}
              value={selectedPerson?.role || '--'}
              onChange={() => { }}
              disabled
            />
          </div>
        </div>
        <Tooltip text={t('tech_sheets.personnel.delete_provider_tooltip')}>
          <button type="button" onClick={() => onRemoveProvider(providerIndex)} className="ml-4 text-destructive hover:text-destructive/80 font-bold">{t('tech_sheets.personnel.delete_provider')}</button>
        </Tooltip>
      </div>

      <div className="space-y-3 pl-4 border-l-2 border-primary">
        {provider.roles.length > 0 && (
          <div className="flex items-center gap-4 w-full text-xs font-semibold text-muted-foreground -mb-2">
            <div className="w-1/12">{t('tech_sheets.personnel.header_qty')}</div>
            <div className="w-4/12">{t('tech_sheets.personnel.header_role')}</div>
            <div className="w-5/12">{t('tech_sheets.personnel.header_notes')}</div>
            <div className="w-1/12 text-center">{t('tech_sheets.personnel.header_pdf')}</div>
            <div className="w-1/12 flex-shrink-0"></div>
          </div>
        )}

        {provider.roles.map((roleItem, roleIndex) => {
          const assignment = roleItem.assignmentId ? assignmentsMap.get(roleItem.assignmentId) : undefined;
          const displayRole = assignment?.role ?? roleItem.role;

          return (
            <div key={roleItem.id} className="flex items-start gap-4 w-full">
              <div className="w-1/12">
                <TechSheetField id={`quantity-${providerIndex}-${roleIndex}`} label="" type="number" value={roleItem.quantity} onChange={(e) => onRoleChange(providerIndex, roleIndex, 'quantity', e.target.value)} />
              </div>
              <div className="w-4/12">
                <TechSheetField
                  id={`role-${providerIndex}-${roleIndex}`}
                  label=""
                  value={displayRole}
                  onChange={(e) => handleRoleChange(roleIndex, e.target.value)}
                  suggestions={roleSuggestions}
                  tooltipText={t('tech_sheets.personnel.role_tooltip')}
                />
              </div>
              <div className="w-5/12">
                <TechSheetField id={`notes-${providerIndex}-${roleIndex}`} label="" value={roleItem.notes || ''} onChange={(e) => onRoleChange(providerIndex, roleIndex, 'notes', e.target.value)} as="textarea" rows={1} />
              </div>
              <div className="w-1/12 flex flex-col items-center pt-2">
                <Tooltip text={t('tech_sheets.personnel.print_role_tooltip')}>
                  <input
                    type="checkbox"
                    checked={roleItem.printNotes ?? true}
                    onChange={(e) => onRoleChange(providerIndex, roleIndex, 'printNotes', e.target.checked)}
                    className="h-5 w-5 rounded border-border accent-primary focus:ring-ring"
                  />
                </Tooltip>
              </div>
              <div className="w-1/12 flex-shrink-0 pt-2">
                <Tooltip text={t('tech_sheets.personnel.remove_role_tooltip')}>
                  <button type="button" onClick={() => onRemoveRole(providerIndex, roleIndex)} className="text-destructive hover:bg-destructive/10 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold no-print">×</button>
                </Tooltip>
              </div>
            </div>
          );
        })}
        <Tooltip text={t('tech_sheets.personnel.add_role_tooltip')}>
          <button type="button" onClick={() => onAddRole(providerIndex)} className="px-3 py-1 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90">{t('tech_sheets.personnel.add_role')}</button>
        </Tooltip>
      </div>
    </div>
  );
};

export default React.memo(TechnicalPersonnelSection);

