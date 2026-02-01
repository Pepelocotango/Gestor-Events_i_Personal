import React, { useState, FormEvent, useMemo } from 'react';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';
import { useEventDataStore } from '../stores/eventDataStore';
import { useModalStore } from '../stores/modalStore';
import { PersonGroup, ShowToastFunction } from '../types';
import { TrashIcon, EditIcon, CsvIcon, PdfIcon } from '../constants';
import { exportPeopleToPdf } from '../utils/pdfGenerator';
import { escapeCsvCell } from '../utils/csvUtils';
import Tooltip from './ui/Tooltip';
import AutosizeTextarea from './ui/AutosizeTextarea';
import CollapsibleSection from './ui/CollapsibleSection';

interface PeopleDisplayProps {
  showToast: ShowToastFunction;
}

const PeopleDisplay: React.FC<PeopleDisplayProps> = ({ showToast }) => {
  const { t } = useTranslation();
  const { addPersonGroup, updatePersonGroup, deletePersonGroup: deletePersonGroupContext } = useEventDataStore.getState();
  const openModal = useModalStore(state => state.openModal);
  const peopleGroups = useEventDataStore(state => state.peopleGroups);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [tel1, setTel1] = useState('');
  const [tel2, setTel2] = useState('');
  const [email, setEmail] = useState('');
  const [web, setWeb] = useState('');
  const [notes, setNotes] = useState('');
  const [editingContact, setEditingContact] = useState<PersonGroup | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [search, setSearch] = useState('');

  function normalize(str: string) {
    return str
      .toLocaleLowerCase('ca')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const [sortConfig, setSortConfig] = useState<{ key: keyof PersonGroup, direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });

  const filteredContacts = peopleGroups.filter(pg => {
    if (!search.trim()) return true;
    const s = normalize(search);
    return [pg.name, pg.role, pg.email, pg.tel1, pg.tel2]
      .filter(Boolean)
      .map(val => normalize(val!))
      .some(val => val.includes(s));
  });

  const sortedContacts = useMemo(() => {
    const sortableItems = [...filteredContacts];
    sortableItems.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      let comparison = 0;

      if (valA === undefined || valA === null || valA === '') comparison = 1;
      else if (valB === undefined || valB === null || valB === '') comparison = -1;
      else comparison = String(valA).localeCompare(String(valB), 'ca', { sensitivity: 'base' });

      return sortConfig.direction === 'ascending' ? comparison : -comparison;
    });
    return sortableItems;
  }, [filteredContacts, sortConfig]);

  const requestSort = (key: keyof PersonGroup) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const commonInputClass = "mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring sm:text-sm disabled:opacity-50";

  const resetForm = () => {
    setName('');
    setRole('');
    setTel1('');
    setTel2('');
    setEmail('');
    setWeb('');
    setNotes('');
    setEditingContact(null);
    setErrors({});
  };

  const handleEdit = (person: PersonGroup) => {
    setEditingContact(person);
    setName(person.name);
    setRole(person.role || '');
    setTel1(person.tel1 || '');
    setTel2(person.tel2 || '');
    setEmail(person.email || '');
    setWeb(person.web || '');
    setNotes(person.notes || '');
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = t('people.name_required');
    const isDuplicate = peopleGroups.some(pg =>
      pg.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      (!editingContact || pg.id !== editingContact.id)
    );
    if (isDuplicate) newErrors.name = t('people.name_duplicate');

    if (email && !email.includes('@')) {
      newErrors.email = t('people.email_invalid');
    }
    if (web && !/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/.test(web) && !/^([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/.test(web)) {
      newErrors.web = t('people.web_invalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const personData: Omit<PersonGroup, 'id'> = {
      name: name.trim(),
      role: role.trim(),
      tel1: tel1.trim(),
      tel2: tel2.trim(),
      email: email.trim(),
      web: web.trim(),
      notes: notes.trim()
    };

    if (editingContact) {
      updatePersonGroup({ ...editingContact, ...personData });
      showToast(t('people.contact_updated_toast'), 'success');
    } else {
      addPersonGroup(personData);
      showToast(t('people.contact_added_toast'), 'success');
    }
    resetForm();
  };

  const handleDeleteContact = (person: PersonGroup) => {
    openModal('confirmDelete', {
      itemType: t('common.contact'), // Need to add 'contact' to common
      itemName: t('people.delete_contact_confirm_msg', { name: person.name }),
      onConfirm: () => {
        deletePersonGroupContext(person.id);
        if (editingContact?.id === person.id) {
          resetForm();
        }
      },
      confirmButtonText: t('common.delete'),
      intent: 'destructive',
    });
  };

  const exportPeopleToCSV = async () => {
    const header = [
      t('people.csv_header_name'),
      t('people.csv_header_role'),
      t('people.csv_header_tel1'),
      t('people.csv_header_tel2'),
      t('people.csv_header_email'),
      t('people.csv_header_web'),
      t('people.csv_header_notes')
    ];
    const rows = filteredContacts.map(p => [
      p.name,
      p.role,
      p.tel1,
      p.tel2,
      p.email,
      p.web,
      p.notes
    ]);

    const csvContent = [header, ...rows]
      .map(row => row.map(escapeCsvCell).join(','))
      .join('\n');

    const today = new Date().toISOString().slice(0, 10);
    const filename = `llista_contactes_${today}.csv`;

    if (window.electronAPI?.showSaveDialog) {
      const result = await window.electronAPI.showSaveDialog({
        title: t('people.csv_save_title'),
        defaultPath: filename,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
        data: "\uFEFF" + csvContent,
      });
      if (result.success) {
        showToast(t('people.csv_save_success'), 'success');
      } else if (!result.canceled) {
        showToast(t('people.csv_save_error', { message: result.message }), 'error');
      }
    } else {
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, filename);
    }
  };

  const exportToPdf = async () => {
    await exportPeopleToPdf(filteredContacts, showToast);
  };

  return (
    <CollapsibleSection
      title={t('people.manager_title')}
      defaultOpen={false}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna del formulari (25%) */}
        <div className="lg:col-span-1">
          <CollapsibleSection
            title={editingContact ? t('people.edit_contact_title') : t('people.add_contact_title')}
            defaultOpen={false}
          >
            <form onSubmit={handleSubmit} className="space-y-3" aria-labelledby="people-group-form-title">
              {editingContact && (
                <div className="flex justify-end">
                  <Tooltip text={t('people.delete_contact_tooltip')}>
                    <button
                      type="button"
                      onClick={() => handleDeleteContact(editingContact)}
                      aria-label={t('people.delete_contact_tooltip')}
                      className="ml-2 p-2 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-2">
                <div>
                  <label htmlFor="pg-name" className="block text-sm font-medium text-muted-foreground">{t('people.name_label')}</label>
                  <Tooltip text={t('people.name_tooltip')}>
                    <input type="text" id="pg-name" value={name} onChange={e => setName(e.target.value)} className={commonInputClass} required aria-required="true" />
                  </Tooltip>
                  {errors.name && <p className="text-destructive text-xs mt-1" role="alert">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="pg-role" className="block text-sm font-medium text-muted-foreground">{t('people.role_label')}</label>
                  <Tooltip text={t('people.role_tooltip')}>
                    <input type="text" id="pg-role" value={role} onChange={e => setRole(e.target.value)} className={commonInputClass} />
                  </Tooltip>
                </div>
                <div>
                  <label htmlFor="pg-tel1" className="block text-sm font-medium text-muted-foreground">{t('people.tel1_label')}</label>
                  <Tooltip text={t('people.tel1_tooltip')}>
                    <input type="tel" id="pg-tel1" value={tel1} onChange={e => setTel1(e.target.value)} className={commonInputClass} />
                  </Tooltip>
                </div>
                <div>
                  <label htmlFor="pg-tel2" className="block text-sm font-medium text-muted-foreground">{t('people.tel2_label')}</label>
                  <Tooltip text={t('people.tel2_tooltip')}>
                    <input type="tel" id="pg-tel2" value={tel2} onChange={e => setTel2(e.target.value)} className={commonInputClass} />
                  </Tooltip>
                </div>
                <div>
                  <label htmlFor="pg-email" className="block text-sm font-medium text-muted-foreground">{t('people.email_label')}</label>
                  <Tooltip text={t('people.email_tooltip')}>
                    <input type="email" id="pg-email" value={email} onChange={e => setEmail(e.target.value)} className={commonInputClass} />
                  </Tooltip>
                  {errors.email && <p className="text-destructive text-xs mt-1" role="alert">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="pg-web" className="block text-sm font-medium text-muted-foreground">{t('people.web_label')}</label>
                  <Tooltip text={t('people.web_tooltip')}>
                    <input type="url" id="pg-web" value={web} onChange={e => setWeb(e.target.value)} className={commonInputClass} placeholder={t('people.web_url_placeholder')} />
                  </Tooltip>
                  {errors.web && <p className="text-destructive text-xs mt-1" role="alert">{errors.web}</p>}
                </div>
              </div>
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="pg-notes" className="block text-sm font-medium text-muted-foreground">{t('people.notes_label')}</label>
                <Tooltip text={t('people.notes_tooltip')}>
                  <AutosizeTextarea id="pg-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${commonInputClass} resize-none overflow-hidden`} />
                </Tooltip>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                {editingContact && (
                  <Tooltip text={t('people.cancel_edit_tooltip')}>
                    <button type="button" onClick={resetForm} className="px-2 py-1 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent rounded-md border border-border">{t('people.cancel_edit')}</button>
                  </Tooltip>
                )}
                <Tooltip text={editingContact ? t('people.save_changes_tooltip') : t('people.add_contact_tooltip')}>
                  <button type="submit" className="px-2 py-1 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">{editingContact ? t('people.update_button') : t('people.add_button')}</button>
                </Tooltip>
              </div>
            </form>
          </CollapsibleSection>
        </div>

        {/* Columna de la llista (75%) */}
        <div className="lg:col-span-2">
          <CollapsibleSection
            title={t('people.list_title')}
            defaultOpen={false}
          >
            <div className="flex items-center justify-end mb-2 gap-2">
              <Tooltip text={t('people.export_csv_tooltip')}>
                <button type="button" onClick={exportPeopleToCSV} className="p-1 rounded-md bg-success/10 text-success hover:bg-success/20">
                  <CsvIcon className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip text={t('people.export_pdf_tooltip')}>
                <button type="button" onClick={exportToPdf} className="p-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20">
                  <PdfIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-muted-foreground">
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline align-middle"><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /></svg>
              </span>
              <input
                type="text"
                placeholder={t('people.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ml-2 px-2 py-1 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">{t('people.sort_by')}</span>
              <Tooltip text={t('people.sort_name_tooltip')}>
                <button onClick={() => requestSort('name')} className={`px-2 py-0.5 text-xs rounded-md ${sortConfig.key === 'name' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {t('people.name_label')} {sortConfig.key === 'name' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                </button>
              </Tooltip>
              <Tooltip text={t('people.sort_role_tooltip')}>
                <button onClick={() => requestSort('role')} className={`px-2 py-0.5 text-xs rounded-md ${sortConfig.key === 'role' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {t('people.role_label')} {sortConfig.key === 'role' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                </button>
              </Tooltip>
            </div>
            {sortedContacts.length === 0 ? (
              <p className="text-muted-foreground">{t('people.no_contacts_found')}</p>
            ) : (
              <ul className="space-y-1 max-h-[55vh] overflow-y-auto" aria-label={t('people.list_title')}>
                {sortedContacts.map((p: PersonGroup) => (
                  <li key={p.id} className="p-2 border border-border rounded-md bg-muted/50 hover:bg-accent transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <span className="font-semibold text-foreground">{p.name}</span>
                        {p.role && <p className="text-xs text-muted-foreground">{t('people.role_label')}: {p.role}</p>}
                      </div>
                      <div className="space-x-2 flex-shrink-0">
                        <Tooltip text={`${t('common.edit')} ${p.name}`}>
                          <button onClick={() => handleEdit(p)} className="p-1 text-primary hover:text-primary/80 transition-colors" aria-label={`${t('common.edit')} ${p.name}`}><EditIcon className="w-4 h-4" /></button>
                        </Tooltip>
                        <Tooltip text={`${t('common.delete')} ${p.name}`}>
                          <button onClick={() => handleDeleteContact(p)} className="p-1 text-destructive hover:text-destructive/80 transition-colors" aria-label={`${t('common.delete')} ${p.name}`}><TrashIcon className="w-4 h-4" /></button>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="mt-1 text-xs space-y-0.5 text-muted-foreground">
                      {(p.tel1 || p.tel2) && <p>Tel: {p.tel1}{p.tel1 && p.tel2 && " / "}{p.tel2}</p>}
                      {p.email && <p>Email: <a href={`mailto:${p.email}`} className="text-primary hover:underline">{p.email}</a></p>}
                      {p.web && <p>Web: <a href={p.web.startsWith('http') ? p.web : `https://${p.web}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{p.web}</a></p>}
                      {p.notes && <p className="mt-1 italic">{t('people.notes_label')}: {p.notes}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleSection>
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default PeopleDisplay;
