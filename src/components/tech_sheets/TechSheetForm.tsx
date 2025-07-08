import React, { useState, useEffect, useRef } from 'react';
import { useEventData } from '../../contexts/EventDataContext';
import { EventFrame, TechSheetData, TechSheetProvider, TechSheetRoleItem, AssignmentStatus } from '../../types';
import jsPDF from 'jspdf';
import TechSheetSection from './TechSheetSection';
import TechSheetField from './TechSheetField';
import { formatDateDMY } from '../../utils/dateFormat';
import { TECH_SHEET_ROLE_SUGGESTIONS } from '../../constants';

interface TechSheetFormProps {
  eventFrame: EventFrame;
}

const TechSheetForm: React.FC<TechSheetFormProps> = ({ eventFrame }) => {
  const { peopleGroups, addOrUpdateTechSheet, showToast, getPersonGroupById } = useEventData();
  
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

  const handleListChange = (listName: TechSheetListKey, index: number, field: string, value: any) => {
    setFormData(prev => {
      const newList = [...(prev[listName] as any[])];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, [listName]: newList };
    });
    setIsDirty(true);
  };
  
  const handleRemoveListItem = (listName: TechSheetListKey, index: number) => {
    const newList = (formData[listName] as any[]).filter((_, i) => i !== index);
    const updatedFormData = { ...formData, [listName]: newList };
    setFormData(updatedFormData);
    addOrUpdateTechSheet(eventFrame.id, updatedFormData);
    showToast('Ítem eliminat.', 'info');
  };
  
  const handleAddListItem = (listName: TechSheetListKey) => {
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
      [listName]: [...(prev[listName] as any[]), newItem],
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
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let y = 15;
      const left = 12;
      const right = pdf.internal.pageSize.getWidth() - left;
      const lineSpacing = 6;
      const sectionSpacing = 8;
      const subSectionSpacing = 4;
      
      const addLine = (txt: string, size = 10, style = 'normal', indent = 0) => {
        if (y > 280) { // Marge inferior per canvi de pàgina
          pdf.addPage();
          y = 15;
        }
        pdf.setFontSize(size);
        pdf.setFont('helvetica', style);
        pdf.text(txt, left + indent, y, { maxWidth: right - left - indent });
        y += lineSpacing;
      };

      const addSectionTitle = (title: string) => {
        y += sectionSpacing / 2;
        addLine(title, 13, 'bold');
        y += subSectionSpacing / 2;
      };

      // --- CAPÇALERA ---
      pdf.setFontSize(18); pdf.setFont('helvetica', 'bold');
      pdf.text(`Fitxa Tècnica - ${formData.eventName}`, left, y); y += 10;
      
      // --- INFORMACIÓ GENERAL ---
      pdf.setFontSize(11); pdf.setFont('helvetica', 'normal');
      pdf.text(`Lloc: ${formData.location || '-'}`, left, y);
      pdf.text(`Data: ${formData.date || '-'}`, right - 60, y); y += lineSpacing;
      pdf.text(`Hora: ${formData.showTime || '-'}`, left, y);
      pdf.text(`Durada: ${formData.showDuration || '-'}`, right - 60, y); y += lineSpacing;
      if (formData.parkingInfo) {
        pdf.text(`Pàrquing: ${formData.parkingInfo}`, left, y); y+= lineSpacing;
      }
      
      // --- PERSONAL TÈCNIC ---
      addSectionTitle('Personal Tècnic');
      if (formData.technicalProviders.length > 0) {
        formData.technicalProviders.forEach(provider => {
          const person = getPersonGroupById(provider.personGroupId);
          addLine(`Proveïdor: ${person?.name || 'No seleccionat'}`, 11, 'bold');
          if (provider.roles.length > 0) {
            provider.roles.forEach(roleItem => {
              const notes = roleItem.notes ? `(${roleItem.notes})` : '';
              addLine(`${roleItem.quantity} x ${roleItem.role} ${notes}`, 10, 'normal', 5);
            });
          }
          y += subSectionSpacing;
        });
      } else {
        addLine('Cap proveïdor de personal definit.', 10, 'italic');
      }

      // --- HORARIS ---
      addSectionTitle('Premuntatge i Horaris');
      if (formData.preAssemblySchedule) {
        addLine(`Premuntatge: ${formData.preAssemblySchedule}`, 10);
      }
      if (formData.assemblySchedule.length > 0) {
        formData.assemblySchedule.forEach(item => {
          addLine(`${item.time}: ${item.description}`, 10, 'normal', 5);
        });
      }

      // --- LOGÍSTICA ---
      addSectionTitle('Logística');
      addLine(`Camerinos: ${formData.dressingRooms || '-'}`, 10);
      addLine(`Actors: ${formData.actorsNumber || ''} ${formData.actors || ''}`, 10);
      addLine(`Tècnics/Producció Cia: ${formData.companyTechniciansNumber || ''} ${formData.companyTechnicians || ''}`, 10);

      // --- NECESSITATS TÈCNIQUES ---
      addSectionTitle('Necessitats Tècniques');
      const printNeeds = (title: string, needs: any[]) => {
        if (needs.length > 0) {
          addLine(title, 11, 'bold');
          needs.forEach(n => {
            addLine(`${n.quantity} x ${n.description} (Origen: ${n.origin || 'N/D'})`, 10, 'normal', 5);
          });
        }
      };
      printNeeds('Il·luminació:', formData.lightingNeeds);
      if (formData.videoDetails) {
        addLine('Vídeo:', 11, 'bold');
        addLine(formData.videoDetails, 10, 'normal', 5);
      }
      printNeeds('', formData.videoNeeds);
      printNeeds('So:', formData.soundNeeds);
      printNeeds('Maquinària:', formData.machineryNeeds);

      // --- ALTRES DETALLS ---
      addSectionTitle('Altres Detalls');
      addLine(`Control a: ${formData.controlLocation || '-'}`, 10);
      if (formData.otherEquipment) addLine(`Material d'altres equipaments: ${formData.otherEquipment}`, 10);
      if (formData.rentals) addLine(`Lloguers: ${formData.rentals}`, 10);
      if (formData.blueprints) addLine(`Plànols: ${formData.blueprints}`, 10);

      // --- CONTACTE I OBSERVACIONS ---
      addSectionTitle('Contacte i Observacions');
      addLine(`Contacte Companyia: ${formData.companyContact || '-'}`, 10);
      if (formData.observations) addLine(`Observacions: ${formData.observations}`, 10);

      // --- DESA EL PDF ---
      const fileName = `Fitxa_Bolo_${eventFrame.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      pdf.save(fileName);
      showToast('PDF generat amb èxit!', 'success');
    } catch (error) {
      showToast(`Error generant PDF: ${(error as Error).message}`, 'error');
    }
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

       <TechSheetSection title="Personal Tècnic"
        layout="single-column"
        headerActions={
          <button
            type="button"
            onClick={() => {
              const confirmedAssignments = eventFrame.assignments.filter(a => 
                a.status === AssignmentStatus.Yes || (a.status === AssignmentStatus.Mixed && Object.values(a.dailyStatuses || {}).includes(AssignmentStatus.Yes))
              );

              if (confirmedAssignments.length === 0) {
                showToast('No hi ha personal confirmat a les assignacions per afegir.', 'info');
                return;
              }

              let updatedProviders = [...formData.technicalProviders];
              let newRolesCount = 0;
              let newProvidersCount = 0;

              const assignmentsByProvider = confirmedAssignments.reduce((acc, assignment) => {
                (acc[assignment.personGroupId] = acc[assignment.personGroupId] || []).push(assignment);
                return acc;
              }, {} as Record<string, typeof confirmedAssignments>);

              Object.entries(assignmentsByProvider).forEach(([personGroupId, assignments]) => {
                const person = getPersonGroupById(personGroupId);
                if (!person) return;

                let providerIndex = updatedProviders.findIndex(p => p.personGroupId === personGroupId);
                
                if (providerIndex === -1) {
                  const newProvider: TechSheetProvider = { id: generateLocalId(), personGroupId, roles: [] };
                  updatedProviders.push(newProvider);
                  providerIndex = updatedProviders.length - 1;
                  newProvidersCount++;
                }
                
                const existingRoles = new Set(updatedProviders[providerIndex].roles.map(r => r.role.trim().toLowerCase()));
                
                assignments.forEach(assignment => {
                  const roleName = person.role || ''; // Si no hi ha rol, el camp queda buit
                  if (roleName && !existingRoles.has(roleName.trim().toLowerCase())) {
                    updatedProviders[providerIndex].roles.push({
                      id: generateLocalId(),
                      role: roleName,
                      quantity: 1,
                      notes: assignment.notes || '',
                    });
                    existingRoles.add(roleName.trim().toLowerCase());
                    newRolesCount++;
                  }
                });
              });

              if (newRolesCount > 0 || newProvidersCount > 0) {
                const updatedFormData = { ...formData, technicalProviders: updatedProviders };
                setFormData(updatedFormData);
                addOrUpdateTechSheet(eventFrame.id, updatedFormData);
                showToast('Personal actualitzat des de les assignacions i desat.', 'success');
              } else {
                showToast('Tot el personal confirmat ja és a la fitxa.', 'info');
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
          {formData.technicalProviders.map((provider, providerIndex) => {
            const selectedPerson = getPersonGroupById(provider.personGroupId);
            return (
              <div key={provider.id} className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 flex items-start gap-4">
                    <div className="w-2/3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Proveïdor de Personal {providerIndex + 1}</label>
                      <select
                        value={provider.personGroupId}
                        onChange={(e) => handleProviderChange(providerIndex, e.target.value)}
                        onBlur={handleBlur}
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
                        onChange={() => {}} // No fa res
                        disabled // Camp de només lectura
                      />
                    </div>
                  </div>
                  <button type="button" onClick={() => handleRemoveProvider(providerIndex)} className="ml-4 text-red-500 hover:text-red-700 font-bold" title="Eliminar aquest proveïdor i tots els seus rols">Eliminar Proveïdor</button>
                </div>

                <div className="space-y-3 pl-4 border-l-2 border-indigo-200 dark:border-indigo-700">
                  {provider.roles.map((roleItem, roleIndex) => (
                    <div key={roleItem.id} className="flex items-start gap-4 w-full">
                      <div className="w-2/5">
                        <TechSheetField id={`role-${providerIndex}-${roleIndex}`} label={`Rol ${roleIndex + 1}`} value={roleItem.role} onChange={(e) => handleRoleChange(providerIndex, roleIndex, 'role', e.target.value)} onBlur={handleBlur} suggestions={TECH_SHEET_ROLE_SUGGESTIONS} />
                      </div>
                      <div className="w-1/5">
                        <TechSheetField id={`quantity-${providerIndex}-${roleIndex}`} label="Quant." type="number" value={roleItem.quantity} onChange={(e) => handleRoleChange(providerIndex, roleIndex, 'quantity', e.target.value)} onBlur={handleBlur} />
                      </div>
                      <div className="w-2/5">
                        <TechSheetField id={`notes-${providerIndex}-${roleIndex}`} label="Notes Rol" value={roleItem.notes || ''} onChange={(e) => handleRoleChange(providerIndex, roleIndex, 'notes', e.target.value)} onBlur={handleBlur} as="textarea" rows={1} />
                      </div>
                      <div className="w-auto flex-shrink-0 pt-7">
                        <button type="button" onClick={() => handleRemoveRole(providerIndex, roleIndex)} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold no-print" title="Eliminar aquest rol">×</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => handleAddRole(providerIndex)} className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">+ Afegir Rol</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="col-span-full mt-4 no-print">
          <button type="button" onClick={handleAddProvider} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-semibold">+ Afegir Proveïdor de Personal</button>
        </div>
      </TechSheetSection>

      <TechSheetSection title="Premuntatge i Horaris">
        <div className="mb-2 col-span-full"> {/* Usar col-span-full per ocupar tot l'ample */}
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
        
        {/* Llista dinàmica d'horaris */}
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
        {/* Actors: selector numèric i caixa de text si >0 */}
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
        {/* Tècnics companyia: selector numèric i caixa de text si >0 */}
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
        <h4 className="col-span-full text-md font-semibold text-gray-700 dark:text-gray-300 -mb-2">IL·LUMINACIÓ:</h4>
        {formData.lightingNeeds.map((need, index) => (
          <React.Fragment key={need.id || `light-need-${index}`}>
            <TechSheetField id={`light-qty-${index}`} label={`Qt. Il·lu. ${index + 1}`} value={need.quantity} onChange={e => handleListChange('lightingNeeds', index, 'quantity', e.target.value)} onBlur={handleBlur} placeholder="XX"/>
            <TechSheetField id={`light-desc-${index}`} label={`Desc. Il·lu. ${index + 1}`} value={need.description} onChange={e => handleListChange('lightingNeeds', index, 'description', e.target.value)} onBlur={handleBlur} />
            <TechSheetField id={`light-origin-${index}`} label={`Origen Il·lu. ${index + 1}`} value={need.origin} onChange={e => handleListChange('lightingNeeds', index, 'origin', e.target.value)} onBlur={handleBlur} placeholder="CIA / TÀG"/>
            <div className="flex items-end"><button type="button" onClick={() => handleRemoveListItem('lightingNeeds', index)} className="remove-item-button text-red-500 hover:bg-red-100 rounded-full w-7 h-7 flex items-center justify-center text-lg no-print" title="Eliminar">×</button></div>
          </React.Fragment>
        ))}
        <div className="col-span-full mt-2 no-print">
          <button type="button" onClick={() => handleAddListItem('lightingNeeds')} className="add-item-button px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">+ Afegir Necessitat Il·luminació</button>
        </div>

        <h4 className="col-span-full text-md font-semibold text-gray-700 dark:text-gray-300 mt-3 -mb-2">SO:</h4>
        {formData.soundNeeds.map((need, index) => (
          <React.Fragment key={need.id || `sound-need-${index}`}>
            <TechSheetField id={`sound-qty-${index}`} label={`Qt. So ${index + 1}`} value={need.quantity} onChange={e => handleListChange('soundNeeds', index, 'quantity', e.target.value)} onBlur={handleBlur} placeholder="XX"/>
            <TechSheetField id={`sound-desc-${index}`} label={`Desc. So ${index + 1}`} value={need.description} onChange={e => handleListChange('soundNeeds', index, 'description', e.target.value)} onBlur={handleBlur} />
            <TechSheetField id={`sound-origin-${index}`} label={`Origen So ${index + 1}`} value={need.origin} onChange={e => handleListChange('soundNeeds', index, 'origin', e.target.value)} onBlur={handleBlur} placeholder="CIA / TÀG"/>
            <div className="flex items-end"><button type="button" onClick={() => handleRemoveListItem('soundNeeds', index)} className="remove-item-button text-red-500 hover:bg-red-100 rounded-full w-7 h-7 flex items-center justify-center text-lg no-print" title="Eliminar">×</button></div>
          </React.Fragment>
        ))}
        <div className="col-span-full mt-2 no-print">
          <button type="button" onClick={() => handleAddListItem('soundNeeds')} className="add-item-button px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">+ Afegir Necessitat So</button>
        </div>

        <h4 className="col-span-full text-md font-semibold text-gray-700 dark:text-gray-300 mt-3 -mb-2">VÍDEO:</h4>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">VÍDEO:</label>
          <select
            value={formData.videoDetails?.startsWith('SI') ? 'SI' : (formData.videoDetails?.startsWith('NO') ? 'NO' : '')}
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
              rows={2}
              placeholder="Detalls generals de vídeo..."
              value={formData.videoDetails.replace(/^SI:?\s*/, '')}
              onChange={e => {
                setFormData(prev => ({ ...prev, videoDetails: `SI: ${e.target.value}` }));
                setIsDirty(true);
              }}
              onBlur={handleBlur}
            />
          )}
        </div>
        {formData.videoDetails?.startsWith('SI') && (
          <>
            {formData.videoNeeds.map((need, index) => (
              <React.Fragment key={need.id || `video-need-${index}`}>
                <TechSheetField id={`video-qty-${index}`} label={`Qt. Vídeo ${index + 1}`} value={need.quantity} onChange={e => handleListChange('videoNeeds', index, 'quantity', e.target.value)} onBlur={handleBlur} placeholder="XX"/>
                <TechSheetField id={`video-desc-${index}`} label={`Desc. Vídeo ${index + 1}`} value={need.description} onChange={e => handleListChange('videoNeeds', index, 'description', e.target.value)} onBlur={handleBlur} />
                <TechSheetField id={`video-origin-${index}`} label={`Origen Vídeo ${index + 1}`} value={need.origin} onChange={e => handleListChange('videoNeeds', index, 'origin', e.target.value)} onBlur={handleBlur} placeholder="CIA / TÀG"/>
                <div className="flex items-end"><button type="button" onClick={() => handleRemoveListItem('videoNeeds', index)} className="remove-item-button text-red-500 hover:bg-red-100 rounded-full w-7 h-7 flex items-center justify-center text-lg no-print" title="Eliminar">×</button></div>
              </React.Fragment>
            ))}
            <div className="col-span-full mt-2 no-print">
              <button type="button" onClick={() => handleAddListItem('videoNeeds')} className="add-item-button px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">+ Afegir Necessitat Vídeo</button>
            </div>
          </>
        )}

        <h4 className="col-span-full text-md font-semibold text-gray-700 dark:text-gray-300 mt-3 -mb-2">MAQUINÀRIA:</h4>
        {formData.machineryNeeds.map((need, index) => (
          <React.Fragment key={need.id || `machinery-need-${index}`}>
            <TechSheetField id={`machinery-qty-${index}`} label={`Qt. Maquin. ${index + 1}`} value={need.quantity} onChange={e => handleListChange('machineryNeeds', index, 'quantity', e.target.value)} onBlur={handleBlur} placeholder="XX"/>
            <TechSheetField id={`machinery-desc-${index}`} label={`Desc. Maquin. ${index + 1}`} value={need.description} onChange={e => handleListChange('machineryNeeds', index, 'description', e.target.value)} onBlur={handleBlur} />
            <TechSheetField id={`machinery-origin-${index}`} label={`Origen Maquin. ${index + 1}`} value={need.origin} onChange={e => handleListChange('machineryNeeds', index, 'origin', e.target.value)} onBlur={handleBlur} placeholder="CIA / TÀG"/>
            <div className="flex items-end"><button type="button" onClick={() => handleRemoveListItem('machineryNeeds', index)} className="remove-item-button text-red-500 hover:bg-red-100 rounded-full w-7 h-7 flex items-center justify-center text-lg no-print" title="Eliminar">×</button></div>
          </React.Fragment>
        ))}
        <div className="col-span-full mt-2 no-print">
          <button type="button" onClick={() => handleAddListItem('machineryNeeds')} className="add-item-button px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">+ Afegir Necessitat Maquinària</button>
        </div>
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