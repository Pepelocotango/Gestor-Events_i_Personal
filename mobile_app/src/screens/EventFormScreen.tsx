import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Text,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useDataStore } from '../stores/dataStore';
import { RootStackParamList } from '../navigation';
import { EventFrame } from '../types';

type EventFormScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'EventForm'
>;
type EventFormScreenRouteProp = RouteProp<RootStackParamList, 'EventForm'>;

type Props = {
  navigation: EventFormScreenNavigationProp;
  route: EventFormScreenRouteProp;
};

export default function EventFormScreen({ navigation, route }: Props) {
  const { eventId } = route.params || {};
  const { eventFrames, addEventFrame, updateEventFrame } = useDataStore();

  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  const isEditMode = eventId !== undefined;

  useEffect(() => {
    if (isEditMode) {
      const eventToEdit = eventFrames.find((e) => e.id === eventId);
      if (eventToEdit) {
        setName(eventToEdit.name);
        setPlace(eventToEdit.place || '');
        setStartDate(eventToEdit.startDate);
        setEndDate(eventToEdit.endDate);
        setGeneralNotes(eventToEdit.generalNotes || '');
      }
    }
  }, [eventId, eventFrames, isEditMode]);

  const handleSave = () => {
    const eventData = {
      name,
      place,
      startDate,
      endDate,
      generalNotes,
    };

    if (isEditMode) {
      updateEventFrame(eventId, eventData);
    } else {
      addEventFrame(eventData);
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={styles.label}>Nom de l'Esdeveniment</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Concert de Primavera"
        />

        <Text style={styles.label}>Lloc</Text>
        <TextInput
          style={styles.input}
          value={place}
          onChangeText={setPlace}
          placeholder="Ex: Teatre Principal"
        />

        <Text style={styles.label}>Data d'Inici (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="2024-01-15"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Data de Fi (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={endDate}
          onChangeText={setEndDate}
          placeholder="2024-01-16"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Notes Generals</Text>
        <TextInput
          style={styles.inputMulti}
          value={generalNotes}
          onChangeText={setGeneralNotes}
          placeholder="Anotacions diverses..."
          multiline
          numberOfLines={4}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={isEditMode ? 'Actualitzar' : 'Crear Esdeveniment'}
            onPress={handleSave}
            color="#007AFF"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputMulti: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
