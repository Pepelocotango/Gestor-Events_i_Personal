import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { useDataStore } from '../stores/dataStore';
import { TechSheetsStackParamList } from '../navigation';
import ReadOnlyField from '../components/tech_sheet/ReadOnlyField';
import { formatDate } from '../utils/dateFormat';
import CollapsibleSection from '../components/CollapsibleSection';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { lightTheme, darkTheme } from '../utils/themes';

type TechSheetDetailScreenRouteProp = RouteProp<
  TechSheetsStackParamList,
  'TechSheetDetail'
>;

type Props = {
  route: TechSheetDetailScreenRouteProp;
};

export default function TechSheetDetailScreen({ route }: Props) {
  const eventId = route.params?.eventId;
  const { eventFrames, peopleGroups, materialItems, theme } = useDataStore();
  const { t } = useTranslation();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const event = eventFrames.find((e) => e.id === eventId);
  const techSheet = event?.techSheet;

  const sectionKeys = useMemo(() => {
    if (!techSheet) return [];
    const keys = new Set<string>();
    if (techSheet.eventName) keys.add('general');
    if (techSheet.generalNotes) keys.add('generalNotes');
    if (techSheet.preAssembly?.status === 'yes') keys.add('preAssembly');
    if (techSheet.schedule?.status === 'yes') keys.add('schedule');
    if (techSheet.parking?.status === 'yes' || techSheet.dressingRooms?.status === 'yes' || techSheet.actorsInfo?.status === 'yes' || techSheet.techniciansInfo?.status === 'yes') keys.add('logistics');
    if (techSheet.technicalProviders && techSheet.technicalProviders.length > 0) keys.add('personnel');
    if (techSheet.technicalNeedsNotes) keys.add('technicalNeedsNotes');
    const needsSections = ['lighting', 'sound', 'video', 'machinery', 'rentals', 'otherEquipment', 'electrical', 'structures', 'platforms', 'consumables', 'curtains', 'transport'];
    needsSections.forEach(key => {
      if ((techSheet as any)[key]?.status === 'yes') keys.add(key);
    });
    if (techSheet.controlLocation || techSheet.blueprints) keys.add('otherDetails');
    if (techSheet.contacts && techSheet.contacts.length > 0) keys.add('contacts');
    if (techSheet.observations) keys.add('observations');
    return Array.from(keys);
  }, [techSheet]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const handleToggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const areAllExpanded = useMemo(() => {
    if (sectionKeys.length === 0) return false;
    return sectionKeys.every(key => expandedSections[key]);
  }, [expandedSections, sectionKeys]);

  const toggleAllSections = () => {
    if (areAllExpanded) {
      setExpandedSections({});
    } else {
      const allExpanded: Record<string, boolean> = {};
      sectionKeys.forEach(key => { allExpanded[key] = true; });
      setExpandedSections(allExpanded);
    }
  };

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 8 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: colors.background },
    text: { color: colors.text },
    providerName: { fontWeight: 'bold', fontSize: 16, marginTop: 8, color: colors.text },
    needItem: { paddingVertical: 4 },
    needDescription: { fontSize: 14, color: colors.text },
    notes: { fontStyle: 'italic', marginBottom: 8, color: colors.text, opacity: 0.8 },
    contactContainer: { marginBottom: 10 },
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 8,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 10,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
    },
    buttonText: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.text,
    },
  }), [colors]);

  if (!event) {
    return <View style={dynamicStyles.centerContainer}><Text style={dynamicStyles.text}>{t('mobile.tech_sheet.event_not_found')}</Text></View>;
  }
  if (!techSheet) {
    return <View style={dynamicStyles.centerContainer}><Text style={dynamicStyles.text}>{t('mobile.tech_sheet.no_tech_sheet')}</Text></View>;
  }

  const getPersonName = (personGroupId: string) => peopleGroups.find((p) => p.id === personGroupId)?.name || t('mobile.tech_sheet.unknown');
  const getMaterialName = (materialId: string | null | undefined) => !materialId ? 'N/A' : (materialItems.find(i => i.id === materialId)?.name || 'Material desconegut');

  const renderNeedsSection = (
    title: string,
    sectionKey: string,
    section: { status: 'yes' | 'no' | 'unset'; details: string; needs?: any[] } | undefined
  ) => {
    if (!section || section.status !== 'yes') return null;
    const hasNeeds = section.needs && section.needs.length > 0;
    return (
      <CollapsibleSection title={title} isExpanded={!!expandedSections[sectionKey]} onToggle={() => handleToggleSection(sectionKey)}>
        {section.details && <Text style={dynamicStyles.notes}>{section.details}</Text>}
        {!hasNeeds && !section.details && <Text style={dynamicStyles.text}>Sense especificacions.</Text>}
        {hasNeeds && section.needs?.map((need) => (
          <View key={need.id} style={dynamicStyles.needItem}>
            <Text style={dynamicStyles.needDescription}>- {need.quantity}x {need.description || getMaterialName(need.materialItemId)} ({need.origin})</Text>
          </View>
        ))}
      </CollapsibleSection>
    );
  };

  const renderPersonnelInfoSection = (
    label: string,
    section: { status: 'yes' | 'no' | 'unset'; data?: { number: number; names: string }; details?: string } | undefined
  ) => {
    if (!section || section.status !== 'yes') return null;
    let value = '';
    if (section.data) {
      value = `${t('mobile.tech_sheet.number')}: ${section.data.number || 'N/A'}`;
      if (section.data.names) value += `, ${t('mobile.tech_sheet.names')}: ${section.data.names}`;
    }
    if (section.details) value += `\n${t('mobile.tech_sheet.details')}: ${section.details}`;
    return <ReadOnlyField label={label} value={value || t('mobile.tech_sheet.yes')} />;
  };

  return (
    <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.toolbar}>
        <TouchableOpacity style={dynamicStyles.button} onPress={toggleAllSections}>
            <Icon name={areAllExpanded ? 'arrow-collapse-vertical' : 'arrow-expand-vertical'} size={24} color={colors.text} />
            <Text style={dynamicStyles.buttonText}>{areAllExpanded ? 'Replegar Totes' : 'Expandir Totes'}</Text>
        </TouchableOpacity>
      </View>

      <CollapsibleSection title={t('mobile.tech_sheet.general_info')} isExpanded={!!expandedSections.general} onToggle={() => handleToggleSection('general')}>
        <ReadOnlyField label={t('mobile.tech_sheet.event')} value={techSheet.eventName} />
        <ReadOnlyField label={t('mobile.tech_sheet.place')} value={techSheet.location} />
        <ReadOnlyField label={t('mobile.tech_sheet.date')} value={formatDate(techSheet.date)} />
        {techSheet.showTimes && techSheet.showTimes.length > 0 && <ReadOnlyField label={t('mobile.tech_sheet.show_time')} value={techSheet.showTimes.map(st => st.time).join(', ')} />}
        <ReadOnlyField label={t('mobile.tech_sheet.duration')} value={techSheet.showDuration} />
      </CollapsibleSection>

      {techSheet.generalNotes && <CollapsibleSection title={t('mobile.tech_sheet.general_notes')} isExpanded={!!expandedSections.generalNotes} onToggle={() => handleToggleSection('generalNotes')}><Text style={dynamicStyles.text}>{techSheet.generalNotes}</Text></CollapsibleSection>}
      {techSheet.preAssembly?.status === 'yes' && <CollapsibleSection title={t('mobile.tech_sheet.preassembly')} isExpanded={!!expandedSections.preAssembly} onToggle={() => handleToggleSection('preAssembly')}><Text style={dynamicStyles.text}>{techSheet.preAssembly.details || t('mobile.tech_sheet.yes')}</Text></CollapsibleSection>}

      {sectionKeys.includes('logistics') &&
        <CollapsibleSection title={t('mobile.tech_sheet.logistics')} isExpanded={!!expandedSections.logistics} onToggle={() => handleToggleSection('logistics')}>
            {techSheet.parking?.status === 'yes' && <ReadOnlyField label={t('mobile.tech_sheet.parking')} value={techSheet.parking.details || t('mobile.tech_sheet.yes')} />}
            {techSheet.dressingRooms?.status === 'yes' && <ReadOnlyField label={t('mobile.tech_sheet.dressing_rooms')} value={techSheet.dressingRooms.details || t('mobile.tech_sheet.yes')} />}
            {renderPersonnelInfoSection(t('mobile.tech_sheet.interpreters'), techSheet.actorsInfo as any)}
            {renderPersonnelInfoSection('Personal Tècnic (Client)', techSheet.techniciansInfo as any)}
        </CollapsibleSection>
      }

      {techSheet.schedule?.status === 'yes' &&
        <CollapsibleSection title="Horaris de Muntatge" isExpanded={!!expandedSections.schedule} onToggle={() => handleToggleSection('schedule')}>
          {techSheet.schedule.details && <Text style={dynamicStyles.notes}>{techSheet.schedule.details}</Text>}
          {techSheet.schedule.data?.map((item) => <ReadOnlyField key={item.id} label={`${formatDate(item.date)} ${item.time}${item.timeEnd ? ` - ${item.timeEnd}`: ''}`} value={item.description} />)}
        </CollapsibleSection>
      }

      {techSheet.technicalProviders && techSheet.technicalProviders.length > 0 &&
        <CollapsibleSection title="Personal Tècnic" isExpanded={!!expandedSections.personnel} onToggle={() => handleToggleSection('personnel')}>
          {techSheet.technicalPersonnelNotes && <Text style={dynamicStyles.notes}>{techSheet.technicalPersonnelNotes}</Text>}
          {techSheet.technicalProviders.map((provider) => (
            <View key={provider.id} style={{marginTop: 5}}>
              <Text style={dynamicStyles.providerName}>{getPersonName(provider.personGroupId)}</Text>
              {provider.roles.map(role => <ReadOnlyField key={role.id} label={`    ${role.role}`} value={`${role.quantity} persona/es`} />)}
            </View>
          ))}
        </CollapsibleSection>
      }

      {techSheet.technicalNeedsNotes && <CollapsibleSection title="Notes de Necessitats Tècniques" isExpanded={!!expandedSections.technicalNeedsNotes} onToggle={() => handleToggleSection('technicalNeedsNotes')}><Text style={dynamicStyles.text}>{techSheet.technicalNeedsNotes}</Text></CollapsibleSection>}
      {renderNeedsSection('Il·luminació', 'lighting', techSheet.lighting)}
      {renderNeedsSection('So', 'sound', techSheet.sound)}
      {renderNeedsSection('Vídeo', 'video', techSheet.video)}
      {renderNeedsSection('Maquinària', 'machinery', techSheet.machinery)}
      {renderNeedsSection('Lloguers', 'rentals', techSheet.rentals)}
      {renderNeedsSection('Altre Equipament', 'otherEquipment', techSheet.otherEquipment)}
      {renderNeedsSection('Infraestructures Elèctriques', 'electrical', techSheet.electrical)}
      {renderNeedsSection('Estructures', 'structures', techSheet.structures)}
      {renderNeedsSection('Tarimes', 'platforms', techSheet.platforms)}
      {renderNeedsSection('Consumibles', 'consumables', techSheet.consumables)}
      {renderNeedsSection('Cortinatges', 'curtains', techSheet.curtains)}
      {renderNeedsSection('Transport', 'transport', techSheet.transport)}

      {sectionKeys.includes('otherDetails') &&
        <CollapsibleSection title="Altres Detalls" isExpanded={!!expandedSections.otherDetails} onToggle={() => handleToggleSection('otherDetails')}>
          <ReadOnlyField label="Ubicació Control" value={techSheet.controlLocation} />
          <ReadOnlyField label="Plànols" value={techSheet.blueprints} />
        </CollapsibleSection>
      }

      {techSheet.contacts && techSheet.contacts.length > 0 &&
        <CollapsibleSection title="Contactes" isExpanded={!!expandedSections.contacts} onToggle={() => handleToggleSection('contacts')}>
          {techSheet.contacts.map((contact) => (
            <View key={contact.id} style={dynamicStyles.contactContainer}>
              <ReadOnlyField label="Nom" value={contact.name} />
              <ReadOnlyField label="Rol" value={contact.role} />
              <ReadOnlyField label="Telèfon" value={contact.phone} />
              <ReadOnlyField label="Email" value={contact.email} />
            </View>
          ))}
        </CollapsibleSection>
      }

      {techSheet.observations && <CollapsibleSection title="Observacions" isExpanded={!!expandedSections.observations} onToggle={() => handleToggleSection('observations')}><Text style={dynamicStyles.text}>{techSheet.observations}</Text></CollapsibleSection>}
    </ScrollView>
  );
}
