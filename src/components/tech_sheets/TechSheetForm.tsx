import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useEventData } from '../../contexts/EventDataContext';
import { EventFrame, TechSheetData, TechSheetProvider, TechSheetRoleItem, ConditionalStatus } from '../../types';
import { migrateTechSheetData } from '../../utils/techSheetMigration';
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
  const { peopleGroups, materialItems, addOrUpdateTechSheet, showToast, getPersonGroupById, getMaterialAvailability } = useEventData();

  const [formData, setFormData] = useState<TechSheetData>(() => migrateTechSheetData(eventFrame.techSheet, eventFrame));
  const formDataRef = useRef(formData);

  const isDirtyRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const eventDates = useMemo(() => {
    const dates: string[] = [];
    const start = new Date(eventFrame.startDate);
    const end = new Date(eventFrame.endDate);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    let current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]); // YYYY-MM-DD
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [eventFrame.startDate, eventFrame.endDate]);

  // Mantenir la referència sempre actualitzada
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Efecte per actualitzar dades del formulari si l'esdeveniment canvia
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

  // Funció de desat centralitzada
  const saveData = useCallback((isManualSave = false) => {
    if (isDirtyRef.current) {
      addOrUpdateTechSheet(eventFrame.id, formDataRef.current); // Llegeix de la ref
      if (isManualSave) {
        showToast('Canvis desats manualment.', 'success');
      } else {
        showToast('Canvis desats automàticament.', 'success');
      }
      isDirtyRef.current = false;
    }
  }, [addOrUpdateTechSheet, eventFrame.id, showToast]);


  // Efecte per al desat automàtic amb temporitzador (debounce)
  useEffect(() => {
    if (isDirtyRef.current) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveData();
      }, 2000); // Desat automàtic després de 2 segons d'inactivitat
    }

    // Funció de neteja per al temporitzador
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, saveData]);

  // Efecte per al desat de seguretat en desmuntar el component
  useEffect(() => {
    return () => {
      // Aquest efecte s'activa en canviar d'esdeveniment o desmuntar
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (isDirtyRef.current) {
        saveData();
      }
    };
  }, [saveData]); // Es manté saveData per coherència

  if (!formData) {
    return <div>Carregant dades de la fitxa tècnica...</div>;
  }

  const markAsDirty = () => {
    isDirtyRef.current = true;

  };

  const generateLocalId = () => `local_${Date.now().toString(36) + Math.random().toString(36).substring(2)}`;

  type NeedKey = 'lighting' | 'sound' | 'video' | 'machinery' | 'otherEquipment' | 'rentals';

  const handleNeedChange = (listName: NeedKey, index: number, field: string, value: any) => {
    setFormData(prev => {
      const needsSection = prev[listName];
      const newNeeds = [...needsSection.needs];
      const currentItem = { ...newNeeds[index] };
      (currentItem as any)[field] = value;

      if (field === 'description') {
        const matchedItem = materialItems.find(item => item.name === value);
        (currentItem as any).materialItemId = matchedItem ? matchedItem.id : null;
      }

      newNeeds[index] = currentItem;
      return { ...prev, [listName]: { ...needsSection, needs: newNeeds } };
    });
    markAsDirty();
  };

  const handleAddNeed = (listName: NeedKey) => {
    const newNeed = { id: generateLocalId(), quantity: 1, description: '', origin: 'Propi / CIA / lloguer' };
    setFormData(prev => {
      const needsSection = prev[listName];
      const newNeeds = [...needsSection.needs, newNeed];
      return { ...prev, [listName]: { ...needsSection, needs: newNeeds } };
    });
    markAsDirty();
  };

  const handleRemoveNeed = (listName: NeedKey, index: number) => {
    setFormData(prev => {
      const needsSection = prev[listName];
      const newNeeds = needsSection.needs.filter((_, i) => i !== index);
      return { ...prev, [listName]: { ...needsSection, needs: newNeeds } };
    });
    markAsDirty();
  };

  const handleScheduleChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.detailedSchedule.items];
      const currentItem = { ...newItems[index] };
      (currentItem as any)[field] = value;
      newItems[index] = currentItem;
      return { ...prev, detailedSchedule: { ...prev.detailedSchedule, items: newItems } };
    });
    markAsDirty();
  };

  const handleAddScheduleItem = () => {
    const newItem = { id: generateLocalId(), date: eventFrame.startDate, time: '', description: '' };
    setFormData(prev => {
      const newItems = [...prev.detailedSchedule.items, newItem];
      return { ...prev, detailedSchedule: { ...prev.detailedSchedule, items: newItems } };
    });
    markAsDirty();
  };

  const handleRemoveScheduleItem = (index: number) => {
    setFormData(prev => {
      const newItems = prev.detailedSchedule.items.filter((_, i) => i !== index);
      return { ...prev, detailedSchedule: { ...prev.detailedSchedule, items: newItems } };
    });
    markAsDirty();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    markAsDirty();
  };

  const handleConditionalChange = (
    fieldName: keyof TechSheetData,
    subFieldName: string,
    value: any
  ) => {
    setFormData(prev => {
      const newFormData = { ...prev };
      const field = newFormData[fieldName] as any;
      if (field) {
        field[subFieldName] = value;
      }
      return newFormData;
    });
    markAsDirty();
  };

  const handleStatusChange = (fieldName: keyof TechSheetData, newStatus: ConditionalStatus) => {
    handleConditionalChange(fieldName, 'status', newStatus);
  };

  const handleProviderChange = useCallback((providerIndex: number, personGroupId: string) => {
    setFormData(prev => {
      const newProviders = [...prev.technicalProviders];
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
      const newProviders = [...prev.technicalProviders];
      const newRoles = [...newProviders[providerIndex].roles];
      newRoles[roleIndex] = { ...newRoles[roleIndex], [field]: finalValue };
      newProviders[providerIndex].roles = newRoles;
      return { ...prev, technicalProviders: newProviders };
    });
    markAsDirty();
  }, []);

  const handleAddProvider = useCallback(() => {
    const newProvider: TechSheetProvider = {
      id: generateLocalId(),
      personGroupId: '',
      roles: [],
      isManual: true, // Marcar com a manual
    };
    setFormData(prev => ({ ...prev, technicalProviders: [...prev.technicalProviders, newProvider] }));
    markAsDirty();
  }, []);

  const handleRemoveProvider = useCallback((providerIndex: number) => {
    const updatedProviders = formData.technicalProviders.filter((_, i) => i !== providerIndex);
    setFormData(prev => ({ ...prev, technicalProviders: updatedProviders }));
    markAsDirty();
  }, [formData]);
  
  const handleAddRole = useCallback((providerIndex: number) => {
    const newRole: TechSheetRoleItem = {
      id: generateLocalId(),
      role: '',
      quantity: 1,
      notes: '',
    };
    setFormData(prev => {
      const newProviders = [...prev.technicalProviders];
      newProviders[providerIndex].roles.push(newRole);
      return { ...prev, technicalProviders: newProviders };
    });
    markAsDirty();
  }, []);

  const handleRemoveRole = useCallback((providerIndex: number, roleIndex: number) => {
    const updatedProviders = [...formData.technicalProviders];
    updatedProviders[providerIndex].roles = updatedProviders[providerIndex].roles.filter((_, i) => i !== roleIndex);
    setFormData({ ...formData, technicalProviders: updatedProviders });
    markAsDirty();
  }, [formData]);

  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null; // Important: netejar la referència
    }
    // Només desar si hi ha canvis pendents
    if (isDirtyRef.current) {
      saveData(true);
    } else {
      showToast('No hi ha canvis per desar.', 'info');
    }
  };

  const handleExportToPdf = () => {
    if (isDirtyRef.current) {
        showToast('Desant canvis pendents abans d\'exportar...', 'info');
        saveData(true); // Desa immediatament abans d'exportar
    }
    exportTechSheetToPdf(formData, eventFrame, getPersonGroupById, showToast);
  };

  return (
    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4 tech-sheet-form-container">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Fitxa de Bolo: <span className="text-blue-600 dark:text-blue-400">{eventFrame.name}</span>
        </h2>
        <div className="flex items-center gap-2">
            <Tooltip text="Forçar el desat immediat de tots els canvis pendents">
              <button
                  onClick={handleManualSave}
                  className="save-changes-button px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold no-print"
              >
                  Desar Canvis
              </button>
            </Tooltip>
            <Tooltip text="Generar i descarregar un PDF amb la fitxa tècnica actual">
              <button onClick={handleExportToPdf} className="export-pdf-button px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-semibold no-print">
                  Exportar a PDF
              </button>
            </Tooltip>
        </div>
      </div>
      <div className="mt-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">Edita els detalls tècnics de l'esdeveniment. Els canvis es desen automàticament.</p>
      </div>

      {eventFrame.generalNotes && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-900/20 dark:border-yellow-800/30">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Notes Generals de l'Esdeveniment:</h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 whitespace-pre-wrap">{eventFrame.generalNotes}</p>
        </div>
      )}

      <TechSheetSection title="Informació General" layout="single-column">
        <TechSheetField id="eventName" label="NOM DEL ESDEVENIMENT:" value={formData.eventName} onChange={handleChange} required />
        <TechSheetField id="location" label="LLOC:" value={formData.location} onChange={handleChange} />
        <TechSheetField id="date" label="DATA:" value={formData.date} onChange={handleChange} />
        <TechSheetField id="showTime" label="HORA:" value={formData.showTime} onChange={handleChange} type="time" />
        <TechSheetField id="showDuration" label="DURADA ESPECTACLE:" value={formData.showDuration} onChange={handleChange} placeholder="XX min" />

        <ConditionalFormControl
          label="ZONA RESERVADA PARKING:"
          status={formData.parkingInfo?.status || 'unset'}
          onStatusChange={(status) => handleStatusChange('parkingInfo', status)}
        >
          <textarea
            className="block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
            placeholder="Detalls de la zona de parking, vehicles, metres reservats ..."
            value={formData.parkingInfo?.details || ''}
            onChange={(e) => handleConditionalChange('parkingInfo', 'details', e.target.value)}
          />
        </ConditionalFormControl>
      </TechSheetSection>

      <TechnicalPersonnelSection
        technicalProviders={formData.technicalProviders}
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
        addOrUpdateTechSheet={addOrUpdateTechSheet}
        setFormData={setFormData}
        formData={formData}
      />

      <TechSheetSection title="Premuntatge i Horaris">
        <ConditionalFormControl
          label="PREMUNTATGE"
          status={formData.preAssembly?.status || 'unset'}
          onStatusChange={(status) => {
            handleStatusChange('preAssembly', status);
            if (status !== 'yes') {
              handleStatusChange('detailedSchedule', 'no');
            }
          }}
        >
          <textarea
            className="block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
            placeholder="Detalls premuntatge, personal, horaris..."
            value={formData.preAssembly?.details || ''}
            onChange={(e) => handleConditionalChange('preAssembly', 'details', e.target.value)}
          />
        </ConditionalFormControl>

        {formData.preAssembly?.status === 'yes' && (
          <ConditionalFormControl
            label="HORARIS DETALLATS"
            status={formData.detailedSchedule?.status || 'unset'}
            onStatusChange={(status) => handleStatusChange('detailedSchedule', status)}
          >
            {formData.detailedSchedule?.items?.map((item, index) => (
              <div key={item.id} className="flex items-start gap-2 w-full p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                <div className="w-1/4">
                  <label htmlFor={`schedule-date-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Dia</label>
                   <select
                      id={`schedule-date-${index}`}
                      value={item.date || ''}
                      onChange={(e) => handleScheduleChange(index, 'date', e.target.value)}
                      className="block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-1"
                   >
                     {eventDates.map(date => (
                       <option key={date} value={date}>{formatDateDMY(date)}</option>
                     ))}
                   </select>
                </div>
                <div className="w-1/4">
                   <label htmlFor={`schedule-time-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Hora</label>
                   <input
                    id={`schedule-time-${index}`}
                    type="time"
                    value={item.time}
                    onChange={(e) => handleScheduleChange(index, 'time', e.target.value)}
                    className="block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-1"
                  />
                </div>
                <div className="w-2/4">
                  <label htmlFor={`schedule-desc-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Descripció</label>
                  <input
                    id={`schedule-desc-${index}`}
                    type="text"
                    value={item.description}
                    onChange={(e) => handleScheduleChange(index, 'description', e.target.value)}
                    className="block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-1"
                  />
                </div>
                <div className="w-auto flex-shrink-0 pt-6">
                  <Tooltip text="Eliminar aquesta línia d'horari">
                    <button
                      type="button"
                      onClick={() => handleRemoveScheduleItem(index)}
                      className="remove-item-button text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold no-print"
                    >×</button>
                  </Tooltip>
                </div>
              </div>
            ))}
            <div className="mt-2 no-print">
              <Tooltip text="Afegir una nova línia a la planificació d'horaris">
                <button
                  type="button"
                  onClick={handleAddScheduleItem}
                  className="add-item-button px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-semibold"
                >+ Afegir Ítem Horari</button>
              </Tooltip>
            </div>
          </ConditionalFormControl>
        )}
      </TechSheetSection>

      <TechSheetSection title="Logística">
        <ConditionalFormControl
          label="CAMERINOS"
          status={formData.dressingRooms?.status || 'unset'}
          onStatusChange={(status) => handleStatusChange('dressingRooms', status)}
        >
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantitat</label>
              <select
                value={formData.dressingRooms?.quantity || 0}
                onChange={(e) => handleConditionalChange('dressingRooms', 'quantity', e.target.value)}
                className="block w-24 pl-3 pr-10 py-1 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {[...Array(21).keys()].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex-grow">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes addicionals</label>
              <input
                type="text"
                placeholder="Ex: Amb dutxa, accessibles..."
                value={formData.dressingRooms?.details || ''}
                onChange={(e) => handleConditionalChange('dressingRooms', 'details', e.target.value)}
                className="block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-1"
              />
            </div>
          </div>
        </ConditionalFormControl>

        <ConditionalFormControl
          label="ACTORS"
          status={formData.actors?.status || 'unset'}
          onStatusChange={(status) => handleStatusChange('actors', status)}
        >
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantitat</label>
              <select
                value={formData.actors?.quantity || 0}
                onChange={(e) => handleConditionalChange('actors', 'quantity', e.target.value)}
                className="block w-24 pl-3 pr-10 py-1 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {[...Array(21).keys()].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Noms</label>
            <textarea
              rows={2}
              placeholder="Noms dels actors..."
              value={formData.actors?.names || ''}
              onChange={(e) => handleConditionalChange('actors', 'names', e.target.value)}
              className="block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </ConditionalFormControl>

        <ConditionalFormControl
          label="TÈCNICS/PRODUCCIÓ CIA"
          status={formData.companyTechnicians?.status || 'unset'}
          onStatusChange={(status) => handleStatusChange('companyTechnicians', status)}
        >
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantitat</label>
              <select
                value={formData.companyTechnicians?.quantity || 0}
                onChange={(e) => handleConditionalChange('companyTechnicians', 'quantity', e.target.value)}
                className="block w-24 pl-3 pr-10 py-1 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {[...Array(21).keys()].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Noms</label>
            <textarea
              rows={2}
              placeholder="Noms dels tècnics/producció..."
              value={formData.companyTechnicians?.names || ''}
              onChange={(e) => handleConditionalChange('companyTechnicians', 'names', e.target.value)}
              className="block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </ConditionalFormControl>
      </TechSheetSection>

      <TechSheetSection title="Necessitats Tècniques">
        {(['lighting', 'sound', 'video', 'machinery', 'otherEquipment', 'rentals'] as const).map(needKey => {
          const titleMap = {
            lighting: 'Il·luminació',
            sound: 'So',
            video: 'Vídeo',
            machinery: 'Maquinària',
            otherEquipment: "Material d'altres equipaments",
            rentals: 'Lloguers',
          };
          const sectionData = formData[needKey];

          return (
            <ConditionalFormControl
              key={needKey}
              label={titleMap[needKey].toUpperCase()}
              status={sectionData?.status || 'unset'}
              onStatusChange={(status) => handleStatusChange(needKey, status)}
            >
              <textarea
                className="block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={2}
                placeholder={`Detalls generals de ${titleMap[needKey].toLowerCase()}...`}
                value={sectionData?.details || ''}
                onChange={(e) => handleConditionalChange(needKey, 'details', e.target.value)}
              />
              <div className="mt-4">
                <NeedsList
                  needs={sectionData?.needs || []}
                  title={titleMap[needKey]}
                  listName={needKey}
                  materialItems={materialItems}
                  eventFrame={eventFrame}
                  onListChange={handleNeedChange}
                  onRemoveListItem={handleRemoveNeed}
                  onAddListItem={handleAddNeed}
                  getMaterialAvailability={getMaterialAvailability}
                />
              </div>
            </ConditionalFormControl>
          );
        })}
      </TechSheetSection>

      <TechSheetSection title="Altres Detalls">
        <ConditionalFormControl
          label="CONTROL A"
          status={formData.controlLocation?.status || 'unset'}
          onStatusChange={(status) => handleStatusChange('controlLocation', status)}
        >
          <input
            type="text"
            placeholder="Cabina/Platea"
            value={formData.controlLocation?.details || ''}
            onChange={(e) => handleConditionalChange('controlLocation', 'details', e.target.value)}
            className="block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-1"
          />
        </ConditionalFormControl>

        <ConditionalFormControl
          label="PLÀNOLS"
          status={formData.blueprints?.status || 'unset'}
          onStatusChange={(status) => handleStatusChange('blueprints', status)}
        >
          <textarea
            rows={3}
            placeholder="Enllaç a plànols, o descripció..."
            value={formData.blueprints?.details || ''}
            onChange={(e) => handleConditionalChange('blueprints', 'details', e.target.value)}
            className="block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </ConditionalFormControl>
      </TechSheetSection>

      <TechSheetSection title="Contacte i Observacions">
        <ConditionalFormControl
          label="PERSONA DE CONTACTE COMPANYIA"
          status={formData.companyContact?.status || 'unset'}
          onStatusChange={(status) => handleStatusChange('companyContact', status)}
        >
          <input
            type="text"
            placeholder="Nom, telèfon, email..."
            value={formData.companyContact?.details || ''}
            onChange={(e) => handleConditionalChange('companyContact', 'details', e.target.value)}
            className="block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-1"
          />
        </ConditionalFormControl>

        <ConditionalFormControl
          label="ALTRES / OBSERVACIONS"
          status={formData.observations?.status || 'unset'}
          onStatusChange={(status) => handleStatusChange('observations', status)}
        >
          <textarea
            rows={4}
            placeholder="Qualsevol altre detall o observació important..."
            value={formData.observations?.details || ''}
            onChange={(e) => handleConditionalChange('observations', 'details', e.target.value)}
            className="block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </ConditionalFormControl>
      </TechSheetSection>

    </div>
  );
};

export default TechSheetForm;
