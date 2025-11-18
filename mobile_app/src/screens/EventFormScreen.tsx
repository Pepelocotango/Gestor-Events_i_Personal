import React, { useState, useEffect, useMemo } from 'react';
import { View, TextInput, Button, StyleSheet, SafeAreaView, ScrollView, Text, Alert, TouchableOpacity, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useDataStore } from '../stores/dataStore';
import { EventsStackParamList } from '../navigation';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateDMY } from '../utils/dateFormat';

type EventFormScreenNavigationProp = StackNavigationProp<EventsStackParamList, 'EventForm'>;
type EventFormScreenRouteProp = RouteProp<EventsStackParamList, 'EventForm'>;

type Props = {
  navigation: EventFormScreenNavigationProp;
  route: EventFormScreenRouteProp;
};

export default function EventFormScreen({ navigation, route }: Props) {
  const { eventId } = route.params || {};
  const { eventFrames, addEventFrame, updateEventFrame } = useDataStore();

  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [generalNotes, setGeneralNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [placeSuggestions, setPlaceSuggestions] = useState<string[]>([]);

  const isEditMode = eventId !== undefined;

  const uniqueEventNames = useMemo(() => Array.from(new Set(eventFrames.map(ef => ef.name).filter(Boolean) as string[])), [eventFrames]);
  const uniqueLocations = useMemo(() => Array.from(new Set(eventFrames.map(ef => ef.place).filter(Boolean) as string[])), [eventFrames]);

  useEffect(() => {
    if (isEditMode) {
      const eventToEdit = eventFrames.find((e) => e.id === eventId);
      if (eventToEdit) {
        setName(eventToEdit.name);
        setPlace(eventToEdit.place || '');
        setStartDate(new Date(eventToEdit.startDate));
        setEndDate(new Date(eventToEdit.endDate));
        setGeneralNotes(eventToEdit.generalNotes || '');
      }
    }
  }, [eventId, eventFrames, isEditMode]);

  const handleNameChange = (text: string) => {
    setName(text);
    if (text) {
      setNameSuggestions(uniqueEventNames.filter(n => n.toLowerCase().includes(text.toLowerCase()) && n !== text));
    } else {
      setNameSuggestions([]);
    }
  };

  const handlePlaceChange = (text: string) => {
    setPlace(text);
    if (text) {
      setPlaceSuggestions(uniqueLocations.filter(l => l.toLowerCase().includes(text.toLowerCase()) && l !== text));
    } else {
      setPlaceSuggestions([]);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "El nom és obligatori.";
    if (!startDate) newErrors.startDate = "La data d'inici és obligatòria.";
    if (!endDate) newErrors.endDate = "La data de fi és obligatòria.";

    if (startDate && endDate && startDate > endDate) {
        newErrors.endDate = "La data de fi ha de ser posterior o igual a la d'inici.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (andAssign = false) => {
    if (!validate()) {
      Alert.alert("Errors de Validació", "Si us plau, corregeix els errors abans de desar.");
      return;
    }

    const eventData = { name, place, startDate: startDate!.toISOString().split('T')[0], endDate: endDate!.toISOString().split('T')[0], generalNotes };
    let savedEventId = eventId;

    if (isEditMode) {
      updateEventFrame(eventId, eventData);
    } else {
      const newEvent = addEventFrame(eventData);
      savedEventId = newEvent.id;
    }

    if (andAssign) {
      navigation.replace('AssignmentForm', { eventFrameId: savedEventId! });
    } else {
      navigation.goBack();
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) setStartDate(selectedDate);
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) setEndDate(selectedDate);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Nom de l'Esdeveniment</Text>
        <TextInput
          style={[styles.input, errors.name ? styles.inputError : null]}
          value={name}
          onChangeText={handleNameChange}
          placeholder="Ex: Concert de Primavera"
          onFocus={() => setPlaceSuggestions([])}
        />
        {nameSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {nameSuggestions.map(item => (
              <TouchableOpacity key={item} style={styles.suggestionItem} onPress={() => { setName(item); setNameSuggestions([]); }}>
                <Text>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <Text style={styles.label}>Lloc</Text>
        <TextInput
          style={styles.input}
          value={place}
          onChangeText={handlePlaceChange}
          placeholder="Ex: Teatre Principal"
          onFocus={() => setNameSuggestions([])}
        />
        {placeSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {placeSuggestions.map(item => (
              <TouchableOpacity key={item} style={styles.suggestionItem} onPress={() => { setPlace(item); setPlaceSuggestions([]); }}>
                <Text>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View>
          <Text style={styles.label}>Data d'Inici</Text>
          <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={[styles.input, errors.startDate ? styles.inputError : null]}>
            <Text>{startDate ? formatDateDMY(startDate.toISOString()) : 'Selecciona una data'}</Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker value={startDate || new Date()} mode="date" display="default" onChange={onStartDateChange} />
          )}
          {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
        </View>

        <View>
          <Text style={styles.label}>Data de Fi</Text>
          <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={[styles.input, errors.endDate ? styles.inputError : null]}>
            <Text>{endDate ? formatDateDMY(endDate.toISOString()) : 'Selecciona una data'}</Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker value={endDate || startDate || new Date()} mode="date" display="default" onChange={onEndDateChange} minimumDate={startDate || undefined} />
          )}
          {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
        </View>

        <Text style={styles.label}>Notes Generals</Text>
        <TextInput
            style={styles.inputMulti}
            value={generalNotes}
            onChangeText={setGeneralNotes}
            placeholder="Anotacions diverses..."
            multiline
            numberOfLines={4}
            onFocus={() => { setNameSuggestions([]); setPlaceSuggestions([]); }}
        />
        <View style={styles.buttonContainer}>
            <Button title={isEditMode ? 'Actualitzar' : 'Crear'} onPress={() => handleSave(false)} color="#007AFF" />
            <View style={{ marginTop: 10 }} />
            <Button title={isEditMode ? 'Actualitzar i Assignar' : 'Crear i Assignar'} onPress={() => handleSave(true)} color="#4CAF50" />
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
      marginBottom: 5,
      borderWidth: 1,
      borderColor: '#ddd',
      justifyContent: 'center',
    },
    inputError: {
      borderColor: '#F44336',
    },
    errorText: {
      color: '#F44336',
      marginBottom: 20,
      marginLeft: 5,
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
    },
    suggestionsContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 10,
    },
    suggestionItem: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
  });
