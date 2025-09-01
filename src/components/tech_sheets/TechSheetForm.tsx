import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEventData } from '../../contexts/EventDataContext';
import { EventFrame, TechSheetData, TechSheetProvider, TechSheetRoleItem, ContactPerson, ConditionalSection, AssemblyScheduleItem, NeedItem, ConditionalStatus, AssignmentStatus } from '../../types';
import TechSheetSection from './TechSheetSection';
import TechSheetField from './TechSheetField';
import { formatDateDMY } from '../../utils/dateFormat';
import { exportTechSheetToPdf } from '../../utils/pdfGenerator';
import TechnicalPersonnelSection from './TechnicalPersonnelSection';
import NeedsList from './NeedsList';
import Tooltip from '../ui/Tooltip';
import ConditionalFormControl from './ConditionalFormControl';

interface TechSheetFormProps {
  eventFrame: EventFrame;
}

const TechSheetForm: React.FC<TechSheetFormProps> = ({ eventFrame }) => {
  const { peopleGroups, materialItems, addOrUpdateTechSheet, showToast, getPersonGroupById, getMaterialAvailability, openModal } = useEventData();

  const getInitialFormData = (): TechSheetData => {
    return eventFrame.techSheet!;
  };

  const [formData, setFormData] = useState<TechSheetData>(getInitialFormData());
  const formDataRef = useRef(formData);
  const isDirtyRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    const newEventName = eventFrame.name;
    const newLocation = eventFrame.place || '';
    const newDate = eventFrame.startDate === eventFrame.endDate ? formatDateDMY(eventFrame.startDate) : `${formatDateDMY(eventFrame.startDate)} - ${formatDateDMY(eventFrame.endDate)}`;

    setFormData(currentData => {
      if (
        currentData.eventName !== newEventName ||
        currentData.location !== newLocation ||
        currentData.date !== newDate
      ) {
        isDirtyRef.current = true;
        return { ...currentData, eventName: newEventName, location: newLocation, date: newDate };
      }
      return currentData;
    });
  }, [eventFrame.name, eventFrame.place, eventFrame.startDate, eventFrame.endDate]);

  const saveData = useCallback((isManualSave = false) => {
    if (isDirtyRef.current) {
      addOrUpdateTechSheet(eventFrame.id, formDataRef.current);
      if (isManualSave) {
        showToast('Canvis desats manualment.', 'success');
      } else {
        showToast('Canvis desats automàticament.', 'success');
      }
      isDirtyRef.current = false;
    }
  }, [addOrUpdateTechSheet, eventFrame.id, showToast]);

  useEffect(() => {
    if (isDirtyRef.current) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveData(), 2000);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [formData, saveData]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (isDirtyRef.current) saveData();
    };
  }, [saveData]);

  if (!formData) {
    return <div>Carregant dades de la fitxa tècnica...</div>;
  }

  const markAsDirty = () => {
    isDirtyRef.current = true;
  };

  const generateLocalId = () => `local_${Date.now().toString(36) + Math.random().toString(36).substring(2)}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
    markAsDirty();
  };

  const handleConditionalChange = (
    fieldName: keyof TechSheetData,
    fieldValue: Partial<ConditionalSection<any> | { status: ConditionalStatus }>
  ) => {
    setFormData(prev => {
      const currentField = prev[fieldName] as ConditionalSection<any> || { status: 'unset', details: ''};
      const updatedField = { ...currentField, ...fieldValue };

      if ('status' in fieldValue && (fieldValue.status === 'no' || fieldValue.status === 'unset')) {
        if (updatedField.data && Array.isArray(updatedField.data.needs)) {
            updatedField.data.needs = [];
        }
        if (fieldName === 'schedule' && updatedField.data) {
          updatedField.data = [];
        }
      }

      return { ...prev, [fieldName]: updatedField };
    });
    markAsDirty();
  };

  type TechSheetNeedsKey = 'lighting' | 'sound' | 'video' | 'machinery' | 'rentals' | 'otherEquipment' | 'electrical' | 'structures' | 'platforms' | 'consumables' | 'curtains' | 'transport';

  const handleNeedsListChange = useCallback((sectionName: TechSheetNeedsKey, index: number, field: string, value: any) => {
    setFormData(prev => {
        const section = prev[sectionName] as ConditionalSection<{ needs: NeedItem[] }>;
        const newNeeds = [...(section?.data?.needs || [])];
        const currentItem = { ...newNeeds[index] };
        (currentItem as any)[field] = value;

        if (field === 'description') {
            const matchedItem = materialItems.find(item => item.name === value);
            currentItem.materialItemId = matchedItem ? matchedItem.id : null;
        }

        newNeeds[index] = currentItem;
        const updatedSection = { ...section, data: { ...section.data, needs: newNeeds } };

        return { ...prev, [sectionName]: updatedSection };
    });
    markAsDirty();
  }, [materialItems]);

  const handleRemoveNeedsListItem = useCallback((sectionName: TechSheetNeedsKey, index: number) => {
    setFormData(prev => {
        const section = prev[sectionName] as ConditionalSection<{ needs: NeedItem[] }>;
        const newNeeds = (section?.data?.needs || []).filter((_, i) => i !== index);
        const updatedSection = { ...section, data: { ...section.data, needs: newNeeds } };
        return { ...prev, [sectionName]: updatedSection };
    });
    markAsDirty();
  }, []);

  const handleAddNeedsListItem = useCallback((sectionName: TechSheetNeedsKey) => {
    const newItem: NeedItem = { id: generateLocalId(), quantity: 1, description: '', origin: '' };
    setFormData(prev => {
        const section = prev[sectionName] as ConditionalSection<{ needs: NeedItem[] }>;
        const newNeeds = [...(section?.data?.needs || []), newItem];
        const updatedSection = { ...section, data: { ...section.data, needs: newNeeds } };
        return { ...prev, [sectionName]: updatedSection };
    });
    markAsDirty();
  }, []);

  const handleAssemblyScheduleChange = (index: number, field: keyof AssemblyScheduleItem, value: string) => {
    setFormData(prev => {
        const newSchedule = [...(prev.schedule?.data || [])];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        return { ...prev, schedule: { ...(prev.schedule || { status: 'unset', details: '' }), data: newSchedule }};
    });
    markAsDirty();
  };

  const handleAddAssemblyScheduleItem = () => {
    const newItem: AssemblyScheduleItem = { id: generateLocalId(), date: '', time: '', description: '' };
    setFormData(prev => {
        const newSchedule = [...(prev.schedule?.data || []), newItem];
        return { ...prev, schedule: { ...(prev.schedule || { status: 'unset', details: '' }), data: newSchedule }};
    });
    markAsDirty();
  };

  const handleRemoveAssemblyScheduleItem = (index: number) => {
    setFormData(prev => {
        const newSchedule = (prev.schedule?.data || []).filter((_, i) => i !== index);
        return { ...prev, schedule: { ...(prev.schedule || { status: 'unset', details: '' }), data: newSchedule }};
    });
    markAsDirty();
  };

  const handleContactChange = (index: number, field: keyof ContactPerson, value: string) => {
    setFormData(prev => {
        const newContacts = [...(prev.contacts || [])];
        newContacts[index] = { ...newContacts[index], [field]: value };
        return { ...prev, contacts: newContacts };
    });
    markAsDirty();
  };

  const handleAddContact = () => {
    const newContact: ContactPerson = { id: generateLocalId(), name: '', role: '', email: '', phone: '' };
    setFormData(prev => ({ ...prev, contacts: [...(prev.contacts || []), newContact] }));
    markAsDirty();
  };

  const handleRemoveContact = (index: number) => {
    setFormData(prev => ({ ...prev, contacts: (prev.contacts || []).filter((_, i) => i !== index) }));
    markAsDirty();
  };

  const handleProviderChange = useCallback((providerIndex: number, personGroupId: string) => {
    setFormData(prev => {
      const newProviders = [...(prev.technicalProviders || [])];
      newProviders[providerIndex].personGroupId = personGroupId;
      return { ...prev, technicalProviders: newProviders };
    });
    markAsDirty();
  }, []);

  const handleRoleChange = useCallback((providerIndex: number, roleIndex: number, field: keyof TechSheetRoleItem, value: any) => {
    const finalValue = (field === 'role' && typeof value === 'string' && value.includes(': '))
      ? value.split(': ')[1]
      : value;
    setFormData(prev => {
      const newProviders = [...(prev.technicalProviders || [])];
      const newRoles = [...newProviders[providerIndex].roles];
      newRoles[roleIndex] = { ...newRoles[roleIndex], [field]: finalValue };
      newProviders[providerIndex].roles = newRoles;
      return { ...prev, technicalProviders: newProviders };
    });
    markAsDirty();
  }, []);

  const handleAddProvider = useCallback(() => {
    const newProvider: TechSheetProvider = { id: generateLocalId(), personGroupId: '', roles: [], isManual: true };
    setFormData(prev => ({ ...prev, technicalProviders: [...(prev.technicalProviders || []), newProvider] }));
    markAsDirty();
  }, []);

  const handleRemoveProvider = useCallback((providerIndex: number) => {
    setFormData(prev => ({ ...prev, technicalProviders: (prev.technicalProviders || []).filter((_, i) => i !== providerIndex) }));
    markAsDirty();
  }, []);

  const handleAddRole = useCallback((providerIndex: number) => {
    const newRole: TechSheetRoleItem = { id: generateLocalId(), role: '', quantity: 1, notes: '', printNotes: true };
    setFormData(prev => {
      const newProviders = [...(prev.technicalProviders || [])];
      newProviders[providerIndex].roles.push(newRole);
      return { ...prev, technicalProviders: newProviders };
    });
    markAsDirty();
  }, []);

  const handleRemoveRole = useCallback((providerIndex: number, roleIndex: number) => {
    setFormData(prev => {
      const newProviders = [...(prev.technicalProviders || [])];
      newProviders[providerIndex].roles = newProviders[providerIndex].roles.filter((_, i) => i !== roleIndex);
      return { ...prev, technicalProviders: newProviders };
    });
    markAsDirty();
  }, []);

  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (isDirtyRef.current) {
      saveData(true);
    } else {
      showToast('No hi ha canvis per desar.', 'info');
    }
  };

  const handleExportToPdf = () => {
    if (isDirtyRef.current) {
        showToast('Desant canvis pendents abans d\'exportar...', 'info');
        saveData(true);
    }
    exportTechSheetToPdf(formData, eventFrame.name, getPersonGroupById, showToast);
  };

  const handleConfirmUpdateFromAssignments = (selectedChanges?: any[]) => {
    if (!selectedChanges || selectedChanges.length === 0) {
      showToast('No s\'ha seleccionat cap canvi per aplicar.', 'info');
      return;
    }

    const toAdd = selectedChanges.filter(c => c.type === 'add').map(c => c.data);
    const toUpdate = selectedChanges.filter(c => c.type === 'update').map(c => c.data);
    const toRemoveIds = new Set(selectedChanges.filter(c => c.type === 'remove').map(c => c.data.id));

    setFormData(prev => {
      let newProviders = [...(prev.technicalProviders || [])];

      // 1. Process removals
      newProviders = newProviders.map(p => ({
        ...p,
        roles: p.roles.filter(r => !toRemoveIds.has(r.id)),
      })).filter(p => p.roles.length > 0 || p.isManual);

      // 2. Process updates
      toUpdate.forEach(update => {
        const provider = newProviders.find(p => p.roles.some(r => r.id === update.currentRole.id));
        if (provider) {
          provider.roles = provider.roles.map(r =>
            r.id === update.currentRole.id ? { ...r, notes: update.newNotes } : r
          );
        }
      });

      // 3. Process additions
      toAdd.forEach(assignment => {
        const personGroupId = assignment.personGroupId;
        let provider = newProviders.find(p => p.personGroupId === personGroupId);

        if (!provider) {
          provider = {
            id: generateLocalId(),
            personGroupId,
            roles: [],
            isManual: false,
          };
          newProviders.push(provider);
        }

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

        provider.roles.push({
          id: generateLocalId(),
          assignmentId: assignment.id,
          role: '',
          quantity: 1,
          notes: notes,
        });
      });

      return { ...prev, technicalProviders: newProviders };
    });

    markAsDirty();
    showToast(`${selectedChanges.length} canvi(s) aplicat(s) des de les assignacions.`, 'success');
  };

  const renderNeedsSection = (title: string, fieldName: TechSheetNeedsKey) => (
    <ConditionalFormControl
      label={`${title}:`}
      status={formData[fieldName]?.status || 'unset'}
      onStatusChange={(status) => handleConditionalChange(fieldName, { status })}
    >
      <TechSheetField
        id={`${fieldName}Details`}
        label={`Detalls generals de ${title.toLowerCase()}:`}
        value={formData[fieldName]?.details || ''}
        onChange={(e) => handleConditionalChange(fieldName, { details: e.target.value })}
        as="textarea"
        rows={2}
      />
      <NeedsList
        needs={formData[fieldName]?.data?.needs || []}
        title={`Material de ${title.toLowerCase()}`}
        listName={fieldName}
        onListChange={handleNeedsListChange as any}
        onRemoveListItem={handleRemoveNeedsListItem as any}
        onAddListItem={handleAddNeedsListItem as any}
        materialItems={materialItems}
        eventFrame={eventFrame}
        getMaterialAvailability={getMaterialAvailability}
      />
    </ConditionalFormControl>
  );

  return (
    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4 tech-sheet-form-container">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Fitxa de Bolo: <span className="text-blue-600 dark:text-blue-400">{eventFrame.name}</span>
        </h2>
        <div className="flex items-center gap-2">
            <Tooltip text="Forçar el desat immediat de tots els canvis pendents">
              <button onClick={handleManualSave} className="save-changes-button px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold no-print">Desar Canvis</button>
            </Tooltip>
            <Tooltip text="Generar i descarregar un PDF amb la fitxa tècnica actual">
              <button onClick={handleExportToPdf} className="export-pdf-button px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-semibold no-print">Exportar a PDF</button>
            </Tooltip>
        </div>
      </div>
      <div className="mt-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">Edita els detalls tècnics de l'esdeveniment. Els canvis es desen automàticament.</p>
      </div>

      {/* General Info */}
      <TechSheetSection title="Informació General" layout="grid-2">
        <TechSheetField id="eventName" label="NOM DEL ESDEVENIMENT:" value={formData.eventName} onChange={handleChange} required tooltipText="El nom de l'esdeveniment es sincronitza automàticament amb el nom del 'Event Frame'."/>
        <TechSheetField id="location" label="LLOC:" value={formData.location} onChange={handleChange} tooltipText="El lloc de l'esdeveniment. També es sincronitza des del 'Event Frame'."/>
        <TechSheetField id="date" label="DATA:" value={formData.date} onChange={handleChange} tooltipText="La data o rang de dates de l'esdeveniment. Sincronitzat des del 'Event Frame'."/>
        <TechSheetField id="showTime" label="HORA:" value={formData.showTime} onChange={handleChange} type="time" tooltipText="Hora d'inici de la funció o acte principal."/>
        <TechSheetField id="showDuration" label="DURADA ESPECTACLE:" value={formData.showDuration} onChange={handleChange} placeholder="XX min" tooltipText="Durada aproximada de l'espectacle en minuts."/>
        <div className="col-span-full">
            <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes Generals</label>
                <Tooltip text="Marca aquesta casella per incloure les notes generals en exportar la fitxa a PDF.">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="showGeneralNotesInPdf" name="showGeneralNotesInPdf" checked={formData.showGeneralNotesInPdf || false} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                        <label htmlFor="showGeneralNotesInPdf" className="text-sm font-medium text-gray-700 dark:text-gray-300">Imprimir al PDF</label>
                    </div>
                </Tooltip>
            </div>
            <Tooltip text="Afegeix aquí qualsevol nota general o comentari rellevant per a tota la fitxa.">
                <textarea id="generalNotes" name="generalNotes" value={formData.generalNotes || ''} onChange={handleChange} rows={3} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </Tooltip>
        </div>
        <div className="col-span-full -mb-3">
            <ConditionalFormControl
                label="ZONA RESERVADA PARKING:"
                status={formData.parking?.status || 'unset'}
                onStatusChange={(status) => handleConditionalChange('parking', { status })}
                tooltipText="Indica si es necessita o no una zona de pàrquing reservada."
            >
                <TechSheetField
                    id="parkingDetails"
                    label="Detalls de la zona de parking:"
                    value={formData.parking?.details || ''}
                    onChange={(e) => handleConditionalChange('parking', { details: e.target.value })}
                    as="textarea"
                    rows={2}
                    placeholder="On, quantes places, metres lineals , contacte..."
                    tooltipText="Especifica la ubicació, el nombre de places necessàries, i a qui contactar per a la gestió del pàrquing."
                />
            </ConditionalFormControl>
        </div>
      </TechSheetSection>

      {/* Personnel */}
      <TechnicalPersonnelSection
        technicalProviders={formData.technicalProviders || []}
        peopleGroups={peopleGroups}
        eventFrame={eventFrame}
        onProviderChange={handleProviderChange}
        onRoleChange={handleRoleChange}
        onAddProvider={handleAddProvider}
        onRemoveProvider={handleRemoveProvider}
        onAddRole={handleAddRole}
        onRemoveRole={handleRemoveRole}
        getPersonGroupById={getPersonGroupById}
        showToast={showToast}
        openModal={openModal}
        onConfirmUpdate={handleConfirmUpdateFromAssignments}
      />

      {/* Pre-assembly */}
      <TechSheetSection title="Premuntatge">
        <ConditionalFormControl
          label="PREMUNTATGE:"
          status={formData.preAssembly?.status || 'unset'}
          onStatusChange={(status) => handleConditionalChange('preAssembly', { status })}
          tooltipText="Indica si es realitzarà un premuntatge previ a l'esdeveniment."
        >
          <TechSheetField
            id="preAssemblyDetails"
            label="Detalls premuntatge, personal, etc:"
            value={formData.preAssembly?.details || ''}
            onChange={(e) => handleConditionalChange('preAssembly', { details: e.target.value })}
            as="textarea"
            rows={2}
            placeholder="Descripció general del premuntatge..."
            tooltipText="Descriu les tasques de premuntatge, el personal necessari, i qualsevol altre detall logístic rellevant."
          />
        </ConditionalFormControl>
      </TechSheetSection>

      {/* Schedule */}
      <TechSheetSection title="Horaris">
        <ConditionalFormControl
          label="HORARIS:"
          status={formData.schedule?.status || 'unset'}
          onStatusChange={(status) => handleConditionalChange('schedule', { status })}
          tooltipText="Activa aquesta secció per detallar la planificació horària de l'esdeveniment."
        >
          <div className="col-span-full space-y-2 mt-4">
            {(formData.schedule?.data || []).map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-3">
                  <TechSheetField id={`schedule-date-${index}`} label={`Data ${index + 1}`} value={item.date} onChange={(e) => handleAssemblyScheduleChange(index, 'date', e.target.value)} type="date" tooltipText="Data de l'activitat programada."/>
                </div>
                <div className="col-span-2">
                  <TechSheetField id={`schedule-time-${index}`} label={`Hora ${index + 1}`} value={item.time} onChange={(e) => handleAssemblyScheduleChange(index, 'time', e.target.value)} type="time" tooltipText="Hora d'inici de l'activitat."/>
                </div>
                <div className="col-span-6">
                  <TechSheetField id={`schedule-desc-${index}`} label={`Descripció ${index + 1}`} value={item.description} onChange={(e) => handleAssemblyScheduleChange(index, 'description', e.target.value)} tooltipText="Descripció de l'activitat (p. ex., 'Muntatge llums', 'Prova de so')."/>
                </div>
                <div className="col-span-1 flex-shrink-0 pt-7">
                  <Tooltip text="Eliminar aquesta línia d'horari">
                    <button type="button" onClick={() => handleRemoveAssemblyScheduleItem(index)} className="remove-item-button text-red-500 hover:bg-red-100 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold no-print">×</button>
                  </Tooltip>
                </div>
              </div>
            ))}
            <div className="mt-2 no-print">
              <Tooltip text="Afegir una nova línia a la planificació d'horaris">
                <button type="button" onClick={handleAddAssemblyScheduleItem} className="add-item-button px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">+ Afegir Ítem Horari</button>
              </Tooltip>
            </div>
          </div>
        </ConditionalFormControl>
      </TechSheetSection>

      {/* Logistics */}
      <TechSheetSection title="Logística" layout="grid-3">
        <TechSheetField id="dressingRooms" label="CAMERINOS:" value={formData.dressingRooms || ''} onChange={handleChange} placeholder="2 camerinos individuals, camerino ràpid....." tooltipText="Especifica les necessitats de camerinos: quantitat, tipus (individuals, col·lectius), i qualsevol requeriment especial."/>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ACTORS:</label>
          <Tooltip text="Nombre total d'actors o artistes que participen.">
            <input type="number" name="actorsNumber" value={formData.actorsNumber || ''} onChange={handleChange} className="mt-1 block w-24 pl-3 pr-1 py-0.5 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" min="0" />
          </Tooltip>
          {Number(formData.actorsNumber) > 0 && (
            <Tooltip text="Llista els noms dels actors o artistes.">
              <textarea className="mt-2 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" rows={2} placeholder="Detalls notes Artistes, noms..." name="actors" value={formData.actors || ''} onChange={handleChange} />
            </Tooltip>
          )}
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">TÈCNICS/PRODUCCIÓ CIA:</label>
          <Tooltip text="Nombre total de personal tècnic o de producció de la companyia.">
            <input type="number" name="companyTechniciansNumber" value={formData.companyTechniciansNumber || ''} onChange={handleChange} className="mt-1 block w-24 pl-3 pr-1 py-0.5 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" min="0" />
          </Tooltip>
          {Number(formData.companyTechniciansNumber) > 0 && (
            <Tooltip text="Llista els noms del personal tècnic o de producció de la companyia.">
              <textarea className="mt-2 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" rows={2} placeholder="Detalls notes dels tècnics/producció, noms..." name="companyTechnicians" value={formData.companyTechnicians || ''} onChange={handleChange} />
            </Tooltip>
          )}
        </div>
      </TechSheetSection>

      {/* Technical Needs */}
      <TechSheetSection title="Necessitats Tècniques">
        {renderNeedsSection('Il·luminació', 'lighting')}
        {renderNeedsSection('So', 'sound')}
        {renderNeedsSection('Vídeo', 'video')}
        {renderNeedsSection('Maquinària', 'machinery')}
        {renderNeedsSection('Lloguers', 'rentals')}
        {renderNeedsSection('Material d\'Altres Equipaments', 'otherEquipment')}
        {renderNeedsSection('Infraestructures Elèctriques', 'electrical')}
        {renderNeedsSection('Estructures', 'structures')}
        {renderNeedsSection('Tarimes', 'platforms')}
        {renderNeedsSection('Consumibles', 'consumables')}
        {renderNeedsSection('Cortinatges', 'curtains')}
        {renderNeedsSection('Transport', 'transport')}
      </TechSheetSection>

      {/* Other Details */}
      <TechSheetSection title="Altres Detalls">
        <TechSheetField id="controlLocation" label="CONTROL A:" value={formData.controlLocation || ''} onChange={handleChange} placeholder="Cabina, Platea, a 20 metres del escenari, sota el garrofer..." tooltipText="Ubicació del control tècnic (so, llums, etc.). Per exemple: 'Cabina fons platea'."/>
        <TechSheetField id="blueprints" label="PLÀNOLS:" value={formData.blueprints || ''} onChange={handleChange} as="textarea" rows={3} placeholder="Adjunts, link dels plànols, in situ...." tooltipText="Enllaços o referències als plànols tècnics de l'esdeveniment (escenari, llums, etc.)."/>
      </TechSheetSection>

      {/* Contacts & Observations */}
      <TechSheetSection title="Contacte i Observacions">
        <div className="col-span-full space-y-3">
          <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">CONTACTES DE LA COMPANYIA:</h4>
          {(formData.contacts || []).map((contact, index) => (
            <div key={contact.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-center p-2 border rounded-md dark:border-gray-600">
              <div className="col-span-3"><TechSheetField id={`contact-name-${index}`} label="Nom" value={contact.name} onChange={(e) => handleContactChange(index, 'name', e.target.value)} placeholder="Nom del contacte" tooltipText="Nom i cognoms del contacte."/></div>
              <div className="col-span-3"><TechSheetField id={`contact-role-${index}`} label="Càrrec" value={contact.role} onChange={(e) => handleContactChange(index, 'role', e.target.value)} placeholder="Regidor, tècnic@ de llums/so, Producció, conserge del poble...." tooltipText="Càrrec o rol del contacte dins la companyia (p. ex., 'Director Tècnic', 'Producció')."/></div>
              <div className="col-span-3"><TechSheetField id={`contact-email-${index}`} label="Email" type="email" value={contact.email} onChange={(e) => handleContactChange(index, 'email', e.target.value)} placeholder="email@exemple.com" tooltipText="Correu electrònic del contacte."/></div>
              <div className="col-span-2"><TechSheetField id={`contact-phone-${index}`} label="Telèfon" type="tel" value={contact.phone} onChange={(e) => handleContactChange(index, 'phone', e.target.value)} placeholder="600123456" tooltipText="Número de telèfon del contacte."/></div>
              <div className="col-span-1 flex items-end justify-center pb-1">
                <Tooltip text="Eliminar contacte">
                  <button type="button" onClick={() => handleRemoveContact(index)} className="remove-item-button text-red-500 hover:bg-red-100 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold no-print">×</button>
                </Tooltip>
              </div>
            </div>
          ))}
          <div className="mt-2 no-print">
            <Tooltip text="Afegir un nou contacte">
              <button type="button" onClick={handleAddContact} className="add-item-button px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">+ Afegir Contacte</button>
            </Tooltip>
          </div>
        </div>
        <div className="col-span-full pt-4">
          <TechSheetField id="observations" label="ALTRES / OBSERVACIONS:" value={formData.observations || ''} onChange={handleChange} as="textarea" rows={4} tooltipText="Espai per a qualsevol altra informació, observació o requeriment no cobert en les altres seccions."/>
        </div>
      </TechSheetSection>

    </div>
  );
};

export default TechSheetForm;
