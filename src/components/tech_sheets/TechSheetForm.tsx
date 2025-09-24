import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useEventDataStore } from '../../stores/eventDataStore';
import { EventFrame, TechSheetData, TechSheetProvider, TechSheetRoleItem, ContactPerson, ConditionalSection, AssemblyScheduleItem, NeedItem, ConditionalStatus, AssignmentStatus, ShowToastFunction } from '../../types';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import TechSheetSection from './TechSheetSection';
import TechSheetField from './TechSheetField';
import { formatDateDMY } from '../../utils/dateFormat';
import { exportTechSheetToPdf } from '../../utils/pdfGenerator';
import TechnicalPersonnelSection from './TechnicalPersonnelSection';
import NeedsList from './NeedsList';
import Tooltip from '../ui/Tooltip';
import ConditionalFormControl from './ConditionalFormControl';
import AutosizeTextarea from '../ui/AutosizeTextarea';

interface TechSheetFormProps {
  eventFrame: EventFrame;
  showToast: ShowToastFunction;
}

const TechSheetForm: React.FC<TechSheetFormProps> = ({ eventFrame, showToast }) => {
  const { peopleGroups, materialItems, addOrUpdateTechSheet, getMaterialAvailability } = useEventDataStore.getState();
  const peopleMap = useMemo(() => {
    const m = new Map<string, string>();
    peopleGroups.forEach(p => m.set(p.id, p.name));
    return m;
  }, [peopleGroups]);

  const getInitialFormData = (): TechSheetData => {
    return eventFrame.techSheet!;
  };

  const [formData, setFormData] = useState<TechSheetData>(getInitialFormData());

  const originSuggestions = useMemo(() => {
    const suggestions = new Set<string>();
    materialItems.forEach(item => {
      if (item.location) suggestions.add(item.location);
    });
    const needsSections: TechSheetNeedsKey[] = ['lighting', 'sound', 'video', 'machinery', 'rentals', 'otherEquipment', 'electrical', 'structures', 'platforms', 'consumables', 'curtains', 'transport'];
    needsSections.forEach(sectionName => {
      const section = formData[sectionName] as ConditionalSection<{ needs: NeedItem[] }>;
      section?.data?.needs?.forEach(need => {
        if (need.origin) suggestions.add(need.origin);
      });
    });
    return Array.from(suggestions).sort();
  }, [materialItems, formData]);
  const formDataRef = useRef(formData);
  const isDirtyRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sectionKeys = useMemo(() => [
    'general', 'personnel', 'preAssembly', 'schedule', 'logistics',
    'technicalNeeds', 'otherDetails', 'contactsObservations'
  ], []);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    sectionKeys.forEach(key => { initialState[key] = true; });
    return initialState;
  });

  const [scheduleSortOrder, setScheduleSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleToggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    sectionKeys.forEach(key => { allExpanded[key] = true; });
    setExpandedSections(allExpanded);
  };

  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    sectionKeys.forEach(key => { allCollapsed[key] = false; });
    setExpandedSections(allCollapsed);
  };

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

  // Aquest useEffect és clau per sincronitzar l'estat local amb el global
  useEffect(() => {
    const newProviders = eventFrame.techSheet?.technicalProviders || [];
    // Comprovem si l'array de proveïdors a l'estat local és diferent del de l'estat global.
    // Això passa després que l'acció de reordenació actualitzi la store.
    if (JSON.stringify(formData.technicalProviders) !== JSON.stringify(newProviders)) {
      setFormData(prev => ({ ...prev, technicalProviders: newProviders }));
    }
  }, [eventFrame.techSheet?.technicalProviders]); // S'executa cada cop que els proveïdors a la store canvien

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

  const handleFieldChange = (field: keyof TechSheetData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    markAsDirty();
  };

  const handleSortNeedsByOrigin = (listName: TechSheetNeedsKey) => {
    setFormData(prev => {
      const section = prev[listName] as ConditionalSection<{ needs: NeedItem[] }>;
      if (!section || !section.data || !section.data.needs) return prev;

      const sortedNeeds = [...section.data.needs].sort((a, b) =>
        a.origin.localeCompare(b.origin, undefined, { sensitivity: 'base' })
      );

      const updatedSection = { ...section, data: { ...section.data, needs: sortedNeeds } };
      return { ...prev, [listName]: updatedSection };
    });
    markAsDirty();
  };

  const handleSortScheduleByDate = () => {
    setFormData(prev => {
      const scheduleData = prev.schedule?.data || [];
      const groupedByDate = scheduleData.reduce((acc, item) => {
        const date = item.date || 'Sense data';
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(item);
        return acc;
      }, {} as Record<string, AssemblyScheduleItem[]>);

      const sortedDates = Object.keys(groupedByDate)
        .filter(date => date !== 'Sense data')
        .sort((a, b) => {
          if (scheduleSortOrder === 'asc') {
            return a.localeCompare(b);
          } else {
            return b.localeCompare(a);
          }
        });

      const newSchedule = sortedDates.flatMap(date => groupedByDate[date]);

      // Keep 'Sense data' items at the end
      if (groupedByDate['Sense data']) {
        newSchedule.push(...groupedByDate['Sense data']);
      }

      return { ...prev, schedule: { ...(prev.schedule || { status: 'unset', details: '' }), data: newSchedule }};
    });
    setScheduleSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    markAsDirty();
  };

  const handleSortScheduleByTime = (date: string) => {
    setFormData(prev => {
      const scheduleData = prev.schedule?.data || [];
      const newSchedule = [...scheduleData];

      // Find the indices of the items for the given date
      const startIndex = newSchedule.findIndex(item => item.date === date);
      if (startIndex === -1) return prev; // No items for this date

      let endIndex = startIndex;
      for (let i = startIndex + 1; i < newSchedule.length; i++) {
        if (newSchedule[i].date === date) {
          endIndex = i;
        } else {
          break;
        }
      }

      // Extract the day's items, sort them by time, and splice them back in
      const dayItems = newSchedule.slice(startIndex, endIndex + 1);
      dayItems.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      newSchedule.splice(startIndex, dayItems.length, ...dayItems);

      return { ...prev, schedule: { ...(prev.schedule || { status: 'unset', details: '' }), data: newSchedule }};
    });
    markAsDirty();
  };

  const handleMoveAssemblyScheduleItemUp = (id: string) => {
    setFormData(prev => {
      const scheduleData = prev.schedule?.data;
      if (!scheduleData) return prev;

      const index = scheduleData.findIndex(item => item.id === id);
      if (index === 0) return prev;

      const currentItem = scheduleData[index];
      const previousItem = scheduleData[index - 1];

      if (previousItem && previousItem.date === currentItem.date) {
        const newSchedule = [...scheduleData];
        [newSchedule[index - 1], newSchedule[index]] = [newSchedule[index], newSchedule[index - 1]];
        return { ...prev, schedule: { ...(prev.schedule || { status: 'unset', details: '' }), data: newSchedule } };
      }
      return prev;
    });
    markAsDirty();
  };

  const handleMoveAssemblyScheduleItemDown = (id: string) => {
    setFormData(prev => {
      const scheduleData = prev.schedule?.data;
      if (!scheduleData) return prev;

      const index = scheduleData.findIndex(item => item.id === id);
      if (index === -1 || index === scheduleData.length - 1) return prev;

      const currentItem = scheduleData[index];
      // Since the array is sorted, the next item's date determines if we can move down.
      const nextItem = scheduleData[index + 1];

      if (nextItem && nextItem.date === currentItem.date) {
        const newSchedule = [...scheduleData];
        [newSchedule[index + 1], newSchedule[index]] = [newSchedule[index], newSchedule[index + 1]];
        return { ...prev, schedule: { ...(prev.schedule || { status: 'unset', details: '' }), data: newSchedule } };
      }

      return prev;
    });
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
            currentItem.origin = matchedItem ? matchedItem.location : '';
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

  const handleMoveNeedItemUp = (listName: TechSheetNeedsKey, index: number) => {
    if (index === 0) return;
    setFormData(prev => {
      const section = prev[listName] as ConditionalSection<{ needs: NeedItem[] }>;
      if (!section || !section.data || !section.data.needs) return prev;

      const newNeeds = [...section.data.needs];
      [newNeeds[index - 1], newNeeds[index]] = [newNeeds[index], newNeeds[index - 1]];

      const updatedSection = { ...section, data: { ...section.data, needs: newNeeds } };
      return { ...prev, [listName]: updatedSection };
    });
    markAsDirty();
  };

  const handleMoveNeedItemDown = (listName: TechSheetNeedsKey, index: number) => {
    setFormData(prev => {
      const section = prev[listName] as ConditionalSection<{ needs: NeedItem[] }>;
      if (!section || !section.data || !section.data.needs) return prev;

      const newNeeds = [...section.data.needs];
      if (index >= newNeeds.length - 1) return prev;

      [newNeeds[index + 1], newNeeds[index]] = [newNeeds[index], newNeeds[index + 1]];

      const updatedSection = { ...section, data: { ...section.data, needs: newNeeds } };
      return { ...prev, [listName]: updatedSection };
    });
    markAsDirty();
  };

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

  const handleAssemblyScheduleChange = (id: string, field: keyof AssemblyScheduleItem, value: string) => {
    setFormData(prev => {
      const newSchedule = [...(prev.schedule?.data || [])];
      const index = newSchedule.findIndex(item => item.id === id);
      if (index === -1) return prev;

      const updatedItem = { ...newSchedule[index], [field]: value };
      newSchedule[index] = updatedItem;

      return { ...prev, schedule: { ...(prev.schedule || { status: 'unset', details: '' }), data: newSchedule }};
    });
    markAsDirty();
  };

  const handleAddAssemblyScheduleItem = (date?: string) => {
    const newDate = date !== undefined ? date : eventFrame.startDate;
    const newItem: AssemblyScheduleItem = { id: generateLocalId(), date: newDate, time: '', timeEnd: '', description: '' };

    setFormData(prev => {
      const scheduleData = prev.schedule?.data || [];
      let newSchedule = [...scheduleData];

      if (date) {
        // If a date is provided, add the new item to the end of that day's group
        let lastIndexForDate = -1;
        for (let i = newSchedule.length - 1; i >= 0; i--) {
          if (newSchedule[i].date === date) {
            lastIndexForDate = i;
            break;
          }
        }

        if (lastIndexForDate !== -1) {
          newSchedule.splice(lastIndexForDate + 1, 0, newItem);
        } else {
          // This case should not happen if the button is only shown for existing dates, but as a fallback:
          newSchedule.push(newItem);
        }
      } else {
        // If no date is provided, add it to the end (it will be in the "Sense data" group)
        newSchedule.push(newItem);
      }

      return { ...prev, schedule: { ...(prev.schedule || { status: 'unset', details: '' }), data: newSchedule }};
    });
    markAsDirty();
  };

  const handleRemoveAssemblyScheduleItem = (id: string) => {
    setFormData(prev => {
        const newSchedule = (prev.schedule?.data || []).filter(item => item.id !== id);
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
      const newProviders = (prev.technicalProviders || []).map((provider, index) => {
        if (index === providerIndex) {
          return { ...provider, personGroupId: personGroupId };
        }
        return provider;
      });
      return { ...prev, technicalProviders: newProviders };
    });
    markAsDirty();
  }, []);

  const handleRoleChange = useCallback((providerIndex: number, roleIndex: number, field: keyof TechSheetRoleItem, value: any) => {
    const finalValue = (field === 'role' && typeof value === 'string' && value.includes(': '))
      ? value.split(': ')[1]
      : value;
    setFormData(prev => {
      const newProviders = (prev.technicalProviders || []).map((provider, pIndex) => {
        if (pIndex === providerIndex) {
          const newRoles = provider.roles.map((role, rIndex) => {
            if (rIndex === roleIndex) {
              return { ...role, [field]: finalValue };
            }
            return role;
          });
          return { ...provider, roles: newRoles };
        }
        return provider;
      });
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
      const newProviders = (prev.technicalProviders || []).map((provider, index) => {
        if (index === providerIndex) {
          return {
            ...provider,
            roles: [...provider.roles, newRole]
          };
        }
        return provider;
      });
      return { ...prev, technicalProviders: newProviders };
    });
    markAsDirty();
  }, []);

  const handleRemoveRole = useCallback((providerIndex: number, roleIndex: number) => {
    setFormData(prev => {
      const newProviders = (prev.technicalProviders || []).map((provider, index) => {
        if (index === providerIndex) {
          return {
            ...provider,
            roles: provider.roles.filter((_, i) => i !== roleIndex)
          };
        }
        return provider;
      });
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
  exportTechSheetToPdf(formData, eventFrame.name, (id: string) => ({ id, name: peopleMap.get(id) || 'Desconegut' }), showToast);
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
      const initialProviders = prev.technicalProviders || [];

      // 1. Process removals immutably
      const providersAfterRemoval = initialProviders
        .map(p => ({
          ...p,
          roles: p.roles.filter(r => !toRemoveIds.has(r.id)),
        }))
        .filter(p => p.roles.length > 0 || p.isManual);

      // 2. Process updates immutably
      const providersAfterUpdate = providersAfterRemoval.map(p => {
        const updatesForProvider = toUpdate.filter(update => p.roles.some(r => r.id === update.currentRole.id));
        if (updatesForProvider.length === 0) {
          return p;
        }
        return {
          ...p,
          roles: p.roles.map(r => {
            const relevantUpdate = toUpdate.find(u => u.currentRole.id === r.id);
            return relevantUpdate ? { ...r, notes: relevantUpdate.newNotes } : r;
          }),
        };
      });

      // 3. Process additions immutably
      let providersAfterAddition = [...providersAfterUpdate];
      const newProvidersToAdd: TechSheetProvider[] = [];

      toAdd.forEach(assignment => {
        const personGroupId = assignment.personGroupId;

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

        const newRole: TechSheetRoleItem = {
          id: generateLocalId(),
          assignmentId: assignment.id,
          role: '',
          quantity: 1,
          notes: notes,
          printNotes: true,
        };

        const existingProviderIndex = providersAfterAddition.findIndex(p => p.personGroupId === personGroupId);

        if (existingProviderIndex !== -1) {
          // Update existing provider immutably
          providersAfterAddition = providersAfterAddition.map((p, index) => {
            if (index === existingProviderIndex) {
              return { ...p, roles: [...p.roles, newRole] };
            }
            return p;
          });
        } else {
          // Check if it's already staged to be added
          const stagedProviderIndex = newProvidersToAdd.findIndex(p => p.personGroupId === personGroupId);
          if (stagedProviderIndex !== -1) {
            newProvidersToAdd[stagedProviderIndex] = {
              ...newProvidersToAdd[stagedProviderIndex],
              roles: [...newProvidersToAdd[stagedProviderIndex].roles, newRole],
            };
          } else {
            newProvidersToAdd.push({
              id: generateLocalId(),
              personGroupId,
              roles: [newRole],
              isManual: false,
            });
          }
        }
      });

      const finalProviders = [...providersAfterAddition, ...newProvidersToAdd];

      return { ...prev, technicalProviders: finalProviders };
    });

    markAsDirty();
    showToast(`${selectedChanges.length} canvi(s) aplicat(s) des de les assignacions.`, 'success');
  };

  const { reorderTechnicalProviders } = useEventDataStore.getState();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = formData.technicalProviders.findIndex(p => p.id === active.id);
      const newIndex = formData.technicalProviders.findIndex(p => p.id === over.id);
      const reorderedProviders = arrayMove(formData.technicalProviders, oldIndex, newIndex);

      // Actualitzem l'estat local per a una resposta visual immediata
      setFormData(prev => ({ ...prev, technicalProviders: reorderedProviders }));

      // Cridem l'acció de la store per persistir el canvi a l'estat global
      reorderTechnicalProviders(eventFrame.id, reorderedProviders);
    }
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
        onMoveItemUp={handleMoveNeedItemUp as any}
        onMoveItemDown={handleMoveNeedItemDown as any}
        onSortByOrigin={handleSortNeedsByOrigin as any}
        originSuggestions={originSuggestions}
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
            <Tooltip text="Expandir totes les seccions del formulari">
                <button onClick={expandAll} className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-xs rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 no-print">Expandir Totes</button>
            </Tooltip>
            <Tooltip text="Col·lapsar totes les seccions del formulari">
                <button onClick={collapseAll} className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-xs rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 no-print">Col·lapsar Totes</button>
            </Tooltip>
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
      <TechSheetSection
        title="Informació General"
        layout="grid-2"
        isOpen={expandedSections.general}
        onToggle={() => handleToggleSection('general')}
      >
        <TechSheetField id="eventName" label="NOM DEL ESDEVENIMENT:" value={formData.eventName} onChange={handleChange} required tooltipText="El nom de l'esdeveniment es sincronitza automàticament amb el nom del 'Event Frame'."/>
        <TechSheetField id="location" label="LLOC:" value={formData.location} onChange={handleChange} tooltipText="El lloc de l'esdeveniment. També es sincronitza des del 'Event Frame'."/>
        <TechSheetField id="date" label="DATA:" value={formData.date} onChange={handleChange} tooltipText="La data o rang de dates de l'esdeveniment. Sincronitzat des del 'Event Frame'."/>
        <TechSheetField id="showTime" label="HORA:" value={formData.showTime} onChange={handleChange} type="time" tooltipText="Hora d'inici de la funció o acte principal."/>
        <TechSheetField id="showDuration" label="DURADA ESPECTACLE:" value={formData.showDuration} onChange={handleChange} placeholder="XX min" tooltipText="Durada aproximada de l'espectacle en minuts."/>

        {eventFrame.generalNotes && (
            <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes Generals de l'Esdeveniment (No editable)</label>
                <div className="mt-1 p-2 w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {eventFrame.generalNotes}
                </div>
            </div>
        )}

        <div className="col-span-full">
            <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes Generals de la Fitxa Tècnica</label>
                <Tooltip text="Marca aquesta casella per incloure les notes generals en exportar la fitxa a PDF.">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="showGeneralNotesInPdf" name="showGeneralNotesInPdf" checked={formData.showGeneralNotesInPdf || false} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                        <label htmlFor="showGeneralNotesInPdf" className="text-sm font-medium text-gray-700 dark:text-gray-300">Imprimir al PDF</label>
                    </div>
                </Tooltip>
            </div>
            <Tooltip text="Afegeix aquí qualsevol nota general o comentari rellevant per a tota la fitxa.">
                <AutosizeTextarea
                    id="generalNotes"
                    name="generalNotes"
                    value={formData.generalNotes || ''}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder=".... Aquí les notes generals de la fitxa tècnica, ( amb selector de impresió si/no)"
                />
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
      <TechSheetSection
        title="Personal Tècnic"
        layout="single-column"
        isOpen={expandedSections.personnel}
        onToggle={() => handleToggleSection('personnel')}
      >
        <TechnicalPersonnelSection
          formData={formData}
          technicalProviders={formData.technicalProviders || []}
          peopleGroups={peopleGroups}
          eventFrame={eventFrame}
          onProviderChange={handleProviderChange}
          onRoleChange={handleRoleChange}
          onFieldChange={handleFieldChange}
          onAddProvider={handleAddProvider}
          onRemoveProvider={handleRemoveProvider}
          onAddRole={handleAddRole}
          onRemoveRole={handleRemoveRole}
          getPersonGroupById={(id: string) => ({ id, name: peopleMap.get(id) || 'Desconegut' })}
          showToast={showToast}
          onConfirmUpdate={handleConfirmUpdateFromAssignments}
          onDragEnd={handleDragEnd}
        />
      </TechSheetSection>

      {/* Pre-assembly */}
      <TechSheetSection
        title="Premuntatge"
        isOpen={expandedSections.preAssembly}
        onToggle={() => handleToggleSection('preAssembly')}
      >
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
      <TechSheetSection
        title="Horaris"
        isOpen={expandedSections.schedule}
        onToggle={() => handleToggleSection('schedule')}
      >
        <ConditionalFormControl
          label="HORARIS:"
          status={formData.schedule?.status || 'unset'}
          onStatusChange={(status) => handleConditionalChange('schedule', { status })}
          tooltipText="Activa aquesta secció per detallar la planificació horària de l'esdeveniment."
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-grow pr-4">
              <TechSheetField
                id="scheduleDetails"
                label="Notes generals dels horaris:"
                value={formData.schedule?.details || ''}
                onChange={(e) => handleConditionalChange('schedule', { details: e.target.value })}
                as="textarea"
                rows={2}
                placeholder="Afegeix aquí notes generals sobre la planificació, com ara pauses, hores de menjars, etc."
                tooltipText="Aquestes notes s'apliquen a tota la secció d'horaris."
              />
            </div>
            <div className="flex-shrink-0">
              <Tooltip text={`Ordena els blocs de dies per data ${scheduleSortOrder === 'asc' ? 'descendent' : 'ascendent'}`}>
                <button
                  type="button"
                  onClick={handleSortScheduleByDate}
                  className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 no-print"
                >
                  Ordenar Dies ({scheduleSortOrder === 'asc' ? 'ASC' : 'DESC'})
                </button>
              </Tooltip>
            </div>
          </div>

          <div className="col-span-full space-y-4 mt-2">
            {Object.entries(
              (formData.schedule?.data || []).reduce((acc, item) => {
                const date = item.date || 'Sense data';
                if (!acc[date]) {
                  acc[date] = [];
                }
                acc[date].push(item);
                return acc;
              }, {} as Record<string, AssemblyScheduleItem[]>)
            ).map(([date, items]) => (
              <div key={date} className="p-3 border rounded-md bg-gray-50 dark:bg-gray-700/50">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                    {date === 'Sense data' ? 'Elements nous - Assignar data' : `Data: ${formatDateDMY(date)}`}
                  </h4>
                  {date !== 'Sense data' && (
                    <div className="flex items-center gap-2">
                      {items.length > 1 && (
                        <Tooltip text="Ordenar les entrades d'aquest dia per hora">
                          <button type="button" onClick={() => handleSortScheduleByTime(date)} className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-xs rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 no-print">Ordenar per Hora</button>
                        </Tooltip>
                      )}
                      <Tooltip text={`Afegir una nova línia d'horari per al ${formatDateDMY(date)}`}>
                        <button type="button" onClick={() => handleAddAssemblyScheduleItem(date)} className="add-item-button px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">+ Afegir Horari</button>
                      </Tooltip>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {/* The .map function iterates over `items`, which is an array of schedule entries grouped by a specific day. */}
                  {/* Therefore, `index` refers to the item's position *within its day group*, not the overall schedule array. */}
                  {/* This makes the `disabled` logic for the move buttons correct. */}
                  {items.map((item, index) => {
                    return (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-3">
                          <TechSheetField id={`schedule-date-${item.id}`} label={index === 0 ? "Data" : ""} value={item.date} onChange={(e) => handleAssemblyScheduleChange(item.id, 'date', e.target.value)} type="date" tooltipText="Modifica la data de la tasca. Si canvies la data, la tasca es mourà al bloc del dia corresponent."/>
                        </div>
                        <div className="col-span-2">
                          <TechSheetField id={`schedule-time-${item.id}`} label={index === 0 ? "Hora Inici" : ""} value={item.time} onChange={(e) => handleAssemblyScheduleChange(item.id, 'time', e.target.value)} type="time" tooltipText="Hora d'inici de l'activitat."/>
                        </div>
                        <div className="col-span-2">
                          <TechSheetField id={`schedule-time-end-${item.id}`} label={index === 0 ? "Hora Fi" : ""} value={item.timeEnd || ''} onChange={(e) => handleAssemblyScheduleChange(item.id, 'timeEnd', e.target.value)} type="time" tooltipText="Hora de finalització de l'activitat (opcional)."/>
                        </div>
                        <div className="col-span-4">
                          <TechSheetField id={`schedule-desc-${item.id}`} label={index === 0 ? "Descripció" : ""} value={item.description} onChange={(e) => handleAssemblyScheduleChange(item.id, 'description', e.target.value)} as="textarea" rows={1} tooltipText="Descripció de l'activitat (p. ex., 'Muntatge llums', 'Prova de so')."/>
                        </div>
                        <div className="col-span-1 flex-shrink-0 self-center pt-5 flex items-center justify-center space-x-1">
                          <Tooltip text="Moure amunt">
                            <button
                              type="button"
                              onClick={() => handleMoveAssemblyScheduleItemUp(item.id)}
                              disabled={index === 0}
                              className="text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full w-7 h-7 flex items-center justify-center text-xl font-bold no-print disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              &#x25B2;
                            </button>
                          </Tooltip>
                          <Tooltip text="Moure avall">
                            <button
                              type="button"
                              onClick={() => handleMoveAssemblyScheduleItemDown(item.id)}
                              disabled={index === items.length - 1}
                              className="text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full w-7 h-7 flex items-center justify-center text-xl font-bold no-print disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              &#x25BC;
                            </button>
                          </Tooltip>
                          <Tooltip text="Eliminar aquesta línia d'horari">
                            <button type="button" onClick={() => handleRemoveAssemblyScheduleItem(item.id)} className="remove-item-button text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold no-print">×</button>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="mt-4 no-print">
              <Tooltip text="Afegeix una nova entrada a l'horari amb la data d'inici de l'esdeveniment. Podràs modificar la data posteriorment.">
                <button type="button" onClick={() => handleAddAssemblyScheduleItem()} className="add-item-button px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">+ Afegir Nova Data</button>
              </Tooltip>
            </div>
          </div>
        </ConditionalFormControl>
      </TechSheetSection>

      {/* Logistics */}
      <TechSheetSection
        title="Logística"
        layout="single-column"
        isOpen={expandedSections.logistics}
        onToggle={() => handleToggleSection('logistics')}
      >
        <ConditionalFormControl
          label="CAMERINOS / SALES DE PREPARACIÓ:"
          status={formData.dressingRooms?.status || 'unset'}
          onStatusChange={(status) => handleConditionalChange('dressingRooms', { status, details: formData.dressingRooms?.details || '' })}
          tooltipText="Indica si es necessiten camerinos."
        >
          <TechSheetField
            id="dressingRoomsDetails"
            label="Detalls dels camerinos / sales:"
            value={formData.dressingRooms?.details || ''}
            onChange={(e) => handleConditionalChange('dressingRooms', { details: e.target.value })}
            as="textarea"
            rows={2}
            placeholder="Especifica les necessitats de camerinos: quantitat, tipus (individuals, col·lectius), i qualsevol requeriment especial."
            tooltipText="Descriu les necessitats específiques dels camerinos."
          />
        </ConditionalFormControl>

        <ConditionalFormControl
          label="INTÈRPRETS / PONENTS:"
          status={formData.actorsInfo?.status || 'unset'}
          onStatusChange={(status) => handleConditionalChange('actorsInfo', { status, data: formData.actorsInfo?.data || { number: 0, names: '' } })}
          tooltipText="Indica si hi ha actors o artistes."
        >
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nº:</label>
              <Tooltip text="Nombre total d'actors o artistes que participen.">
                <input
                  type="number"
                  value={formData.actorsInfo?.data?.number || ''}
                  onChange={(e) => handleConditionalChange('actorsInfo', { data: { ...(formData.actorsInfo?.data || { number: 0, names: '' }), number: e.target.value } })}
                  className="mt-1 block w-24 pl-3 pr-1 py-0.5 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  min="0"
                />
              </Tooltip>
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Noms / Notes:</label>
              <Tooltip text="Llista els noms dels actors o artistes i qualsevol nota rellevant.">
                <AutosizeTextarea
                  value={formData.actorsInfo?.data?.names || ''}
                  onChange={(e) => handleConditionalChange('actorsInfo', { data: { ...(formData.actorsInfo?.data || { number: 0, names: '' }), names: e.target.value } })}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                  placeholder="Detalls, notes, noms..."
                />
              </Tooltip>
            </div>
          </div>
        </ConditionalFormControl>

        <ConditionalFormControl
          label="PERSONAL TÈCNIC/PRODUCCIÓ (CLIENT / ARTISTA / GRUP):"
          status={formData.techniciansInfo?.status || 'unset'}
          onStatusChange={(status) => handleConditionalChange('techniciansInfo', { status, data: formData.techniciansInfo?.data || { number: 0, names: '' } })}
          tooltipText="Indica si hi ha personal tècnic o de producció de la companyia."
        >
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nº:</label>
              <Tooltip text="Nombre total de personal tècnic o de producció de la companyia.">
                <input
                  type="number"
                  value={formData.techniciansInfo?.data?.number || ''}
                  onChange={(e) => handleConditionalChange('techniciansInfo', { data: { ...(formData.techniciansInfo?.data || { number: 0, names: '' }), number: e.target.value } })}
                  className="mt-1 block w-24 pl-3 pr-1 py-0.5 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  min="0"
                />
              </Tooltip>
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Noms / Notes:</label>
              <Tooltip text="Llista els noms del personal i qualsevol nota rellevant.">
                <AutosizeTextarea
                  value={formData.techniciansInfo?.data?.names || ''}
                  onChange={(e) => handleConditionalChange('techniciansInfo', { data: { ...(formData.techniciansInfo?.data || { number: 0, names: '' }), names: e.target.value } })}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                  placeholder="Detalls, notes, noms..."
                />
              </Tooltip>
            </div>
          </div>
        </ConditionalFormControl>
      </TechSheetSection>

      {/* Technical Needs */}
      <TechSheetSection
        title="Necessitats Tècniques"
        isOpen={expandedSections.technicalNeeds}
        onToggle={() => handleToggleSection('technicalNeeds')}
      >
        <div className="col-span-full mb-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
                <label htmlFor="technicalNeedsNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes Generals de Necessitats Tècniques
                </label>
                <div className="flex items-center">
                    <input
                        id="showTechnicalNeedsNotesInPdf"
                        name="showTechnicalNeedsNotesInPdf"
                        type="checkbox"
                        checked={formData.showTechnicalNeedsNotesInPdf ?? true}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="showTechnicalNeedsNotesInPdf" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
                        Mostrar al PDF
                    </label>
                </div>
            </div>
            <AutosizeTextarea
                id="technicalNeedsNotes"
                name="technicalNeedsNotes"
                value={formData.technicalNeedsNotes || ''}
                onChange={handleChange}
                placeholder="Afegeix notes addicionals sobre les necessitats tècniques en general..."
                className="w-full"
            />
        </div>
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
      <TechSheetSection
        title="Altres Detalls"
        isOpen={expandedSections.otherDetails}
        onToggle={() => handleToggleSection('otherDetails')}
      >
        <TechSheetField id="controlLocation" label="CONTROL A:" value={formData.controlLocation || ''} onChange={handleChange} placeholder="Cabina, Platea, a 20 metres del escenari, sota el garrofer..." tooltipText="Ubicació del control tècnic (so, llums, etc.). Per exemple: 'Cabina fons platea'."/>
        <TechSheetField id="blueprints" label="PLÀNOLS:" value={formData.blueprints || ''} onChange={handleChange} as="textarea" rows={3} placeholder="Adjunts, link dels plànols, in situ...." tooltipText="Enllaços o referències als plànols tècnics de l'esdeveniment (escenari, llums, etc.)."/>
      </TechSheetSection>

      {/* Contacts & Observations */}
      <TechSheetSection
        title="Contacte i Observacions"
        isOpen={expandedSections.contactsObservations}
        onToggle={() => handleToggleSection('contactsObservations')}
      >
        <div className="col-span-full space-y-3">
          <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">CONTACTES (CLIENT / ARTISTA / GRUP):</h4>
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
