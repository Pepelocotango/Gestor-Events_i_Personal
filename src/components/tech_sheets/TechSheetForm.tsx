import React, { useState, useEffect, useRef } from 'react';
import { useEventData } from '../../contexts/EventDataContext';
import { EventFrame, TechSheetData, TechSheetProvider, TechSheetRoleItem } from '../../types';
import TechSheetSection from './TechSheetSection';
import TechSheetField from './TechSheetField';
import { formatDateDMY } from '../../utils/dateFormat';
import { exportToPdf } from '../../utils/pdfGenerator';
import TechnicalPersonnelSection from './TechnicalPersonnelSection';
import NeedsList from './NeedsList';

interface TechSheetFormProps {
  eventFrame: EventFrame;
}

const TechSheetForm: React.FC<TechSheetFormProps> = ({ eventFrame }) => {
const { peopleGroups, materialItems, addOrUpdateTechSheet, showToast, getPersonGroupById, getMaterialAvailability } = useEventData();

  const getInitialFormData = (): TechSheetData => {
    const data = eventFrame.techSheet!;
    if (!data.technicalProviders) {
      // Si les dades són antigues, les migrem al nou format.
      // És important inicialitzar-ho com un array buit.
      return { ...data, technicalProviders: [] };
    }
    return data;
  };

  const [formData, setFormData] = useState<TechSheetData>(getInitialFormData());
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

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
        setIsDirty(true);
        return { ...currentData, eventName: newEventName, location: newLocation, date: newDate };
      }
      return currentData;
    });
  }, [eventFrame.name, eventFrame.place, eventFrame.startDate, eventFrame.endDate]);

  if (!formData) {
    return <div>Carregant dades de la fitxa tècnica...</div>;
  }

  const generateLocalId = () => `local_${Date.now().toString(36) + Math.random().toString(36).substring(2)}`;

  type TechSheetNeedListKey = 'lightingNeeds' | 'soundNeeds' | 'videoNeeds' | 'machineryNeeds';
  type TechSheetScheduleListKey = 'assemblySchedule';
  type TechSheetListKey = TechSheetNeedListKey | TechSheetScheduleListKey;

  const handleListChange = (listName: string, index: number, field: string, value: any) => {
    setFormData(prev => {
      const newList = [...(prev[listName as TechSheetListKey] as any[])];
      const currentItem = { ...newList[index] };
      currentItem[field] = value;
      
      // Si estem canviant la descripció, busquem si correspon a un ítem de material
      if (field === 'description') {
        const matchedItem = materialItems.find(item => item.name === value);
        currentItem.materialItemId = matchedItem ? matchedItem.id : null;
      }

      newList[index] = currentItem;
      return { ...prev, [listName]: newList };
    });
    setIsDirty(true);
  };
  
  const handleRemoveListItem = (listName: string, index: number) => {
    const newList = (formData[listName as TechSheetListKey] as any[]).filter((_, i) => i !== index);
    const updatedFormData = { ...formData, [listName]: newList };
    setFormData(updatedFormData);
    addOrUpdateTechSheet(eventFrame.id, updatedFormData);
    showToast('Ítem eliminat.', 'info');
  };
  
  const handleAddListItem = (listName: string) => {
    let newItem: any;
    switch (listName) {
      case 'assemblySchedule':
        newItem = { id: generateLocalId(), time: '', description: '' };
        break;
      case 'lightingNeeds':
      case 'soundNeeds':
      case 'videoNeeds':
      case 'machineryNeeds':
        newItem = { id: generateLocalId(), quantity: 1, description: '', origin: '' };
        break;
      default:
        return;
    }
    setFormData(prev => ({
      ...prev,
      [listName]: [...(prev[listName as TechSheetListKey] as any[]), newItem],
    }));
    setIsDirty(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };
  
  const handleBlur = () => {
    if (isDirty) {
      addOrUpdateTechSheet(eventFrame.id, formData);
      showToast('Canvis desats automàticament.', 'success');
      setIsDirty(false);
    }
  };

  const handleProviderChange = (providerIndex: number, personGroupId: string) => {
    setFormData(prev => {
      const newProviders = [...prev.technicalProviders];
      newProviders[providerIndex].personGroupId = personGroupId;
      return { ...prev, technicalProviders: newProviders };
    });
    setIsDirty(true);
  };

  const handleRoleChange = (providerIndex: number, roleIndex: number, field: keyof TechSheetRoleItem, value: any) => {
    // Si estem canviant el rol, netegem el prefix de la categoria
    const finalValue = (field === 'role' && typeof value === 'string' && value.includes(': '))
      ? value.split(': ')[1]
      : value;

    setFormData(prev => {
      const newProviders = [...prev.technicalProviders];
      const newRoles = [...newProviders[providerIndex].roles];
      newRoles[roleIndex] = { ...newRoles[roleIndex], [field]: finalValue }; // Utilitzem el valor netejat
      newProviders[providerIndex].roles = newRoles;
      return { ...prev, technicalProviders: newProviders };
    });
    setIsDirty(true);
  };

  const handleAddProvider = () => {
    const newProvider: TechSheetProvider = {
      id: generateLocalId(),
      personGroupId: '',
      roles: [],
    };
    setFormData(prev => ({ ...prev, technicalProviders: [...prev.technicalProviders, newProvider] }));
    setIsDirty(true);
  };

  const handleRemoveProvider = (providerIndex: number) => {
    const updatedProviders = formData.technicalProviders.filter((_, i) => i !== providerIndex);
    setFormData(prev => ({ ...prev, technicalProviders: updatedProviders }));
    addOrUpdateTechSheet(eventFrame.id, { ...formData, technicalProviders: updatedProviders });
    showToast('Proveïdor eliminat i canvis desats.', 'info');
  };
  
  const handleAddRole = (providerIndex: number) => {
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
    setIsDirty(true);
  };

  const handleRemoveRole = (providerIndex: number, roleIndex: number) => {
    const updatedProviders = [...formData.technicalProviders];
    updatedProviders[providerIndex].roles = updatedProviders[providerIndex].roles.filter((_, i) => i !== roleIndex);
    setFormData({ ...formData, technicalProviders: updatedProviders });
    addOrUpdateTechSheet(eventFrame.id, { ...formData, technicalProviders: updatedProviders });
    showToast('Rol eliminat i canvis desats.', 'info');
  };



 





  const handleExportToPdf = () => {
    exportToPdf(formData, eventFrame.name, getPersonGroupById, showToast);
  };

  return (
    <div ref={formRef} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow space-y-6 tech-sheet-form-container">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Fitxa de Bolo: <span className="text-blue-600 dark:text-blue-400">{eventFrame.name}</span>
        </h2>
        <button onClick={handleExportToPdf} className="export-pdf-button px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-semibold no-print">Exportar a PDF</button>
      </div>
      <div className="mt-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">Edita els detalls tècnics de l'esdeveniment. Els canvis es desen automàticament quan canvies de camp.</p>
      </div>

      <TechSheetSection title="Informació General" layout="single-column">
        <TechSheetField id="eventName" label="NOM DEL ESDEVENIMENT:" value={formData.eventName} onChange={handleChange} onBlur={handleBlur} required />
        <TechSheetField id="location" label="LLOC:" value={formData.location} onChange={handleChange} onBlur={handleBlur} />
        <TechSheetField id="date" label="DATA:" value={formData.date} onChange={handleChange} onBlur={handleBlur} />
        <TechSheetField id="showTime" label="HORA:" value={formData.showTime} onChange={handleChange} onBlur={handleBlur} type="time" />
        <TechSheetField id="showDuration" label="DURADA ESPECTACLE:" value={formData.showDuration} onChange={handleChange} onBlur={handleBlur} placeholder="XX min" />
        {/* ZONA RESERVADA PARKING: selector SI/NO i detalls */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ZONA RESERVADA PARKING:</label>
          <select
            value={formData.parkingInfo?.startsWith('SI') ? 'SI' : (formData.parkingInfo?.startsWith('NO') ? 'NO' : '')}
            onChange={e => {
              const val = e.target.value;
              setFormData(prev => ({ ...prev, parkingInfo: val === 'NO' ? 'NO' : (val === 'SI' ? 'SI' : '') }));
              setIsDirty(true);
            }}
            className="mt-1 block w-32 pl-3 pr-10 py-1 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">--</option>
            <option value="SI">SI</option>
            <option value="NO">NO</option>
          </select>
          {formData.parkingInfo?.startsWith('SI') && (
            <textarea
              className="mt-2 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Detalls de la zona de parking..."
              value={formData.parkingInfo.replace(/^SI:?\s*/, '')}
              onChange={e => {
                setFormData(prev => ({ ...prev, parkingInfo: `SI: ${e.target.value}` }));
                setIsDirty(true);
              }}
              onBlur={handleBlur}
            />
          )}
        </div>
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
        <div className="mb-2 col-span-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PREMUNTATGE:</label>
          <select
            value={formData.preAssemblySchedule?.startsWith('SI') ? 'SI' : (formData.preAssemblySchedule?.startsWith('NO') ? 'NO' : '')}
            onChange={e => {
              const val = e.target.value;
              setFormData(prev => ({ ...prev, preAssemblySchedule: val === 'NO' ? 'NO' : (val === 'SI' ? 'SI: ' : '') }));
              setIsDirty(true);
            }}
            onBlur={handleBlur}
            className="mt-1 block w-32 pl-3 pr-10 py-1 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">--</option>
            <option value="SI">SI</option>
            <option value="NO">NO</option>
          </select>
          {formData.preAssemblySchedule?.startsWith('SI') && (
            <textarea
              className="mt-2 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Detalls premuntatge, personal, horaris..."
              value={formData.preAssemblySchedule.replace(/^SI:?\s*/, '')}
              onChange={e => {
                setFormData(prev => ({ ...prev, preAssemblySchedule: `SI: ${e.target.value}` }));
                setIsDirty(true);
              }}
              onBlur={handleBlur}
            />
          )}
        </div>
        
        {formData.preAssemblySchedule?.startsWith('SI') && (
          <div className="col-span-full space-y-4">
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 -mb-2">HORARIS DETALLATS:</h4>
            {formData.assemblySchedule.map((item, index) => (
              <div key={item.id} className="flex items-start gap-4 w-full">
                <div className="w-1/4">
                  <TechSheetField
                    id={`schedule-time-${index}`}
                    label={`Hora ${index + 1}`}
                    value={item.time}
                    onChange={(e) => handleListChange('assemblySchedule', index, 'time', e.target.value)}
                    onBlur={handleBlur}
                    type="time"
                  />
                </div>
                <div className="w-3/4">
                  <TechSheetField
                    id={`schedule-desc-${index}`}
                    label={`Descripció ${index + 1}`}
                    value={item.description}
                    onChange={(e) => handleListChange('assemblySchedule', index, 'description', e.target.value)}
                    onBlur={handleBlur}
                  />
                </div>
                <div className="w-auto flex-shrink-0 pt-7">
                  <button
                    type="button"
                    onClick={() => handleRemoveListItem('assemblySchedule', index)}
                    className="remove-item-button text-red-500 hover:bg-red-100 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold no-print"
                    title="Eliminar horari"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            <div className="mt-2 no-print">
              <button
                type="button"
                onClick={() => handleAddListItem('assemblySchedule')}
                className="add-item-button px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
              >
                + Afegir Ítem Horari
              </button>
            </div>
          </div>
        )}
        
      </TechSheetSection>

      <TechSheetSection title="Logística">
        <TechSheetField id="dressingRooms" label="CAMERINOS:" value={formData.dressingRooms} onChange={handleChange} onBlur={handleBlur} placeholder="Ex: SI X"/>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ACTORS:</label>
          <select
            value={formData.actorsNumber || ''}
            onChange={e => {
              const val = parseInt(e.target.value, 10);
              setFormData(prev => ({ ...prev, actorsNumber: val, actors: val > 0 ? prev.actors : '' }));
              setIsDirty(true);
            }}
            className="mt-1 block w-24 pl-3 pr-10 py-1 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">--</option>
            {[...Array(21).keys()].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {Number(formData.actorsNumber) > 0 && (
            <textarea
              className="mt-2 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Noms dels actors..."
              value={formData.actors || ''}
              onChange={e => {
                setFormData(prev => ({ ...prev, actors: e.target.value }));
                setIsDirty(true);
              }}
              onBlur={handleBlur}
            />
          )}
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">TÈCNICS/PRODUCCIÓ CIA:</label>
          <select
            value={formData.companyTechniciansNumber || ''}
            onChange={e => {
              const val = parseInt(e.target.value, 10);
              setFormData(prev => ({ ...prev, companyTechniciansNumber: val, companyTechnicians: val > 0 ? prev.companyTechnicians : '' }));
              setIsDirty(true);
            }}
            className="mt-1 block w-24 pl-3 pr-10 py-1 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">--</option>
            {[...Array(21).keys()].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {Number(formData.companyTechniciansNumber) > 0 && (
            <textarea
              className="mt-2 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Noms dels tècnics/producció..."
              value={formData.companyTechnicians || ''}
              onChange={e => {
                setFormData(prev => ({ ...prev, companyTechnicians: e.target.value }));
                setIsDirty(true);
              }}
              onBlur={handleBlur}
            />
          )}
        </div>
      </TechSheetSection>

      <TechSheetSection title="Necessitats Tècniques">
        <NeedsList
          needs={formData.lightingNeeds}
          title="Il·luminació"
          listName="lightingNeeds"
          materialItems={materialItems}
          eventFrame={eventFrame}
          onListChange={handleListChange}
          onRemoveListItem={handleRemoveListItem}
          onAddListItem={handleAddListItem}
          getMaterialAvailability={getMaterialAvailability}
        />
        <NeedsList
          needs={formData.soundNeeds}
          title="So"
          listName="soundNeeds"
          materialItems={materialItems}
          eventFrame={eventFrame}
          onListChange={handleListChange}
          onRemoveListItem={handleRemoveListItem}
          onAddListItem={handleAddListItem}
          getMaterialAvailability={getMaterialAvailability}
        />
        <div className="col-span-full mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">VÍDEO:</label>
          <select value={formData.videoDetails?.startsWith('SI') ? 'SI' : (formData.videoDetails?.startsWith('NO') ? 'NO' : '')}
            onChange={e => {
              const val = e.target.value;
              setFormData(prev => ({ ...prev, videoDetails: val === 'NO' ? 'NO' : (val === 'SI' ? 'SI' : '') }));
              setIsDirty(true);
            }}
            className="mt-1 block w-32 pl-3 pr-10 py-1 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">--</option>
            <option value="SI">SI</option>
            <option value="NO">NO</option>
          </select>
          {formData.videoDetails?.startsWith('SI') && (
            <textarea
              className="mt-2 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2} placeholder="Detalls generals de vídeo..." value={formData.videoDetails.replace(/^SI:?\s*/, '')}
              onChange={e => { setFormData(prev => ({ ...prev, videoDetails: `SI: ${e.target.value}` })); setIsDirty(true); }} onBlur={handleBlur}
            />
          )}
        </div>
        {formData.videoDetails?.startsWith('SI') && (
          <NeedsList
            needs={formData.videoNeeds}
            title="Vídeo"
            listName="videoNeeds"
            materialItems={materialItems}
            eventFrame={eventFrame}
            onListChange={handleListChange}
            onRemoveListItem={handleRemoveListItem}
            onAddListItem={handleAddListItem}
            getMaterialAvailability={getMaterialAvailability}
          />
        )}
        <NeedsList
          needs={formData.machineryNeeds}
          title="Maquinària"
          listName="machineryNeeds"
          materialItems={materialItems}
          eventFrame={eventFrame}
          onListChange={handleListChange}
          onRemoveListItem={handleRemoveListItem}
          onAddListItem={handleAddListItem}
          getMaterialAvailability={getMaterialAvailability}
        />
      </TechSheetSection>
      
      <TechSheetSection title="Altres Detalls">
        <TechSheetField id="controlLocation" label="CONTROL A:" value={formData.controlLocation} onChange={handleChange} onBlur={handleBlur} placeholder="Ex: X PLATEA"/>
        {/* MATERIAL D’ALTRES EQUIPAMENTS: SI/NO i detalls */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">MATERIAL D’ALTRES EQUIPAMENTS:</label>
          <select
            value={formData.otherEquipment?.startsWith('SI') ? 'SI' : (formData.otherEquipment?.startsWith('NO') ? 'NO' : '')}
            onChange={e => {
              const val = e.target.value;
              setFormData(prev => ({ ...prev, otherEquipment: val === 'NO' ? 'NO' : (val === 'SI' ? 'SI' : '') }));
              setIsDirty(true);
            }}
            className="mt-1 block w-32 pl-3 pr-10 py-1 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">--</option>
            <option value="SI">SI</option>
            <option value="NO">NO</option>
          </select>
          {formData.otherEquipment?.startsWith('SI') && (
            <textarea
              className="mt-2 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Detalls del material d’altres equipaments..."
              value={formData.otherEquipment.replace(/^SI:?\s*/, '')}
              onChange={e => {
                setFormData(prev => ({ ...prev, otherEquipment: `SI: ${e.target.value}` }));
                setIsDirty(true);
              }}
              onBlur={handleBlur}
            />
          )}
        </div>
        {/* LLOGUERS: SI/NO i detalls */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">LLOGUERS:</label>
          <select
            value={formData.rentals?.startsWith('SI') ? 'SI' : (formData.rentals?.startsWith('NO') ? 'NO' : '')}
            onChange={e => {
              const val = e.target.value;
              setFormData(prev => ({ ...prev, rentals: val === 'NO' ? 'NO' : (val === 'SI' ? 'SI' : '') }));
              setIsDirty(true);
            }}
            className="mt-1 block w-32 pl-3 pr-10 py-1 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">--</option>
            <option value="SI">SI</option>
            <option value="NO">NO</option>
          </select>
          {formData.rentals?.startsWith('SI') && (
            <textarea
              className="mt-2 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Detalls dels lloguers..."
              value={formData.rentals.replace(/^SI:?\s*/, '')}
              onChange={e => {
                setFormData(prev => ({ ...prev, rentals: `SI: ${e.target.value}` }));
                setIsDirty(true);
              }}
              onBlur={handleBlur}
            />
          )}
        </div>
        <TechSheetField id="blueprints" label="PLÀNOLS:" value={formData.blueprints} onChange={handleChange} onBlur={handleBlur} as="textarea" rows={3} placeholder="Ex: XX x/x/x HORARIS x/x/x"/>
      </TechSheetSection>

      <TechSheetSection title="Contacte i Observacions">
        <TechSheetField id="companyContact" label="PERSONA DE CONTACTE COMPANYIA:" value={formData.companyContact} onChange={handleChange} onBlur={handleBlur} />
        <TechSheetField id="observations" label="ALTRES / OBSERVACIONS:" value={formData.observations} onChange={handleChange} onBlur={handleBlur} as="textarea" rows={4}/>
      </TechSheetSection>

    </div>
  );
};

export default TechSheetForm;
