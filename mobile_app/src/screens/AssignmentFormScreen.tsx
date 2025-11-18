import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { EventsStackParamList } from '../navigation';
import { Assignment, AssignmentStatus } from '../types';
import { Picker } from '@react-native-picker/picker';
import { formatDateDMY } from '../utils/dateFormat';

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

  const [assignment, setAssignment] = useState<Omit<Assignment, 'id'>>({
    personGroupId: '',
    eventFrameId: eventFrameId,
    startDate: event?.startDate || '',
    endDate: event?.endDate || '',
    status: AssignmentStatus.Pending,
    notes: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isEditingMixed, setIsEditingMixed] = useState(false);

  useEffect(() => {
    if (assignmentId && event) {
      const existingAssignment = event.assignments.find(a => a.id === assignmentId);
      if (existingAssignment) {
        setAssignment(existingAssignment);
        if (existingAssignment.status === AssignmentStatus.Mixed) {
          setIsEditingMixed(true);
        }
      }
    }
  }, [eventFrameId, assignmentId, event]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!assignment.personGroupId) newErrors.personGroupId = "Cal seleccionar una persona o grup.";
    if (!assignment.startDate) newErrors.startDate = "La data d'inici és obligatòria.";
    if (!assignment.endDate) newErrors.endDate = "La data de fi és obligatòria.";

    if (assignment.startDate && assignment.endDate) {
        const start = new Date(assignment.startDate);
        const end = new Date(assignment.endDate);
        if (start > end) {
            newErrors.endDate = "La data de fi no pot ser anterior a la d'inici.";
        }
        if (event) {
            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate);
            if (start < eventStart || end > eventEnd) {
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

    let conflictMessage: string | null = null;
    if (assignmentId) {
      conflictMessage = await updateAssignment(eventFrameId, assignmentId, assignment, force);
    } else {
      conflictMessage = await addAssignment(eventFrameId, assignment, force);
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

  const handleChange = (field: keyof Omit<Assignment, 'id'>, value: any) => {
    setAssignment(prev => ({ ...prev, [field]: value }));
    if (field === 'status' && isEditingMixed) {
      setIsEditingMixed(false); // The user has changed the status, so we are no longer in "mixed editing mode" for the UI
    }
  };

  if (!event) {
    return <View style={styles.container}><Text>No s'ha trobat l'esdeveniment pare.</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      {isEditingMixed && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Aquesta assignació té estats diaris personalitzats. Canviar l'estat aquí sobreescriurà tots els estats diaris amb el nou valor seleccionat.
          </Text>
        </View>
      )}

      <Text style={styles.label}>Persona/Grup</Text>
      <View style={[styles.pickerContainer, errors.personGroupId ? styles.inputError : null]}>
        <Picker
          selectedValue={assignment.personGroupId}
          onValueChange={(itemValue) => handleChange('personGroupId', itemValue)}
        >
          <Picker.Item label="-- Seleccioneu --" value="" />
          {peopleGroups.map(pg => (
            <Picker.Item key={pg.id} label={pg.name} value={pg.id} />
          ))}
        </Picker>
      </View>
      {errors.personGroupId && <Text style={styles.errorText}>{errors.personGroupId}</Text>}

      <Text style={styles.label}>Data d'Inici (YYYY-MM-DD)</Text>
      <TextInput
        style={[styles.input, errors.startDate || errors.datesRange ? styles.inputError : null]}
        value={assignment.startDate}
        onChangeText={(val) => handleChange('startDate', val)}
        placeholder="YYYY-MM-DD"
      />
      {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}

      <Text style={styles.label}>Data de Fi (YYYY-MM-DD)</Text>
      <TextInput
        style={[styles.input, errors.endDate || errors.datesRange ? styles.inputError : null]}
        value={assignment.endDate}
        onChangeText={(val) => handleChange('endDate', val)}
        placeholder="YYYY-MM-DD"
      />
      {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
      {errors.datesRange && <Text style={styles.errorText}>{errors.datesRange}</Text>}

      <Text style={styles.label}>Estat</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={assignment.status}
          onValueChange={(itemValue) => handleChange('status', itemValue)}
        >
          {isEditingMixed && <Picker.Item key="mixed" label="Mixt (personalitzat)" value={AssignmentStatus.Mixed} />}
          {Object.values(AssignmentStatus).map(status => (
              status !== AssignmentStatus.Mixed && <Picker.Item key={status} label={status} value={status} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput style={styles.inputMulti} value={assignment.notes || ''} onChangeText={(val) => handleChange('notes', val)} multiline />

      <Button title="Desar Assignació" onPress={() => performSave(false)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
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
  warningBox: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderLeftColor: '#FFC107',
    borderLeftWidth: 4,
    padding: 10,
    marginBottom: 20,
  },
  warningText: {
    color: '#856404',
  },
});

export default AssignmentFormScreen;
