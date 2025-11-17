import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { EventsStackParamList } from '../navigation';
import { Assignment, AssignmentStatus } from '../types';
import { Picker } from '@react-native-picker/picker';

type AssignmentFormScreenNavigationProp = StackNavigationProp<EventsStackParamList, 'AssignmentForm'>;
type AssignmentFormScreenRouteProp = RouteProp<EventsStackParamList, 'AssignmentForm'>;

type Props = {
  navigation: AssignmentFormScreenNavigationProp;
  route: AssignmentFormScreenRouteProp;
};

const AssignmentFormScreen = ({ navigation, route }: Props) => {
  const { eventFrameId, assignmentId } = route.params;
  const { eventFrames, peopleGroups, addAssignment, updateAssignment } = useDataStore();

  const [assignment, setAssignment] = useState<Omit<Assignment, 'id'>>({
    personGroupId: '',
    eventFrameId: eventFrameId,
    startDate: '',
    endDate: '',
    status: AssignmentStatus.Pending,
    notes: '',
  });

  useEffect(() => {
    const event = eventFrames.find(ef => ef.id === eventFrameId);
    if (assignmentId) {
      const existingAssignment = event?.assignments.find(a => a.id === assignmentId);
      if (existingAssignment) {
        setAssignment(existingAssignment);
      }
    } else if (event) {
        setAssignment(prev => ({
            ...prev,
            startDate: event.startDate,
            endDate: event.endDate,
        }));
    }
  }, [eventFrameId, assignmentId, eventFrames]);

  const handleSave = () => {
    if (!assignment.personGroupId) {
      Alert.alert("Error", "Heu de seleccionar una persona o grup.");
      return;
    }

    if (assignmentId) {
      updateAssignment(eventFrameId, assignmentId, assignment);
    } else {
      addAssignment(eventFrameId, assignment);
    }
    navigation.goBack();
  };

  const handleChange = (field: keyof Omit<Assignment, 'id'>, value: string) => {
    setAssignment(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Persona/Grup</Text>
      <Picker
        selectedValue={assignment.personGroupId}
        onValueChange={(itemValue) => handleChange('personGroupId', itemValue)}
      >
        <Picker.Item label="-- Seleccioneu --" value="" />
        {peopleGroups.map(pg => (
          <Picker.Item key={pg.id} label={pg.name} value={pg.id} />
        ))}
      </Picker>

      <Text style={styles.label}>Estat</Text>
      <Picker
        selectedValue={assignment.status}
        onValueChange={(itemValue) => handleChange('status', itemValue)}
      >
        {Object.values(AssignmentStatus).map(status => (
            status !== AssignmentStatus.Mixed && <Picker.Item key={status} label={status} value={status} />
        ))}
      </Picker>

      <Text style={styles.label}>Notes</Text>
      <TextInput style={styles.inputMulti} value={assignment.notes} onChangeText={(val) => handleChange('notes', val)} multiline />

      <Button title="Desar Assignació" onPress={handleSave} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  inputMulti: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    height: 100,
    textAlignVertical: 'top',
  }
});

export default AssignmentFormScreen;
