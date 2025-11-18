import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { EventsStackParamList } from '../navigation';
import { Assignment, AssignmentStatus } from '../types';
import { Picker } from '@react-native-picker/picker';
import { formatDateDMY } from '../utils/dateFormat';
import DateTimePicker from '@react-native-community/datetimepicker';

type AssignmentFormScreenNavigationProp = StackNavigationProp<EventsStackParamList, 'AssignmentForm'>;
type AssignmentFormScreenRouteProp = RouteProp<EventsStackParamList, 'AssignmentForm'>;

type Props = {
  navigation: AssignmentFormScreenNavigationProp;
  route: AssignmentFormScreenRouteProp;
};

const AssignmentFormScreen = ({ navigation, route }: Props) => {
  const { eventFrameId, assignmentId } = route.params;
  const { eventFrames, peopleGroups, addAssignment, updateAssignment } = useDataStore();

  const event = eventFrames.find(ef => ef.id === eventFrameId);
  const originalAssignment = event?.assignments.find(a => a.id === assignmentId);

  const [personGroupId, setPersonGroupId] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(event ? new Date(event.startDate) : null);
  const [endDate, setEndDate] = useState<Date | null>(event ? new Date(event.endDate) : null);
  const [status, setStatus] = useState<AssignmentStatus>(AssignmentStatus.Pending);
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    if (originalAssignment) {
      setPersonGroupId(originalAssignment.personGroupId);
      setStartDate(new Date(originalAssignment.startDate));
      setEndDate(new Date(originalAssignment.endDate));
      setStatus(originalAssignment.status);
      setNotes(originalAssignment.notes || '');
    }
  }, [eventFrameId, assignmentId, originalAssignment]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!personGroupId) newErrors.personGroupId = "Cal seleccionar una persona o grup.";
    if (!startDate) newErrors.startDate = "La data d'inici és obligatòria.";
    if (!endDate) newErrors.endDate = "La data de fi és obligatòria.";

    if (startDate && endDate) {
        if (startDate > endDate) {
            newErrors.endDate = "La data de fi no pot ser anterior a la d'inici.";
        }
        if (event) {
            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate);
            if (startDate < eventStart || endDate > eventEnd) {
                newErrors.datesRange = `Les dates han d'estar dins del rang de l'esdeveniment (${formatDateDMY(event.startDate)} - ${formatDateDMY(event.endDate)}).`;
            }
        }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const performSave = async (force: boolean = false) => {
    if (!validate()) {
      Alert.alert("Errors de Validació", "Si us plau, corregeix els errors abans de desar.");
      return;
    }

    const assignmentData = {
        personGroupId,
        eventFrameId,
        startDate: startDate!.toISOString().split('T')[0],
        endDate: endDate!.toISOString().split('T')[0],
        status,
        notes,
    };

    let conflictMessage: string | null = null;
    if (assignmentId) {
      conflictMessage = await updateAssignment(eventFrameId, assignmentId, assignmentData, force);
    } else {
      conflictMessage = await addAssignment(eventFrameId, assignmentData as Omit<Assignment, 'id'>, force);
    }

    if (conflictMessage) {
      Alert.alert(
        "Conflicte d'Assignació",
        conflictMessage,
        [
          { text: "Cancel·lar", style: "cancel" },
          { text: "Desar Igualment", onPress: () => performSave(true) }
        ]
      );
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

  if (!event) {
    return <View style={styles.container}><Text>No s'ha trobat l'esdeveniment pare.</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      <Text style={styles.label}>Persona/Grup</Text>
      <View style={[styles.pickerContainer, errors.personGroupId ? styles.inputError : null]}>
        <Picker selectedValue={personGroupId} onValueChange={(itemValue) => setPersonGroupId(itemValue)}>
          <Picker.Item label="-- Seleccioneu --" value="" />
          {peopleGroups.map(pg => <Picker.Item key={pg.id} label={pg.name} value={pg.id} />)}
        </Picker>
      </View>
      {errors.personGroupId && <Text style={styles.errorText}>{errors.personGroupId}</Text>}

      <View>
          <Text style={styles.label}>Data d'Inici</Text>
          <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={[styles.input, errors.startDate || errors.datesRange ? styles.inputError : null]}>
            <Text>{startDate ? formatDateDMY(startDate.toISOString()) : 'Selecciona una data'}</Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker value={startDate || new Date(event.startDate)} mode="date" display="default" onChange={onStartDateChange} />
          )}
          {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
        </View>

        <View>
          <Text style={styles.label}>Data de Fi</Text>
          <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={[styles.input, errors.endDate || errors.datesRange ? styles.inputError : null]}>
            <Text>{endDate ? formatDateDMY(endDate.toISOString()) : 'Selecciona una data'}</Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker value={endDate || startDate || new Date(event.endDate)} mode="date" display="default" onChange={onEndDateChange} minimumDate={startDate || undefined} />
          )}
          {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
        </View>
        {errors.datesRange && <Text style={styles.errorText}>{errors.datesRange}</Text>}

      <Text style={styles.label}>Estat General</Text>
      <View style={styles.pickerContainer}>
          <Picker
            selectedValue={status}
            onValueChange={(itemValue) => setStatus(itemValue)}>
            {Object.values(AssignmentStatus).map(s => (<Picker.Item key={s} label={s} value={s} />))}
          </Picker>
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput style={styles.inputMulti} value={notes} onChangeText={setNotes} multiline />

      <Button title={assignmentId ? "Desar Canvis" : "Crear Assignació"} onPress={() => performSave(false)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 60, // Espai extra per al botó de desar
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
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
      },
      inputError: {
        borderColor: '#F44336',
      },
      errorText: {
        color: '#F44336',
        marginBottom: 15,
        marginLeft: 5,
      },
      pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
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
      infoBox: {
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderLeftColor: '#2196F3',
        borderLeftWidth: 4,
        padding: 10,
        marginBottom: 20,
      },
      infoText: {
        color: '#0d47a1',
      },
});

export default AssignmentFormScreen;
