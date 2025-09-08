import React from 'react';
import { TechSheetProvider, TechSheetRoleItem, PersonGroup, AssignmentStatus, Assignment } from '../../types';
import TechSheetSection from './TechSheetSection';
import TechSheetField from './TechSheetField';
import { TECH_SHEET_ROLE_SUGGESTIONS } from '../../constants';
import Tooltip from '../ui/Tooltip';
import { useModalStore } from '../../stores/modalStore';
import { formatDateDMY } from '../../utils/dateFormat';

interface TechnicalPersonnelSectionProps {
  technicalProviders: TechSheetProvider[];
  peopleGroups: PersonGroup[];
  eventFrame: any;
  onProviderChange: (providerIndex: number, personGroupId: string) => void;
  onRoleChange: (providerIndex: number, roleIndex: number, field: keyof TechSheetRoleItem, value: any) => void;
  onAddProvider: () => void;
  onRemoveProvider: (providerIndex: number) => void;
  onAddRole: (providerIndex: number) => void;
  onRemoveRole: (providerIndex: number, roleIndex: number) => void;
  getPersonGroupById: (id: string) => PersonGroup | undefined;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onConfirmUpdate: (selectedChanges?: any[]) => void;
}

const TechnicalPersonnelSection: React.FC<TechnicalPersonnelSectionProps> = ({
  technicalProviders,
  peopleGroups,
  eventFrame,
  onProviderChange,
  onRoleChange,
  onAddProvider,
  onRemoveProvider,
  onAddRole,
  onRemoveRole,
  getPersonGroupById,
  showToast,
  onConfirmUpdate,
}) => {
  const openModal = useModalStore(state => state.openModal);

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
                getPersonGroupById,
                onConfirm: onConfirmUpdate,
              });
            }}
            className="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs font-medium shadow no-print"
          >
            <span className="font-bold">⟳</span> <span className="hidden sm:inline">Actualitza des d'assignacions</span>
          </button>
        </Tooltip>
      }
    >
      <div className="col-span-full space-y-6">
        {technicalProviders.map((provider, providerIndex) => {
          const selectedPerson = getPersonGroupById(provider.personGroupId);
          return (
            <div key={provider.id} className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 flex items-start gap-4">
                  <div className="w-2/3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Proveïdor de Personal {providerIndex + 1}</label>
                    <select
                      value={provider.personGroupId}
                      onChange={(e) => onProviderChange(providerIndex, e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm"
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
                  <button type="button" onClick={() => onRemoveProvider(providerIndex)} className="ml-4 text-red-500 hover:text-red-700 font-bold">Eliminar Proveïdor</button>
                </Tooltip>
              </div>

              <div className="space-y-3 pl-4 border-l-2 border-indigo-200 dark:border-indigo-700">
                {provider.roles.length > 0 && (
                  <div className="flex items-center gap-4 w-full text-xs font-semibold text-gray-500 dark:text-gray-400 -mb-2">
                    <div className="w-1/12">Quant.</div>
                    <div className="w-4/12">Rol</div>
                    <div className="w-5/12">Notes assignació</div>
                    <div className="w-1/12 text-center">PDF</div>
                    <div className="w-1/12 flex-shrink-0"></div>
                  </div>
                )}

                {provider.roles.map((roleItem, roleIndex) => (
                  <div key={roleItem.id} className="flex items-start gap-4 w-full">
                    <div className="w-1/12">
                      <TechSheetField id={`quantity-${providerIndex}-${roleIndex}`} label="" type="number" value={roleItem.quantity} onChange={(e) => onRoleChange(providerIndex, roleIndex, 'quantity', e.target.value)} />
                    </div>
                    <div className="w-4/12">
                      <TechSheetField id={`role-${providerIndex}-${roleIndex}`} label="" value={roleItem.role} onChange={(e) => onRoleChange(providerIndex, roleIndex, 'role', e.target.value)} suggestions={TECH_SHEET_ROLE_SUGGESTIONS} />
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
                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                        </Tooltip>
                    </div>
                    <div className="w-1/12 flex-shrink-0 pt-2">
                      <Tooltip text="Eliminar aquest rol">
                        <button type="button" onClick={() => onRemoveRole(providerIndex, roleIndex)} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold no-print">×</button>
                      </Tooltip>
                    </div>
                  </div>
                ))}
                <Tooltip text="Afegir un nou rol per a aquest proveïdor">
                  <button type="button" onClick={() => onAddRole(providerIndex)} className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">+ Afegir Rol</button>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
      <div className="col-span-full mt-4 no-print">
        <Tooltip text="Afegir un nou proveïdor de personal manualment">
          <button type="button" onClick={onAddProvider} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-semibold">+ Afegir Proveïdor de Personal</button>
        </Tooltip>
      </div>
    </TechSheetSection>
  );
};

export default TechnicalPersonnelSection;
