import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { useDataStore } from '../stores/dataStore';
import { EventsStackParamList } from '../navigation';
import ReadOnlySection from '../components/tech_sheet/ReadOnlySection';
import ReadOnlyField from '../components/tech_sheet/ReadOnlyField';

type TechSheetDetailScreenRouteProp = RouteProp<
  EventsStackParamList,
  'TechSheetDetail'
>;

type Props = {
  route: TechSheetDetailScreenRouteProp;
};

export default function TechSheetDetailScreen({ route }: Props) {
  const { eventId } = route.params;
  const event = useDataStore((state) =>
    state.eventFrames.find((e) => e.id === eventId)
  );
  const peopleGroups = useDataStore((state) => state.peopleGroups);
  const materialItems = useDataStore((state) => state.materialItems);

  if (!event) {
    return (
      <View style={styles.centerContainer}>
        <Text>No s'ha trobat l'esdeveniment.</Text>
      </View>
    );
  }

  const { techSheet } = event;

  if (!techSheet) {
    return (
      <View style={styles.centerContainer}>
        <Text>Aquest esdeveniment no té fitxa de bolo associada.</Text>
      </View>
    );
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No especificat';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString; // Return original string if it's not a valid date
    }
  };

  const getPersonName = (personGroupId: string) => {
    const person = peopleGroups.find((p) => p.id === personGroupId);
    return person ? person.name : 'Desconegut';
  };

  const getMaterialName = (materialId: string | null | undefined) => {
    if (!materialId) return 'N/A';
    const item = materialItems.find(i => i.id === materialId);
    return item ? item.name : 'Material desconegut';
  };

  const renderConditionalSection = (
    title: string,
    section: { status: 'yes' | 'no' | 'unset'; details: string } | undefined
  ) => {
    if (!section || section.status !== 'yes') return null;
    return (
      <ReadOnlySection title={title}>
        <Text>{section.details || 'Sense detalls.'}</Text>
      </ReadOnlySection>
    );
  };

  const renderNeedsSection = (
    title: string,
    section: { status: 'yes' | 'no' | 'unset'; details: string; needs?: any[] } | undefined
  ) => {
    if (!section || section.status !== 'yes' || !section.needs || section.needs.length === 0) {
      return null;
    }

    return (
      <ReadOnlySection title={title}>
        {section.details && <Text style={styles.notes}>{section.details}</Text>}
        {section.needs.map((need, index) => (
          <View key={need.id || index} style={styles.needItem}>
            <Text style={styles.needDescription}>
              - {need.quantity}x {need.description || getMaterialName(need.materialItemId)} ({need.origin})
            </Text>
          </View>
        ))}
      </ReadOnlySection>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <ReadOnlySection title="Informació General">
        <ReadOnlyField label="Esdeveniment" value={techSheet.eventName} />
        <ReadOnlyField label="Lloc" value={techSheet.location} />
        <ReadOnlyField label="Data" value={formatDate(techSheet.date)} />
      </ReadOnlySection>

      <ReadOnlySection title="Horaris">
        {techSheet.schedule?.data?.map((item) => (
          <ReadOnlyField
            key={item.id}
            label={`${formatDate(item.date)} ${item.time}${item.timeEnd ? ` - ${item.timeEnd}`: ''}`}
            value={item.description}
          />
        ))}
      </ReadOnlySection>

      <ReadOnlySection title="Personal Tècnic">
        {techSheet.technicalProviders?.map((provider) => (
          <View key={provider.id}>
            <Text style={styles.providerName}>{getPersonName(provider.personGroupId)}</Text>
            {provider.roles.map(role => (
                <ReadOnlyField key={role.id} label={`    ${role.role}`} value={`${role.quantity} persona/es`} />
            ))}
          </View>
        ))}
      </ReadOnlySection>

      {renderNeedsSection('Llums', techSheet.lighting)}
      {renderNeedsSection('So', techSheet.sound)}
      {renderNeedsSection('Vídeo', techSheet.video)}
      {renderNeedsSection('Maquinària', techSheet.machinery)}
      {renderNeedsSection('Lloguers', techSheet.rentals)}
      {renderNeedsSection('Altre Equipament', techSheet.otherEquipment)}
      {renderNeedsSection('Elèctric', techSheet.electrical)}
      {renderNeedsSection('Estructures', techSheet.structures)}
      {renderNeedsSection('Plataformes', techSheet.platforms)}
      {renderNeedsSection('Consumibles', techSheet.consumables)}
      {renderNeedsSection('Cortines', techSheet.curtains)}
      {renderNeedsSection('Transport', techSheet.transport)}


      <ReadOnlySection title="Contactes">
        {techSheet.contacts?.map((contact) => (
          <View key={contact.id} style={styles.contactContainer}>
            <ReadOnlyField label="Nom" value={contact.name} />
            <ReadOnlyField label="Rol" value={contact.role} />
            <ReadOnlyField label="Telèfon" value={contact.phone} />
            <ReadOnlyField label="Email" value={contact.email} />
          </View>
        ))}
      </ReadOnlySection>

      <ReadOnlySection title="Observacions">
        <Text>{techSheet.observations || 'Sense observacions.'}</Text>
      </ReadOnlySection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  providerName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
  },
  needItem: {
    paddingVertical: 4,
  },
  needDescription: {
    fontSize: 14,
  },
  notes: {
    fontStyle: 'italic',
    marginBottom: 8,
    color: '#666',
  },
  contactContainer: {
      marginBottom: 10,
  }
});
