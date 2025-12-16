import React, { useMemo } from 'react';
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
import { TECH_SHEET_ROLE_SUGGESTIONS } from '../../constants';
import Tooltip from '../ui/Tooltip';
import { useModalStore } from '../../stores/modalStore';
import { useEventDataStore } from '../../stores/eventDataStore';
import { formatDateDMY } from '../../utils/dateFormat';
import SortableProvider from './SortableProvider';

interface TechnicalPersonnelSectionProps {
  formData: TechSheetData;
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
  formData,
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
    <TechSheetSection title="Personal Tècnic"
      layout="single-column"
      headerActions={
        <Tooltip text="Afegeix personal confirmat de les assignacions a aquesta llista">
          <button
            type="button"
            onClick={() => {
              const getAssignmentNotes = (assignment: Assignment) => {
                let notes = assignment.notes || '';
                if (assignment.status === AssignmentStatus.Mixed && assignment.dailyStatuses) {
                  const confirmedDays = Object.entries(assignment.dailyStatuses)
                    .filter(([, status]) => status === AssignmentStatus.Yes)
                    .map(([date]) => formatDateDMY(date));
                  if (confirmedDays.length > 0) {
                    const daysString = `Dies: ${confirmedDays.join(', ')}`;
                    notes = notes ? `${notes}\n${daysString}` : daysString;
                  }
                }
                return notes;
              };

              const confirmedAssignments = eventFrame.assignments.filter((a: Assignment) =>
                a.status === AssignmentStatus.Yes || (a.status === AssignmentStatus.Mixed && Object.values(a.dailyStatuses || {}).includes(AssignmentStatus.Yes))
              );

              const confirmedAssignmentsMap = new Map(confirmedAssignments.map((a: Assignment) => [a.id, a]));
              const currentRolesMap = new Map(technicalProviders.flatMap(p => p.roles).filter(r => r.assignmentId).map(r => [r.assignmentId!, r]));

              const toAdd = confirmedAssignments.filter((a: Assignment) => !currentRolesMap.has(a.id));

              const toRemove = technicalProviders.flatMap(p =>
                p.roles
                  .filter(r => !r.assignmentId || !confirmedAssignmentsMap.has(r.assignmentId!))
                  .map(r => ({ ...r, personGroupId: p.personGroupId }))
              );

              const toUpdate = confirmedAssignments
                .filter((a: Assignment) => currentRolesMap.has(a.id))
                .map((a: Assignment) => ({
                  assignment: a,
                  currentRole: currentRolesMap.get(a.id)!,
                  newNotes: getAssignmentNotes(a),
                }))
                .filter((item: { newNotes: string; currentRole: { notes?: string } }) => item.newNotes !== item.currentRole.notes);

              if (toAdd.length === 0 && toRemove.length === 0 && toUpdate.length === 0) {
                showToast('No hi ha canvis per aplicar des de les assignacions.', 'info');
                return;
              }

              openModal('updateFromAssignments', {
                toAdd,
                toRemove,
                toUpdate,
                getPersonGroupById: (id: string) => ({ id, name: peopleMap.get(id) || 'Desconegut' }),
                onConfirm: onConfirmUpdate,
              });
            }}
            className="ml-2 px-2 py-1 rounded text-xs font-medium shadow no-print bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <span className="font-bold">⟳</span> <span className="hidden sm:inline">Actualitza des d'assignacions</span>
          </button>
        </Tooltip>
      }
    >
        <div className="col-span-full">
            <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-muted-foreground">Notes Generals del Personal Tècnic</label>
                <Tooltip text="Marca aquesta casella per incloure aquestes notes en exportar la fitxa a PDF.">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="showTechnicalPersonnelNotesInPdf"
                            name="showTechnicalPersonnelNotesInPdf"
                            checked={formData.showTechnicalPersonnelNotesInPdf ?? true}
                            onChange={(e) => onFieldChange('showTechnicalPersonnelNotesInPdf', e.target.checked)}
                            className="h-4 w-4 rounded border-border accent-primary focus:ring-ring"
                        />
                        <label htmlFor="showTechnicalPersonnelNotesInPdf" className="text-sm font-medium text-muted-foreground">Imprimir al PDF</label>
                    </div>
                </Tooltip>
            </div>
            <TechSheetField
                id="technicalPersonnelNotes"
                label=""
                value={formData.technicalPersonnelNotes || ''}
                onChange={(e) => onFieldChange('technicalPersonnelNotes', e.target.value)}
                as="textarea"
                rows={3}
                placeholder="Afegeix notes addicionals sobre el personal tècnic..."
                tooltipText="Afegeix aquí qualsevol nota general o comentari rellevant per a tot el personal tècnic."
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
                  />
                </SortableProvider>
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
      <div className="col-span-full mt-4 no-print">
        <Tooltip text="Afegir un nou proveïdor de personal manualment">
          <button type="button" onClick={onAddProvider} className="px-4 py-2 rounded-md text-sm font-semibold bg-success text-success-foreground hover:bg-success/90">+ Afegir Proveïdor de Personal</button>
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
}) => {
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
                        <label className="block text-sm font-medium text-muted-foreground">Proveïdor de Personal {providerIndex + 1}</label>
                        <select
                            value={provider.personGroupId}
                            onChange={(e) => onProviderChange(providerIndex, e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            <option value="" disabled>-- Selecciona un proveïdor --</option>
                            {peopleGroups.map(pg => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
                        </select>
                    </div>
                    <div className="w-1/3">
                        <TechSheetField
                            id={`provider-role-${providerIndex}`}
                            label="Rol Base (Agenda)"
                            value={selectedPerson?.role || '--'}
                            onChange={() => {}}
                            disabled
                        />
                    </div>
                </div>
                <Tooltip text="Eliminar aquest proveïdor i tots els seus rols associats">
                    <button type="button" onClick={() => onRemoveProvider(providerIndex)} className="ml-4 text-destructive hover:text-destructive/80 font-bold">Eliminar Proveïdor</button>
                </Tooltip>
            </div>

            <div className="space-y-3 pl-4 border-l-2 border-primary">
                {provider.roles.length > 0 && (
                    <div className="flex items-center gap-4 w-full text-xs font-semibold text-muted-foreground -mb-2">
                        <div className="w-1/12">Quant.</div>
                        <div className="w-4/12">Rol</div>
                        <div className="w-5/12">Notes assignació</div>
                        <div className="w-1/12 text-center">PDF</div>
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
                                    suggestions={TECH_SHEET_ROLE_SUGGESTIONS}
                                />
                            </div>
                            <div className="w-5/12">
                                <TechSheetField id={`notes-${providerIndex}-${roleIndex}`} label="" value={roleItem.notes || ''} onChange={(e) => onRoleChange(providerIndex, roleIndex, 'notes', e.target.value)} as="textarea" rows={1} />
                            </div>
                            <div className="w-1/12 flex flex-col items-center pt-2">
                                <Tooltip text="Incloure aquestes notes al PDF">
                                    <input
                                        type="checkbox"
                                        checked={roleItem.printNotes ?? true}
                                        onChange={(e) => onRoleChange(providerIndex, roleIndex, 'printNotes', e.target.checked)}
                                        className="h-5 w-5 rounded border-border accent-primary focus:ring-ring"
                                    />
                                </Tooltip>
                            </div>
                            <div className="w-1/12 flex-shrink-0 pt-2">
                                <Tooltip text="Eliminar aquest rol">
                                    <button type="button" onClick={() => onRemoveRole(providerIndex, roleIndex)} className="text-destructive hover:bg-destructive/10 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold no-print">×</button>
                                </Tooltip>
                            </div>
                        </div>
                    );
                })}
                <Tooltip text="Afegir un nou rol per a aquest proveïdor">
                    <button type="button" onClick={() => onAddRole(providerIndex)} className="px-3 py-1 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90">+ Afegir Rol</button>
                </Tooltip>
            </div>
        </div>
    );
};

export default TechnicalPersonnelSection;
