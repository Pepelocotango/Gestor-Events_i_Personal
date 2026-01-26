import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useEventDataStore } from '../../stores/eventDataStore';
import { EventFrame, TechSheetData, TechSheetProvider, TechSheetRoleItem, ContactPerson, ConditionalSection, AssemblyScheduleItem, NeedItem, ConditionalStatus, AssignmentStatus, ShowToastFunction } from '../../types';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import TechSheetSection from './TechSheetSection';
import TechSheetField from './TechSheetField';
import { formatDateDMY } from '../../utils/dateFormat';
import { generateTechSheetPdfObject, exportTechSheetToPdf } from '../../utils/pdfGenerator';
import TechnicalPersonnelSection from './TechnicalPersonnelSection';
import NeedsList from './NeedsList';
import Tooltip from '../ui/Tooltip';
import ConditionalFormControl from './ConditionalFormControl';
import { EyeIcon } from '../../constants';
import { useModalStore } from '../../stores/modalStore';

interface TechSheetFormProps {
  eventFrame: EventFrame;
  showToast: ShowToastFunction;
  availabilityMap: Map<string, { available: number; total: number }>;
}

const TechSheetForm: React.FC<TechSheetFormProps> = ({ eventFrame, showToast, availabilityMap }) => {
  const { t } = useTranslation();
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

  const handleToggleAllSections = () => {
    const areAllExpanded = sectionKeys.every(key => expandedSections[key]);
    if (areAllExpanded) {
      collapseAll();
    } else {
      expandAll();
    }
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
        showToast(t('tech_sheets.form.manual_save_success'), 'success');
      }
      isDirtyRef.current = false;
    }
  }, [addOrUpdateTechSheet, eventFrame.id, showToast, t]);

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
  }, [eventFrame.techSheet?.technicalProviders, formData.technicalProviders]); // S'executa cada cop que els proveïdors a la store canvien

  if (!formData) {
    return <div>{t('tech_sheets.form.loading_data')}</div>;
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

      return { ...prev, schedule: { ...(prev.schedule || { status: 'unset', details: '' }), data: newSchedule } };
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

      return { ...prev, schedule: { ...(prev.schedule || { status: 'unset', details: '' }), data: newSchedule } };
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
      const currentField = prev[fieldName] as ConditionalSection<any> || { status: 'unset', details: '' };
      const updatedField = { ...currentField, ...fieldValue };

      // INICI DE LA CORRECCIÓ
      if ('status' in fieldValue && (fieldValue.status === 'no' || fieldValue.status === 'unset')) {
        if (updatedField.data) {
          // CORRECCIÓ: Creem un nou objecte 'data' en lloc de mutar l'existent.
          // Això soluciona l'error amb la propietat 'needs'.
          updatedField.data = { ...updatedField.data, needs: [] };
        }
        // La lògica per a 'schedule' ja era correcta, però la mantenim per consistència.
        if (fieldName === 'schedule' && updatedField.data) {
          updatedField.data = [];
        }
      }
      // FI DE LA CORRECCIÓ

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
        const cleanValue = value.split(' [')[0];
        (currentItem as any)[field] = cleanValue;
        const matchedItem = materialItems.find(item => item.name === cleanValue);
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

      return { ...prev, schedule: { ...(prev.schedule || { status: 'unset', details: '' }), data: newSchedule } };
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

      return { ...prev, schedule: { ...(prev.schedule || { status: 'unset', details: '' }), data: newSchedule } };
    });
    markAsDirty();
  };

  const handleRemoveAssemblyScheduleItem = (id: string) => {
    setFormData(prev => {
      const newSchedule = (prev.schedule?.data || []).filter(item => item.id !== id);
      return { ...prev, schedule: { ...(prev.schedule || { status: 'unset', details: '' }), data: newSchedule } };
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

  const handleShowTimeChange = (index: number, value: string) => {
    setFormData(prev => {
      const newShowTimes = [...(prev.showTimes || [])];
      // Si l'array és buit i l'usuari escriu, es crea el primer element.
      if (newShowTimes.length === 0 && index === 0) {
        newShowTimes.push({ id: generateLocalId(), time: value });
      } else if (newShowTimes[index]) {
        newShowTimes[index] = { ...newShowTimes[index], time: value };
      }
      return { ...prev, showTimes: newShowTimes };
    });
    markAsDirty();
  };

  const addShowTime = () => {
    const newItem = { id: generateLocalId(), time: '' };
    setFormData(prev => ({
      ...prev,
      showTimes: [...(prev.showTimes || []), newItem],
    }));
    markAsDirty();
  };

  const removeShowTime = (id: string) => {
    setFormData(prev => ({
      ...prev,
      showTimes: (prev.showTimes || []).filter(item => item.id !== id),
    }));
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
      showToast(t('tech_sheets.form.manual_save_info'), 'info');
    }
  };

  const openModal = useModalStore(state => state.openModal);

  const handlePreview = () => {
    // No cal desar els canvis, ja que volem una previsualització WYSIWYG
    const doc = generateTechSheetPdfObject(formData, (id: string) => ({ id, name: peopleMap.get(id) || t('tech_sheets.personnel.unknown') }));
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob) + '#toolbar=0&navpanes=0&view=FitH';
    openModal('pdfPreview', {
      pdfUrl,
      titleOverride: t('modals.pdf_preview.title_override', { name: eventFrame.name }),
      onSave: () => handleExportToPdf() // Reutilitzem la funció d'exportació existent que ja funciona bé
    });
  };

  const handleExportToPdf = () => {
    if (isDirtyRef.current) {
      showToast(t('tech_sheets.form.saving_pending_before_export'), 'info');
      saveData(true);
    }
    exportTechSheetToPdf(formData, eventFrame.name, (id: string) => ({ id, name: peopleMap.get(id) || t('tech_sheets.personnel.unknown') }), showToast);
  };

  const handleConfirmUpdateFromAssignments = (selectedChanges?: any[]) => {
    if (!selectedChanges || selectedChanges.length === 0) {
      showToast(t('tech_sheets.personnel.no_changes_toast'), 'info');
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
            const daysString = `${t('common.days')}: ${confirmedDays.join(', ')}`;
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
    showToast(t('tech_sheets.personnel.changes_applied_toast', { count: selectedChanges.length }), 'success');
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
        label={t('tech_sheets.needs.field_labels.details_prefix', { title: title.toLowerCase() })}
        value={formData[fieldName]?.details || ''}
        onChange={(e) => handleConditionalChange(fieldName, { details: e.target.value })}
        as="textarea"
        rows={2}
      />
      <NeedsList
        needs={formData[fieldName]?.data?.needs || []}
        title={t('tech_sheets.needs.field_labels.material_prefix', { title: title.toLowerCase() })}
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
        availabilityMap={availabilityMap}
      />
    </ConditionalFormControl>
  );

  return (
    <div className="p-2 bg-background rounded-lg shadow space-y-4 tech-sheet-form-container">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Tooltip text={t('tech_sheets.form.tooltip_double_click')}>
          <h2
            className="text-xl font-bold text-foreground"
            onDoubleClick={handleToggleAllSections}
            style={{ cursor: 'pointer' }}
          >
            {t('tech_sheets.form.title', { name: '' })} <span className="text-primary">{eventFrame.name}</span>
          </h2>
        </Tooltip>
        <div className="flex items-center gap-2">
          <Tooltip text={t('tech_sheets.form.tooltip_expand_all')}>
            <button onClick={expandAll} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md hover:bg-accent no-print">{t('tech_sheets.form.expand_all')}</button>
          </Tooltip>
          <Tooltip text={t('tech_sheets.form.tooltip_collapse_all')}>
            <button onClick={collapseAll} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md hover:bg-accent no-print">{t('tech_sheets.form.collapse_all')}</button>
          </Tooltip>
          <Tooltip text={t('tech_sheets.form.tooltip_save')}>
            <button onClick={handleManualSave} className="save-changes-button px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-semibold no-print">{t('tech_sheets.form.save_changes')}</button>
          </Tooltip>
          <Tooltip text={t('tech_sheets.form.tooltip_preview')}>
            <button onClick={handlePreview} className="preview-pdf-button px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 font-semibold no-print flex items-center gap-2">
              <EyeIcon className="h-4 w-4" />
              <span>{t('tech_sheets.form.preview')}</span>
            </button>
          </Tooltip>
          <Tooltip text={t('tech_sheets.form.tooltip_export')}>
            <button onClick={handleExportToPdf} className="export-pdf-button px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-semibold no-print">{t('tech_sheets.form.export_pdf')}</button>
          </Tooltip>
        </div>
      </div>
      <div className="mt-1">
        <p className="text-sm text-muted-foreground">{t('tech_sheets.form.subtitle')}</p>
      </div>

      {/* General Info */}
      <TechSheetSection
        title={t('tech_sheets.form.sections.general')}
        layout="grid-2"
        isOpen={expandedSections.general}
        onToggle={() => handleToggleSection('general')}
      >
        <TechSheetField id="eventName" label={t('tech_sheets.form.general.event_name')} value={formData.eventName} onChange={handleChange} required tooltipText={t('tech_sheets.form.general.event_name_tooltip')} />
        <TechSheetField id="location" label={t('tech_sheets.form.general.location')} value={formData.location} onChange={handleChange} tooltipText={t('tech_sheets.form.general.location_tooltip')} />
        <TechSheetField id="date" label={t('tech_sheets.form.general.date')} value={formData.date} onChange={handleChange} tooltipText={t('tech_sheets.form.general.date_tooltip')} />

        {/* HORA / GESTIÓ DE SESSIONS */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-muted-foreground mb-1">{t('tech_sheets.form.general.time')}</label>
          {(formData.showTimes?.length || 0) <= 1 ? (
            <div className="flex items-center gap-2">
              <TechSheetField
                id="showTime-0"
                label=""
                value={formData.showTimes?.[0]?.time || ''}
                onChange={(e) => handleShowTimeChange(0, e.target.value)}
                type="time"
                tooltipText={t('tech_sheets.form.general.time_tooltip')}
              />
              <Tooltip text={t('tech_sheets.form.general.add_session_tooltip')}>
                <button type="button" onClick={addShowTime} className="add-item-button px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-xs">{t('tech_sheets.form.general.add_session')}</button>
              </Tooltip>
            </div>
          ) : (
            <div className="space-y-2">
              {formData.showTimes?.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <TechSheetField
                    id={`showTime-${index}`}
                    label=""
                    value={item.time}
                    onChange={(e) => handleShowTimeChange(index, e.target.value)}
                    type="time"
                  />
                  <Tooltip text={t('tech_sheets.form.general.remove_session_tooltip')}>
                    <button type="button" onClick={() => removeShowTime(item.id)} className="remove-item-button text-destructive hover:bg-destructive/10 rounded-full w-7 h-7 flex items-center justify-center text-xl font-bold no-print">×</button>
                  </Tooltip>
                </div>
              ))}
              <Tooltip text={t('tech_sheets.form.general.add_session_tooltip')}>
                <button type="button" onClick={addShowTime} className="add-item-button px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-xs">{t('tech_sheets.form.general.add_session')}</button>
              </Tooltip>
            </div>
          )}
        </div>

        <TechSheetField id="showDuration" label={t('tech_sheets.form.general.duration')} value={formData.showDuration} onChange={handleChange} placeholder={t('tech_sheets.form.general.duration_placeholder')} tooltipText={t('tech_sheets.form.general.duration_tooltip')} />

        {eventFrame.generalNotes && (
          <div className="col-span-full">
            <label className="block text-sm font-medium text-muted-foreground">{t('tech_sheets.form.general.event_notes_readonly')}</label>
            <div className="mt-1 p-2 w-full bg-muted border border-border rounded-md shadow-sm text-sm text-muted-foreground whitespace-pre-wrap">
              {eventFrame.generalNotes}
            </div>
          </div>
        )}

        <div className="col-span-full">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="generalNotes" className="block text-sm font-medium text-muted-foreground">{t('tech_sheets.form.general.tech_sheet_notes')}</label>
            <Tooltip text={t('tech_sheets.form.general.print_notes_tooltip')}>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="showGeneralNotesInPdf" name="showGeneralNotesInPdf" checked={formData.showGeneralNotesInPdf || false} onChange={handleChange} className="h-4 w-4 rounded border-border accent-primary focus:ring-ring" />
                <label htmlFor="showGeneralNotesInPdf" className="text-sm font-medium text-foreground">{t('tech_sheets.form.general.print_in_pdf')}</label>
              </div>
            </Tooltip>
          </div>
          <TechSheetField
            id="generalNotes"
            label=""
            value={formData.generalNotes || ''}
            onChange={handleChange}
            as="textarea"
            rows={3}
            placeholder={t('tech_sheets.form.general.notes_placeholder')}
            tooltipText={t('tech_sheets.form.general.notes_tooltip')}
          />
        </div>
        <div className="col-span-full -mb-3">
          <ConditionalFormControl
            label={t('tech_sheets.form.general.parking')}
            status={formData.parking?.status || 'unset'}
            onStatusChange={(status) => handleConditionalChange('parking', { status })}
            tooltipText={t('tech_sheets.form.general.parking_tooltip')}
          >
            <TechSheetField
              id="parkingDetails"
              label={t('tech_sheets.form.general.parking_details')}
              value={formData.parking?.details || ''}
              onChange={(e) => handleConditionalChange('parking', { details: e.target.value })}
              as="textarea"
              rows={2}
              placeholder={t('tech_sheets.form.general.parking_details_placeholder')}
              tooltipText={t('tech_sheets.form.general.parking_details_tooltip')}
            />
          </ConditionalFormControl>
        </div>
      </TechSheetSection>

      {/* Personnel */}
      <TechSheetSection
        title={t('tech_sheets.form.sections.personnel')}
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
          getPersonGroupById={(id: string) => ({ id, name: peopleMap.get(id) || t('tech_sheets.personnel.unknown') })}
          showToast={showToast}
          onConfirmUpdate={handleConfirmUpdateFromAssignments}
          onDragEnd={handleDragEnd}
        />
      </TechSheetSection>

      {/* Pre-assembly */}
      <TechSheetSection
        title={t('tech_sheets.form.sections.pre_assembly')}
        isOpen={expandedSections.preAssembly}
        onToggle={() => handleToggleSection('preAssembly')}
      >
        <ConditionalFormControl
          label={t('tech_sheets.form.pre_assembly.label')}
          status={formData.preAssembly?.status || 'unset'}
          onStatusChange={(status) => handleConditionalChange('preAssembly', { status })}
          tooltipText={t('tech_sheets.form.pre_assembly.tooltip')}
        >
          <TechSheetField
            id="preAssemblyDetails"
            label={t('tech_sheets.form.pre_assembly.details_label')}
            value={formData.preAssembly?.details || ''}
            onChange={(e) => handleConditionalChange('preAssembly', { details: e.target.value })}
            as="textarea"
            rows={2}
            placeholder={t('tech_sheets.form.pre_assembly.details_placeholder')}
            tooltipText={t('tech_sheets.form.pre_assembly.details_tooltip')}
          />
        </ConditionalFormControl>
      </TechSheetSection>

      {/* Schedule */}
      <TechSheetSection
        title={t('tech_sheets.form.sections.schedule')}
        isOpen={expandedSections.schedule}
        onToggle={() => handleToggleSection('schedule')}
      >
        <ConditionalFormControl
          label={t('tech_sheets.form.schedule.label')}
          status={formData.schedule?.status || 'unset'}
          onStatusChange={(status) => handleConditionalChange('schedule', { status })}
          tooltipText={t('tech_sheets.form.schedule.tooltip')}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-grow pr-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-muted-foreground">{t('tech_sheets.form.schedule.notes_label')}</label>
                <Tooltip text={t('tech_sheets.form.schedule.print_tooltip')}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showScheduleNotesInPdf"
                      name="showScheduleNotesInPdf"
                      checked={formData.showScheduleNotesInPdf ?? true}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-border accent-primary focus:ring-ring"
                    />
                    <label htmlFor="showScheduleNotesInPdf" className="text-sm font-medium text-foreground">{t('tech_sheets.form.general.print_in_pdf')}</label>
                  </div>
                </Tooltip>
              </div>
              <TechSheetField
                id="scheduleDetails"
                label=""
                value={formData.schedule?.details || ''}
                onChange={(e) => handleConditionalChange('schedule', { details: e.target.value })}
                as="textarea"
                rows={2}
                placeholder={t('tech_sheets.form.schedule.notes_placeholder')}
                tooltipText={t('tech_sheets.form.schedule.notes_tooltip')}
              />
            </div>
            <div className="flex-shrink-0 pt-7">
              <Tooltip text={t('tech_sheets.form.schedule.sort_days_tooltip', { nextOrder: scheduleSortOrder === 'asc' ? t('common.descending') : t('common.ascending') })}>
                <button
                  type="button"
                  onClick={handleSortScheduleByDate}
                  className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-md hover:bg-primary/90 no-print"
                >
                  {t('tech_sheets.form.schedule.sort_days', { order: scheduleSortOrder === 'asc' ? 'ASC' : 'DESC' })}
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
              <div key={date} className="p-3 border rounded-md bg-muted/50 border-border">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-foreground">
                    {date === 'Sense data' ? t('tech_sheets.form.schedule.no_date_header') : t('tech_sheets.form.schedule.date_header', { date: formatDateDMY(date) })}
                  </h4>
                  {date !== 'Sense data' && (
                    <div className="flex items-center gap-2">
                      {items.length > 1 && (
                        <Tooltip text={t('tech_sheets.form.schedule.sort_by_time_tooltip')}>
                          <button type="button" onClick={() => handleSortScheduleByTime(date)} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md hover:bg-accent no-print">{t('tech_sheets.form.schedule.sort_by_time')}</button>
                        </Tooltip>
                      )}
                      <Tooltip text={t('tech_sheets.form.schedule.add_item_tooltip', { date: formatDateDMY(date) })}>
                        <button type="button" onClick={() => handleAddAssemblyScheduleItem(date)} className="add-item-button px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-xs">{t('tech_sheets.form.schedule.add_item', { date: '' })}</button>
                      </Tooltip>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => {
                    return (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-3">
                          <TechSheetField id={`schedule-date-${item.id}`} label={index === 0 ? t('tech_sheets.form.schedule.field_date') : ""} value={item.date} onChange={(e) => handleAssemblyScheduleChange(item.id, 'date', e.target.value)} type="date" tooltipText={t('tech_sheets.form.schedule.field_date_tooltip')} />
                        </div>
                        <div className="col-span-2">
                          <TechSheetField id={`schedule-time-${item.id}`} label={index === 0 ? t('tech_sheets.form.schedule.field_start') : ""} value={item.time} onChange={(e) => handleAssemblyScheduleChange(item.id, 'time', e.target.value)} type="time" tooltipText={t('tech_sheets.form.schedule.field_start_tooltip')} />
                        </div>
                        <div className="col-span-2">
                          <TechSheetField id={`schedule-time-end-${item.id}`} label={index === 0 ? t('tech_sheets.form.schedule.field_end') : ""} value={item.timeEnd || ''} onChange={(e) => handleAssemblyScheduleChange(item.id, 'timeEnd', e.target.value)} type="time" tooltipText={t('tech_sheets.form.schedule.field_end_tooltip')} />
                        </div>
                        <div className="col-span-4">
                          <TechSheetField id={`schedule-desc-${item.id}`} label={index === 0 ? t('tech_sheets.form.schedule.field_desc') : ""} value={item.description} onChange={(e) => handleAssemblyScheduleChange(item.id, 'description', e.target.value)} as="textarea" rows={1} tooltipText={t('tech_sheets.form.schedule.field_desc_tooltip')} />
                        </div>
                        <div className="col-span-1 flex-shrink-0 self-center pt-5 flex items-center justify-center space-x-1">
                          <Tooltip text={t('tech_sheets.form.schedule.move_up_tooltip')}>
                            <button
                              type="button"
                              onClick={() => handleMoveAssemblyScheduleItemUp(item.id)}
                              disabled={index === 0}
                              className="text-muted-foreground hover:bg-accent rounded-full w-7 h-7 flex items-center justify-center text-xl font-bold no-print disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              &#x25B2;
                            </button>
                          </Tooltip>
                          <Tooltip text={t('tech_sheets.form.schedule.move_down_tooltip')}>
                            <button
                              type="button"
                              onClick={() => handleMoveAssemblyScheduleItemDown(item.id)}
                              disabled={index === items.length - 1}
                              className="text-muted-foreground hover:bg-accent rounded-full w-7 h-7 flex items-center justify-center text-xl font-bold no-print disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              &#x25BC;
                            </button>
                          </Tooltip>
                          <Tooltip text={t('tech_sheets.form.schedule.remove_item_tooltip')}>
                            <button type="button" onClick={() => handleRemoveAssemblyScheduleItem(item.id)} className="remove-item-button text-destructive hover:bg-destructive/10 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold no-print">×</button>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="mt-4 no-print">
              <Tooltip text={t('tech_sheets.form.schedule.add_new_date_tooltip')}>
                <button type="button" onClick={() => handleAddAssemblyScheduleItem()} className="add-item-button px-3 py-1 bg-success text-success-foreground rounded-md hover:bg-success/90 text-sm">{t('tech_sheets.form.schedule.add_new_date')}</button>
              </Tooltip>
            </div>
          </div>
        </ConditionalFormControl>
      </TechSheetSection>

      {/* Logistics */}
      <TechSheetSection
        title={t('tech_sheets.form.sections.logistics')}
        layout="single-column"
        isOpen={expandedSections.logistics}
        onToggle={() => handleToggleSection('logistics')}
      >
        <ConditionalFormControl
          label={t('tech_sheets.form.logistics.dressing_rooms')}
          status={formData.dressingRooms?.status || 'unset'}
          onStatusChange={(status) => handleConditionalChange('dressingRooms', { status, details: formData.dressingRooms?.details || '' })}
          tooltipText={t('tech_sheets.form.logistics.dressing_rooms_tooltip')}
        >
          <TechSheetField
            id="dressingRoomsDetails"
            label={t('tech_sheets.form.logistics.dressing_rooms_details')}
            value={formData.dressingRooms?.details || ''}
            onChange={(e) => handleConditionalChange('dressingRooms', { details: e.target.value })}
            as="textarea"
            rows={2}
            placeholder={t('tech_sheets.form.logistics.dressing_rooms_placeholder')}
            tooltipText={t('tech_sheets.form.logistics.dressing_rooms_details_tooltip')}
          />
        </ConditionalFormControl>

        <ConditionalFormControl
          label={t('tech_sheets.form.logistics.actors')}
          status={formData.actorsInfo?.status || 'unset'}
          onStatusChange={(status) => handleConditionalChange('actorsInfo', { status, data: formData.actorsInfo?.data || { number: 0, names: '' } })}
          tooltipText={t('tech_sheets.form.logistics.actors_tooltip')}
        >
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <TechSheetField
                id="actorsInfo-number"
                label={t('tech_sheets.form.logistics.count_label')}
                type="number"
                value={formData.actorsInfo?.data?.number || ''}
                onChange={(e) => handleConditionalChange('actorsInfo', { data: { ...(formData.actorsInfo?.data || { number: 0, names: '' }), number: parseInt(e.target.value, 10) || 0 } })}
                className="w-24"
                tooltipText={t('tech_sheets.form.logistics.count_tooltip')}
              />
            </div>
            <div className="col-span-3">
              <TechSheetField
                id="actorsInfo-names"
                label={t('tech_sheets.form.logistics.names_label')}
                value={formData.actorsInfo?.data?.names || ''}
                onChange={(e) => handleConditionalChange('actorsInfo', { data: { ...(formData.actorsInfo?.data || { number: 0, names: '' }), names: e.target.value } })}
                as="textarea"
                rows={2}
                placeholder={t('tech_sheets.form.logistics.names_placeholder')}
                tooltipText={t('tech_sheets.form.logistics.names_tooltip')}
              />
            </div>
          </div>
        </ConditionalFormControl>

        <ConditionalFormControl
          label={t('tech_sheets.form.logistics.technicians')}
          status={formData.techniciansInfo?.status || 'unset'}
          onStatusChange={(status) => handleConditionalChange('techniciansInfo', { status, data: formData.techniciansInfo?.data || { number: 0, names: '' } })}
          tooltipText={t('tech_sheets.form.logistics.technicians_tooltip')}
        >
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <TechSheetField
                id="techniciansInfo-number"
                label={t('tech_sheets.form.logistics.count_label')}
                type="number"
                value={formData.techniciansInfo?.data?.number || ''}
                onChange={(e) => handleConditionalChange('techniciansInfo', { data: { ...(formData.techniciansInfo?.data || { number: 0, names: '' }), number: parseInt(e.target.value, 10) || 0 } })}
                className="w-24"
                tooltipText={t('tech_sheets.form.logistics.technicians_count_tooltip')}
              />
            </div>
            <div className="col-span-3">
              <TechSheetField
                id="techniciansInfo-names"
                label={t('tech_sheets.form.logistics.names_label')}
                value={formData.techniciansInfo?.data?.names || ''}
                onChange={(e) => handleConditionalChange('techniciansInfo', { data: { ...(formData.techniciansInfo?.data || { number: 0, names: '' }), names: e.target.value } })}
                as="textarea"
                rows={2}
                placeholder={t('tech_sheets.form.logistics.names_placeholder')}
                tooltipText={t('tech_sheets.form.logistics.technicians_names_tooltip')}
              />
            </div>
          </div>
        </ConditionalFormControl>
      </TechSheetSection>

      {/* Technical Needs */}
      <TechSheetSection
        title={t('tech_sheets.form.sections.technical_needs')}
        isOpen={expandedSections.technicalNeeds}
        onToggle={() => handleToggleSection('technicalNeeds')}
      >
        <div className="col-span-full">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-muted-foreground">{t('tech_sheets.form.technical_needs.notes_label')}</label>
            <Tooltip text={t('tech_sheets.form.technical_needs.print_tooltip')}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showTechnicalNeedsNotesInPdf"
                  name="showTechnicalNeedsNotesInPdf"
                  checked={formData.showTechnicalNeedsNotesInPdf ?? true}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border accent-primary focus:ring-ring"
                />
                <label htmlFor="showTechnicalNeedsNotesInPdf" className="text-sm font-medium text-foreground">{t('tech_sheets.form.general.print_in_pdf')}</label>
              </div>
            </Tooltip>
          </div>
          <TechSheetField
            id="technicalNeedsNotes"
            label=""
            value={formData.technicalNeedsNotes || ''}
            onChange={(e) => handleFieldChange('technicalNeedsNotes', e.target.value)}
            as="textarea"
            rows={3}
            placeholder={t('tech_sheets.form.technical_needs.notes_placeholder')}
            tooltipText={t('tech_sheets.form.technical_needs.notes_tooltip')}
          />
        </div>
        {renderNeedsSection(t('tech_sheets.needs.category_labels.lighting'), 'lighting')}
        {renderNeedsSection(t('tech_sheets.needs.category_labels.sound'), 'sound')}
        {renderNeedsSection(t('tech_sheets.needs.category_labels.video'), 'video')}
        {renderNeedsSection(t('tech_sheets.needs.category_labels.machinery'), 'machinery')}
        {renderNeedsSection(t('tech_sheets.needs.category_labels.rentals'), 'rentals')}
        {renderNeedsSection(t('tech_sheets.needs.category_labels.other_equipment'), 'otherEquipment')}
        {renderNeedsSection(t('tech_sheets.needs.category_labels.electrical'), 'electrical')}
        {renderNeedsSection(t('tech_sheets.needs.category_labels.structures'), 'structures')}
        {renderNeedsSection(t('tech_sheets.needs.category_labels.platforms'), 'platforms')}
        {renderNeedsSection(t('tech_sheets.needs.category_labels.consumables'), 'consumables')}
        {renderNeedsSection(t('tech_sheets.needs.category_labels.curtains'), 'curtains')}
        {renderNeedsSection(t('tech_sheets.needs.category_labels.transport'), 'transport')}
      </TechSheetSection>

      {/* Other Details */}
      <TechSheetSection
        title={t('tech_sheets.form.sections.other_details')}
        isOpen={expandedSections.otherDetails}
        onToggle={() => handleToggleSection('otherDetails')}
      >
        <TechSheetField id="controlLocation" label={t('tech_sheets.form.other_details.control_location')} value={formData.controlLocation || ''} onChange={handleChange} placeholder={t('tech_sheets.form.other_details.control_placeholder')} tooltipText={t('tech_sheets.form.other_details.control_tooltip')} />
        <TechSheetField id="blueprints" label={t('tech_sheets.form.other_details.blueprints')} value={formData.blueprints || ''} onChange={handleChange} as="textarea" rows={3} placeholder={t('tech_sheets.form.other_details.blueprints_placeholder')} tooltipText={t('tech_sheets.form.other_details.blueprints_tooltip')} />
      </TechSheetSection>

      {/* Contacts & Observations */}
      <TechSheetSection
        title={t('tech_sheets.form.sections.contacts_observations')}
        isOpen={expandedSections.contactsObservations}
        onToggle={() => handleToggleSection('contactsObservations')}
      >
        <div className="col-span-full space-y-3">
          <h4 className="text-md font-semibold text-foreground">{t('tech_sheets.form.contacts.title')}</h4>
          {(formData.contacts || []).map((contact, index) => (
            <div key={contact.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-center p-2 border rounded-md border-border">
              <div className="col-span-3"><TechSheetField id={`contact-name-${index}`} label={t('tech_sheets.form.contacts.field_name')} value={contact.name} onChange={(e) => handleContactChange(index, 'name', e.target.value)} placeholder={t('tech_sheets.form.contacts.field_name_placeholder')} tooltipText={t('tech_sheets.form.contacts.field_name_tooltip')} /></div>
              <div className="col-span-3"><TechSheetField id={`contact-role-${index}`} label={t('tech_sheets.form.contacts.field_role')} value={contact.role} onChange={(e) => handleContactChange(index, 'role', e.target.value)} placeholder={t('tech_sheets.form.contacts.field_role_placeholder')} tooltipText={t('tech_sheets.form.contacts.field_role_tooltip')} /></div>
              <div className="col-span-3"><TechSheetField id={`contact-email-${index}`} label={t('tech_sheets.form.contacts.field_email')} type="email" value={contact.email} onChange={(e) => handleContactChange(index, 'email', e.target.value)} placeholder={t('tech_sheets.form.contacts.field_email_placeholder')} tooltipText={t('tech_sheets.form.contacts.field_email_tooltip')} /></div>
              <div className="col-span-2"><TechSheetField id={`contact-phone-${index}`} label={t('tech_sheets.form.contacts.field_phone')} type="tel" value={contact.phone} onChange={(e) => handleContactChange(index, 'phone', e.target.value)} placeholder={t('tech_sheets.form.contacts.field_phone_placeholder')} tooltipText={t('tech_sheets.form.contacts.field_phone_tooltip')} /></div>
              <div className="col-span-1 flex items-end justify-center pb-1">
                <Tooltip text={t('tech_sheets.form.contacts.remove_tooltip')}>
                  <button type="button" onClick={() => handleRemoveContact(index)} className="remove-item-button text-destructive hover:bg-destructive/10 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold no-print">×</button>
                </Tooltip>
              </div>
            </div>
          ))}
          <div className="mt-2 no-print">
            <Tooltip text={t('tech_sheets.form.contacts.add_contact_tooltip')}>
              <button type="button" onClick={handleAddContact} className="add-item-button px-3 py-1 bg-success text-success-foreground rounded-md hover:bg-success/90 text-sm">{t('tech_sheets.form.contacts.add_contact')}</button>
            </Tooltip>
          </div>
        </div>
        <div className="col-span-full pt-4">
          <TechSheetField id="observations" label={t('tech_sheets.form.contacts.observations_label')} value={formData.observations || ''} onChange={handleChange} as="textarea" rows={4} tooltipText={t('tech_sheets.form.contacts.observations_tooltip')} />
        </div>
      </TechSheetSection>

    </div>
  );
};

export default TechSheetForm;
