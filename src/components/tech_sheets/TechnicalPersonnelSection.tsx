import React, { memo } from 'react';
import { TechSheetProvider, TechSheetRoleItem, PersonGroup, AssignmentStatus } from '../../types';
import TechSheetSection from './TechSheetSection';
import TechSheetField from './TechSheetField';
import { TECH_SHEET_ROLE_SUGGESTIONS } from '../../constants';

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
  addOrUpdateTechSheet: (eventId: string, data: any) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  formData: any;
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
  addOrUpdateTechSheet,
  setFormData,
  formData,
}) => {
  const generateLocalId = () => `local_${Date.now().toString(36) + Math.random().toString(36).substring(2)}`;

  return (
    <TechSheetSection title="Personal Tècnic"
      layout="single-column"
      headerActions={
        <button
          type="button"
          onClick={() => {
            const confirmedAssignments = eventFrame.assignments.filter((a: any) =>
              a.status === AssignmentStatus.Yes || (a.status === AssignmentStatus.Mixed && Object.values(a.dailyStatuses || {}).includes(AssignmentStatus.Yes))
            );

            if (confirmedAssignments.length === 0) {
              showToast('No hi ha personal confirmat a les assignacions per afegir.', 'info');
              return;
            }

            // Preserva proveïdors manuals i elimina els provinents d'assignacions
            const manualProviders = technicalProviders.filter(p => p.isManual);

            let newRolesCount = 0;
            const providersFromAssignments: TechSheetProvider[] = [];

            confirmedAssignments.forEach((assignment: any) => {
              const personGroupId = assignment.personGroupId;
              let provider = providersFromAssignments.find(p => p.personGroupId === personGroupId);

              if (!provider) {
                provider = {
                  id: generateLocalId(),
                  personGroupId,
                  roles: [],
                  isManual: false,
                };
                providersFromAssignments.push(provider);
              }

              provider.roles.push({
                id: generateLocalId(),
                assignmentId: assignment.id,
                role: '',
                quantity: 1,
                notes: assignment.notes || '',
              });
              newRolesCount++;
            });

            const finalProviders = [...manualProviders, ...providersFromAssignments];

            if (newRolesCount > 0) {
              const updatedFormData = { ...formData, technicalProviders: finalProviders };
              setFormData(updatedFormData);
              addOrUpdateTechSheet(eventFrame.id, updatedFormData);
              showToast(`S'ha actualitzat la llista amb ${newRolesCount} rol(s) des de les assignacions.`, 'success');
            } else {
              // Si no hi ha rols nous, potser només cal netejar els antics
              const updatedFormData = { ...formData, technicalProviders: manualProviders };
              setFormData(updatedFormData);
              addOrUpdateTechSheet(eventFrame.id, updatedFormData);
              showToast('No hi ha personal confirmat a les assignacions. S\'han eliminat les entrades anteriors.', 'info');
            }
          }}
          className="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs font-medium shadow no-print"
          title="Afegeix personal confirmat de les assignacions a aquesta llista"
        >
          <span className="font-bold">⟳</span> <span className="hidden sm:inline">Actualitza des d'assignacions</span>
        </button>
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
                <button type="button" onClick={() => onRemoveProvider(providerIndex)} className="ml-4 text-red-500 hover:text-red-700 font-bold" title="Eliminar aquest proveïdor i tots els seus rols">Eliminar Proveïdor</button>
              </div>

              <div className="space-y-3 pl-4 border-l-2 border-indigo-200 dark:border-indigo-700">
                {provider.roles.length > 0 && (
                  <div className="flex items-center gap-4 w-full text-xs font-semibold text-gray-500 dark:text-gray-400 -mb-2">
                    <div className="w-1/6">Quant.</div>
                    <div className="w-2/5">Rol</div>
                    <div className="w-2/5">Notes assignació</div>
                    <div className="w-auto flex-shrink-0"></div>
                  </div>
                )}

                {provider.roles.map((roleItem, roleIndex) => (
                  <div key={roleItem.id} className="flex items-start gap-4 w-full">
                    <div className="w-1/6">
                      <TechSheetField id={`quantity-${providerIndex}-${roleIndex}`} label="" type="number" value={roleItem.quantity} onChange={(e) => onRoleChange(providerIndex, roleIndex, 'quantity', e.target.value)} />
                    </div>
                    <div className="w-2/5">
                      <TechSheetField id={`role-${providerIndex}-${roleIndex}`} label="" value={roleItem.role} onChange={(e) => onRoleChange(providerIndex, roleIndex, 'role', e.target.value)} suggestions={TECH_SHEET_ROLE_SUGGESTIONS} />
                    </div>
                    <div className="w-2/5">
                      <TechSheetField id={`notes-${providerIndex}-${roleIndex}`} label="" value={roleItem.notes || ''} onChange={(e) => onRoleChange(providerIndex, roleIndex, 'notes', e.target.value)} as="textarea" rows={1} />
                    </div>
                    <div className="w-auto flex-shrink-0 pt-2">
                      <button type="button" onClick={() => onRemoveRole(providerIndex, roleIndex)} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold no-print" title="Eliminar aquest rol">×</button>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={() => onAddRole(providerIndex)} className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">+ Afegir Rol</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="col-span-full mt-4 no-print">
        <button type="button" onClick={onAddProvider} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-semibold">+ Afegir Proveïdor de Personal</button>
      </div>
    </TechSheetSection>
  );
};

export default memo(TechnicalPersonnelSection);
