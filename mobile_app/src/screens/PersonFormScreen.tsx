import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { PeopleStackParamList } from '../navigation';
import { PersonGroup } from '../types';
import { lightTheme, darkTheme } from '../utils/themes';

type PersonFormScreenNavigationProp = StackNavigationProp<PeopleStackParamList, 'PersonForm'>;
type PersonFormScreenRouteProp = RouteProp<PeopleStackParamList, 'PersonForm'>;

type Props = {
  navigation: PersonFormScreenNavigationProp;
  route: PersonFormScreenRouteProp;
};

const PersonFormScreen = ({ navigation, route }: Props) => {
  const { personId } = route.params;
  const { peopleGroups, addPersonGroup, updatePersonGroup, theme } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

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

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },
    label: {
      fontSize: 16,
      marginBottom: 5,
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      color: colors.text,
      padding: 10,
      marginBottom: 15,
      borderRadius: 5,
    },
    inputMulti: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      color: colors.text,
      padding: 10,
      marginBottom: 15,
      borderRadius: 5,
      height: 100,
      textAlignVertical: 'top',
    }
  }), [colors]);

  return (
    <ScrollView style={dynamicStyles.container}>
      <Text style={dynamicStyles.label}>Nom</Text>
      <TextInput style={dynamicStyles.input} value={person.name} onChangeText={(val) => handleChange('name', val)} placeholderTextColor={colors.text} />

      <Text style={dynamicStyles.label}>Rol</Text>
      <TextInput style={dynamicStyles.input} value={person.role} onChangeText={(val) => handleChange('role', val)} placeholderTextColor={colors.text} />

      <Text style={dynamicStyles.label}>Telèfon 1</Text>
      <TextInput style={dynamicStyles.input} value={person.tel1} onChangeText={(val) => handleChange('tel1', val)} keyboardType="phone-pad" placeholderTextColor={colors.text} />

      <Text style={dynamicStyles.label}>Telèfon 2</Text>
      <TextInput style={dynamicStyles.input} value={person.tel2} onChangeText={(val) => handleChange('tel2', val)} keyboardType="phone-pad" placeholderTextColor={colors.text} />

      <Text style={dynamicStyles.label}>Email</Text>
      <TextInput style={dynamicStyles.input} value={person.email} onChangeText={(val) => handleChange('email', val)} keyboardType="email-address" placeholderTextColor={colors.text} />

      <Text style={dynamicStyles.label}>Web</Text>
      <TextInput style={dynamicStyles.input} value={person.web} onChangeText={(val) => handleChange('web', val)} placeholderTextColor={colors.text} />

      <Text style={dynamicStyles.label}>Notes</Text>
      <TextInput style={dynamicStyles.inputMulti} value={person.notes} onChangeText={(val) => handleChange('notes', val)} multiline placeholderTextColor={colors.text} />

      <Button title="Desar" onPress={handleSave} color={colors.primary} />
    </ScrollView>
  );
};

export default PersonFormScreen;
