import React, { useState, useEffect, useMemo } from 'react';
import { View, TextInput, Button, StyleSheet, SafeAreaView, ScrollView, Text, Alert, TouchableOpacity, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useDataStore } from '../stores/dataStore';
import { EventsStackParamList } from '../navigation';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateDMY } from '../utils/dateFormat';
import { lightTheme, darkTheme } from '../utils/themes';
import { useTranslation } from 'react-i18next';

type EventFormScreenNavigationProp = StackNavigationProp<EventsStackParamList, 'EventForm'>;
type EventFormScreenRouteProp = RouteProp<EventsStackParamList, 'EventForm'>;

type Props = {
  navigation: EventFormScreenNavigationProp;
  route: EventFormScreenRouteProp;
};

export default function EventFormScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { eventId } = route.params || {};
  const { eventFrames, addEventFrame, updateEventFrame, theme } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

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
    if (!name.trim()) newErrors.name = t('mobile.alerts.name_required');
    if (!startDate) newErrors.startDate = t('mobile.alerts.start_date_required');
    if (!endDate) newErrors.endDate = t('mobile.alerts.end_date_required');

    if (startDate && endDate && startDate > endDate) {
        newErrors.endDate = t('mobile.alerts.dates_invalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (andAssign = false) => {
    if (!validate()) {
      Alert.alert(t('mobile.alerts.validation_errors'), t('mobile.alerts.validation_message'));
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

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    formContainer: {
      padding: 20,
    },
    label: {
      fontSize: 16,
      marginBottom: 8,
      color: colors.text,
      fontWeight: '500',
    },
    input: {
      backgroundColor: colors.card,
      color: colors.text,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      marginBottom: 5,
      borderWidth: 1,
      borderColor: colors.border,
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
      backgroundColor: colors.card,
      color: colors.text,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      height: 100,
      textAlignVertical: 'top',
    },
    buttonContainer: {
      marginTop: 10,
    },
    suggestionsContainer: {
        backgroundColor: colors.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 10,
    },
    suggestionItem: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    suggestionText: {
      color: colors.text,
    },
    dateText: {
      color: colors.text,
    }
  }), [colors]);

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={dynamicStyles.formContainer} keyboardShouldPersistTaps="handled">
        <Text style={dynamicStyles.label}>{t('mobile.form_labels.name')}</Text>
        <TextInput
          style={[dynamicStyles.input, errors.name ? dynamicStyles.inputError : null]}
          value={name}
          onChangeText={handleNameChange}
          placeholder={t('mobile.placeholders.name')}
          placeholderTextColor={colors.placeholder}
          onFocus={() => setPlaceSuggestions([])}
        />
        {nameSuggestions.length > 0 && (
          <View style={dynamicStyles.suggestionsContainer}>
            {nameSuggestions.map(item => (
              <TouchableOpacity key={item} style={dynamicStyles.suggestionItem} onPress={() => { setName(item); setNameSuggestions([]); }}>
                <Text style={dynamicStyles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {errors.name && <Text style={dynamicStyles.errorText}>{errors.name}</Text>}

        <Text style={dynamicStyles.label}>{t('mobile.form_labels.place')}</Text>
        <TextInput
          style={dynamicStyles.input}
          value={place}
          onChangeText={handlePlaceChange}
          placeholder={t('mobile.placeholders.place')}
          placeholderTextColor={colors.placeholder}
          onFocus={() => setNameSuggestions([])}
        />
        {placeSuggestions.length > 0 && (
          <View style={dynamicStyles.suggestionsContainer}>
            {placeSuggestions.map(item => (
              <TouchableOpacity key={item} style={dynamicStyles.suggestionItem} onPress={() => { setPlace(item); setPlaceSuggestions([]); }}>
                <Text style={dynamicStyles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View>
          <Text style={dynamicStyles.label}>{t('mobile.form_labels.start_date')}</Text>
          <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={[dynamicStyles.input, errors.startDate ? dynamicStyles.inputError : null]}>
            <Text style={dynamicStyles.dateText}>{startDate ? formatDateDMY(startDate.toISOString()) : t('mobile.placeholders.start_date')}</Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker themeVariant={theme} value={startDate || new Date()} mode="date" display="default" onChange={onStartDateChange} />
          )}
          {errors.startDate && <Text style={dynamicStyles.errorText}>{errors.startDate}</Text>}
        </View>

        <View>
          <Text style={dynamicStyles.label}>{t('mobile.form_labels.end_date')}</Text>
          <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={[dynamicStyles.input, errors.endDate ? dynamicStyles.inputError : null]}>
            <Text style={dynamicStyles.dateText}>{endDate ? formatDateDMY(endDate.toISOString()) : t('mobile.placeholders.end_date')}</Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker themeVariant={theme} value={endDate || startDate || new Date()} mode="date" display="default" onChange={onEndDateChange} minimumDate={startDate || undefined} />
          )}
          {errors.endDate && <Text style={dynamicStyles.errorText}>{errors.endDate}</Text>}
        </View>

        <Text style={dynamicStyles.label}>{t('mobile.form_labels.notes')}</Text>
        <TextInput
            style={dynamicStyles.inputMulti}
            value={generalNotes}
            onChangeText={setGeneralNotes}
            placeholder={t('mobile.placeholders.notes')}
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={4}
            onFocus={() => { setNameSuggestions([]); setPlaceSuggestions([]); }}
        />
        <View style={dynamicStyles.buttonContainer}>
            <Button title={isEditMode ? t('common.save') : t('common.save')} onPress={() => handleSave(false)} color={colors.primary} />
            <View style={{ marginTop: 10 }} />
            <Button title={isEditMode ? t('common.save') + ' i Assignar' : t('common.save') + ' i Assignar'} onPress={() => handleSave(true)} color={colors.primary} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
