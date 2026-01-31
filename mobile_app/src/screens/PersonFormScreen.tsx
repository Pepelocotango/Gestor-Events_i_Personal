import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();

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
      Alert.alert(t('common.error'), t('mobile.alerts.name_required'));
      return;
    }

    const isDuplicate = peopleGroups.some(pg =>
        pg.name.trim().toLowerCase() === person.name.trim().toLowerCase() &&
        pg.id !== personId
    );

    if (isDuplicate) {
        Alert.alert(t('common.error'), t('people.name_duplicate'));
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
    outerContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: insets.bottom + 20,
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
    <View style={dynamicStyles.outerContainer}>
      <ScrollView contentContainerStyle={dynamicStyles.container}>
        <Text style={dynamicStyles.label}>{t('mobile.forms.labels.name')}</Text>
        <TextInput style={dynamicStyles.input} value={person.name} onChangeText={(val) => handleChange('name', val)} placeholder={t('mobile.forms.placeholders.name')} placeholderTextColor={colors.placeholder} />

        <Text style={dynamicStyles.label}>{t('mobile.forms.labels.role')}</Text>
        <TextInput style={dynamicStyles.input} value={person.role} onChangeText={(val) => handleChange('role', val)} placeholder={t('mobile.forms.placeholders.role')} placeholderTextColor={colors.placeholder} />

        <Text style={dynamicStyles.label}>{t('mobile.forms.labels.tel1')}</Text>
        <TextInput style={dynamicStyles.input} value={person.tel1} onChangeText={(val) => handleChange('tel1', val)} keyboardType="phone-pad" placeholder={t('mobile.forms.placeholders.phone')} placeholderTextColor={colors.placeholder} />

        <Text style={dynamicStyles.label}>{t('mobile.forms.labels.tel2')}</Text>
        <TextInput style={dynamicStyles.input} value={person.tel2} onChangeText={(val) => handleChange('tel2', val)} keyboardType="phone-pad" placeholder={t('mobile.forms.placeholders.phone')} placeholderTextColor={colors.placeholder} />

        <Text style={dynamicStyles.label}>{t('mobile.forms.labels.email')}</Text>
        <TextInput style={dynamicStyles.input} value={person.email} onChangeText={(val) => handleChange('email', val)} keyboardType="email-address" placeholder={t('mobile.forms.placeholders.email')} placeholderTextColor={colors.placeholder} />

        <Text style={dynamicStyles.label}>{t('mobile.forms.labels.web')}</Text>
        <TextInput style={dynamicStyles.input} value={person.web} onChangeText={(val) => handleChange('web', val)} placeholder={t('mobile.forms.placeholders.web')} placeholderTextColor={colors.placeholder} />

        <Text style={dynamicStyles.label}>{t('mobile.forms.labels.general_notes')}</Text>
        <TextInput style={dynamicStyles.inputMulti} value={person.notes} onChangeText={(val) => handleChange('notes', val)} multiline placeholder={t('mobile.forms.placeholders.notes_example')} placeholderTextColor={colors.placeholder} />

        <Button title={t('common.save')} onPress={handleSave} color={colors.primary} />
      </ScrollView>
    </View>
  );
};

export default PersonFormScreen;
