import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { PeopleStackParamList } from '../navigation';
import { PersonGroup } from '../types';

type PersonFormScreenNavigationProp = StackNavigationProp<PeopleStackParamList, 'PersonForm'>;
type PersonFormScreenRouteProp = RouteProp<PeopleStackParamList, 'PersonForm'>;

type Props = {
  navigation: PersonFormScreenNavigationProp;
  route: PersonFormScreenRouteProp;
};

const PersonFormScreen = ({ navigation, route }: Props) => {
  const { personId } = route.params;
  const { peopleGroups, addPersonGroup, updatePersonGroup } = useDataStore();

  const [person, setPerson] = useState<Omit<PersonGroup, 'id'>>({
    name: '',
    role: '',
    tel1: '',
    tel2: '',
    email: '',
    web: '',
    notes: '',
  });

  useEffect(() => {
    if (personId) {
      const existingPerson = peopleGroups.find(p => p.id === personId);
      if (existingPerson) {
        setPerson(existingPerson);
      }
    }
  }, [personId, peopleGroups]);

  const handleSave = () => {
    if (!person.name.trim()) {
      Alert.alert("Error", "El camp 'Nom' és obligatori.");
      return;
    }

    const isDuplicate = peopleGroups.some(pg =>
        pg.name.trim().toLowerCase() === person.name.trim().toLowerCase() &&
        pg.id !== personId
    );

    if (isDuplicate) {
        Alert.alert("Error", "Ja existeix un contacte amb aquest nom.");
        return;
    }

    if (personId) {
      updatePersonGroup(personId, person);
    } else {
      addPersonGroup(person);
    }
    navigation.goBack();
  };

  const handleChange = (field: keyof Omit<PersonGroup, 'id'>, value: string) => {
    setPerson(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Nom</Text>
      <TextInput style={styles.input} value={person.name} onChangeText={(val) => handleChange('name', val)} />

      <Text style={styles.label}>Rol</Text>
      <TextInput style={styles.input} value={person.role} onChangeText={(val) => handleChange('role', val)} />

      <Text style={styles.label}>Telèfon 1</Text>
      <TextInput style={styles.input} value={person.tel1} onChangeText={(val) => handleChange('tel1', val)} keyboardType="phone-pad" />

      <Text style={styles.label}>Telèfon 2</Text>
      <TextInput style={styles.input} value={person.tel2} onChangeText={(val) => handleChange('tel2', val)} keyboardType="phone-pad" />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={person.email} onChangeText={(val) => handleChange('email', val)} keyboardType="email-address" />

      <Text style={styles.label}>Web</Text>
      <TextInput style={styles.input} value={person.web} onChangeText={(val) => handleChange('web', val)} />

      <Text style={styles.label}>Notes</Text>
      <TextInput style={styles.inputMulti} value={person.notes} onChangeText={(val) => handleChange('notes', val)} multiline />

      <Button title="Desar" onPress={handleSave} />
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

export default PersonFormScreen;
