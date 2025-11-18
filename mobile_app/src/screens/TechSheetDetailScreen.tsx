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

type TechSheetDetailScreenRouteProp = RouteProp<
  TechSheetsStackParamList,
  'TechSheetDetail'
>;

type Props = {
  route: TechSheetDetailScreenRouteProp;
};

export default function TechSheetDetailScreen({ route }: Props) {
  const eventId = route.params?.eventId;
  const event = useDataStore((state) =>
    state.eventFrames.find((e) => e.id === eventId)
  );
  const peopleGroups = useDataStore((state) => state.peopleGroups);
  const materialItems = useDataStore((state) => state.materialItems);

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

  if (!event) {
    return <View style={styles.centerContainer}><Text>No s'ha trobat l'esdeveniment.</Text></View>;
  }
  if (!techSheet) {
    return <View style={styles.centerContainer}><Text>Aquest esdeveniment no té fitxa de bolo associada.</Text></View>;
  }

  const getPersonName = (personGroupId: string) => peopleGroups.find((p) => p.id === personGroupId)?.name || 'Desconegut';
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
        {section.details && <Text style={styles.notes}>{section.details}</Text>}
        {!hasNeeds && !section.details && <Text>Sense especificacions.</Text>}
        {hasNeeds && section.needs?.map((need) => (
          <View key={need.id} style={styles.needItem}>
            <Text style={styles.needDescription}>- {need.quantity}x {need.description || getMaterialName(need.materialItemId)} ({need.origin})</Text>
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
      value = `Número: ${section.data.number || 'N/A'}`;
      if (section.data.names) value += `, Noms: ${section.data.names}`;
    }
    if (section.details) value += `\nDetalls: ${section.details}`;
    return <ReadOnlyField label={label} value={value || 'Sí'} />;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.button} onPress={toggleAllSections}>
            <Icon name={areAllExpanded ? 'arrow-collapse-vertical' : 'arrow-expand-vertical'} size={24} color="#333" />
            <Text style={styles.buttonText}>{areAllExpanded ? 'Replegar Totes' : 'Expandir Totes'}</Text>
        </TouchableOpacity>
      </View>

      <CollapsibleSection title="Informació General" isExpanded={!!expandedSections.general} onToggle={() => handleToggleSection('general')}>
        <ReadOnlyField label="Esdeveniment" value={techSheet.eventName} />
        <ReadOnlyField label="Lloc" value={techSheet.location} />
        <ReadOnlyField label="Data" value={formatDate(techSheet.date)} />
        {techSheet.showTimes && techSheet.showTimes.length > 0 && <ReadOnlyField label="Hora Funció" value={techSheet.showTimes.map(st => st.time).join(', ')} />}
        <ReadOnlyField label="Durada Espectacle" value={techSheet.showDuration} />
      </CollapsibleSection>

      {techSheet.generalNotes && <CollapsibleSection title="Notes Generals" isExpanded={!!expandedSections.generalNotes} onToggle={() => handleToggleSection('generalNotes')}><Text>{techSheet.generalNotes}</Text></CollapsibleSection>}
      {techSheet.preAssembly?.status === 'yes' && <CollapsibleSection title="Premuntatge" isExpanded={!!expandedSections.preAssembly} onToggle={() => handleToggleSection('preAssembly')}><Text>{techSheet.preAssembly.details || 'Sí'}</Text></CollapsibleSection>}

      {sectionKeys.includes('logistics') &&
        <CollapsibleSection title="Logística" isExpanded={!!expandedSections.logistics} onToggle={() => handleToggleSection('logistics')}>
            {techSheet.parking?.status === 'yes' && <ReadOnlyField label="Pàrquing" value={techSheet.parking.details || 'Sí'} />}
            {techSheet.dressingRooms?.status === 'yes' && <ReadOnlyField label="Camerinos" value={techSheet.dressingRooms.details || 'Sí'} />}
            {renderPersonnelInfoSection('Intèrprets / Ponents', techSheet.actorsInfo as any)}
            {renderPersonnelInfoSection('Personal Tècnic (Client)', techSheet.techniciansInfo as any)}
        </CollapsibleSection>
      }

      {techSheet.schedule?.status === 'yes' &&
        <CollapsibleSection title="Horaris de Muntatge" isExpanded={!!expandedSections.schedule} onToggle={() => handleToggleSection('schedule')}>
          {techSheet.schedule.details && <Text style={styles.notes}>{techSheet.schedule.details}</Text>}
          {techSheet.schedule.data?.map((item) => <ReadOnlyField key={item.id} label={`${formatDate(item.date)} ${item.time}${item.timeEnd ? ` - ${item.timeEnd}`: ''}`} value={item.description} />)}
        </CollapsibleSection>
      }

      {techSheet.technicalProviders && techSheet.technicalProviders.length > 0 &&
        <CollapsibleSection title="Personal Tècnic" isExpanded={!!expandedSections.personnel} onToggle={() => handleToggleSection('personnel')}>
          {techSheet.technicalPersonnelNotes && <Text style={styles.notes}>{techSheet.technicalPersonnelNotes}</Text>}
          {techSheet.technicalProviders.map((provider) => (
            <View key={provider.id} style={{marginTop: 5}}>
              <Text style={styles.providerName}>{getPersonName(provider.personGroupId)}</Text>
              {provider.roles.map(role => <ReadOnlyField key={role.id} label={`    ${role.role}`} value={`${role.quantity} persona/es`} />)}
            </View>
          ))}
        </CollapsibleSection>
      }

      {techSheet.technicalNeedsNotes && <CollapsibleSection title="Notes de Necessitats Tècniques" isExpanded={!!expandedSections.technicalNeedsNotes} onToggle={() => handleToggleSection('technicalNeedsNotes')}><Text>{techSheet.technicalNeedsNotes}</Text></CollapsibleSection>}
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
            <View key={contact.id} style={styles.contactContainer}>
              <ReadOnlyField label="Nom" value={contact.name} />
              <ReadOnlyField label="Rol" value={contact.role} />
              <ReadOnlyField label="Telèfon" value={contact.phone} />
              <ReadOnlyField label="Email" value={contact.email} />
            </View>
          ))}
        </CollapsibleSection>
      }

      {techSheet.observations && <CollapsibleSection title="Observacions" isExpanded={!!expandedSections.observations} onToggle={() => handleToggleSection('observations')}><Text>{techSheet.observations}</Text></CollapsibleSection>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 8 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  providerName: { fontWeight: 'bold', fontSize: 16, marginTop: 8 },
  needItem: { paddingVertical: 4 },
  needDescription: { fontSize: 14 },
  notes: { fontStyle: 'italic', marginBottom: 8, color: '#666' },
  contactContainer: { marginBottom: 10 },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
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
    color: '#333',
  },
});
