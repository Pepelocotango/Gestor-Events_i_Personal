import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { EventsStackParamList } from '../navigation';
import { Assignment, AssignmentStatus } from '../types';
import CustomSelect from '../components/CustomSelect';
import { formatDateDMY } from '../utils/dateFormat';
import DateTimePicker from '@react-native-community/datetimepicker';
import { lightTheme, darkTheme } from '../utils/themes';
import { useTranslation } from 'react-i18next';

type AssignmentFormScreenNavigationProp = StackNavigationProp<EventsStackParamList, 'AssignmentForm'>;
type AssignmentFormScreenRouteProp = RouteProp<EventsStackParamList, 'AssignmentForm'>;

type Props = {
  navigation: AssignmentFormScreenNavigationProp;
  route: AssignmentFormScreenRouteProp;
};

const AssignmentFormScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const { eventFrameId, assignmentId } = route.params;
  const { eventFrames, peopleGroups, addAssignment, updateAssignment, theme } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const event = eventFrames.find(ef => ef.id === eventFrameId);
  const originalAssignment = event?.assignments.find(a => a.id === assignmentId);

  const [personGroupId, setPersonGroupId] = useState('');
  const [role, setRole] = useState('');
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
      setRole(originalAssignment.role || '');
      setStartDate(new Date(originalAssignment.startDate));
      setEndDate(new Date(originalAssignment.endDate));
      setStatus(originalAssignment.status);
      setNotes(originalAssignment.notes || '');
    }
  }, [eventFrameId, assignmentId, originalAssignment]);

  const handlePersonChange = (newPersonGroupId: string) => {
    setPersonGroupId(newPersonGroupId);
    const selectedPerson = peopleGroups.find(p => p.id === newPersonGroupId);
    if (selectedPerson?.role && role === '') {
      setRole(selectedPerson.role);
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!personGroupId) newErrors.personGroupId = t('mobile.validation.select_person');
    if (!startDate) newErrors.startDate = t('mobile.validation.start_date_required');
    if (!endDate) newErrors.endDate = t('mobile.validation.end_date_required');

    if (startDate && endDate) {
        if (startDate > endDate) {
            newErrors.endDate = t('mobile.alerts.dates_invalid');
        }
        if (event) {
            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate);
            if (startDate < eventStart || endDate > eventEnd) {
                newErrors.datesRange = t('mobile.alerts.dates_invalid') + ` (${formatDateDMY(event.startDate)} - ${formatDateDMY(event.endDate)}).`;
            }
        }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const performSave = async (force: boolean = false) => {
    if (!validate()) {
      Alert.alert(t('mobile.alerts.validation_errors'), t('mobile.alerts.validation_message'));
      return;
    }

    const assignmentData = {
        personGroupId,
        eventFrameId,
        startDate: startDate!.toISOString().split('T')[0],
        endDate: endDate!.toISOString().split('T')[0],
        status,
        notes,
        role,
    };

    let conflictMessage: string | null = null;
    if (assignmentId) {
      conflictMessage = await updateAssignment(eventFrameId, assignmentId, assignmentData, force);
    } else {
      conflictMessage = await addAssignment(eventFrameId, assignmentData as Omit<Assignment, 'id'>, force);
    }

    if (conflictMessage) {
      Alert.alert(
        t('mobile.alerts.assignment_conflict'),
        conflictMessage,
        [
          { text: t('mobile.alerts.cancel'), style: "cancel" },
          { text: t('common.save'), onPress: () => performSave(true) }
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

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 60,
    },
    label: {
      fontSize: 16,
      marginBottom: 8,
      color: colors.text,
      fontWeight: '500',
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      color: colors.text,
    },
    dateText: {
      color: colors.text,
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
      backgroundColor: colors.card,
      borderRadius: 8,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
    },
    picker: {
      color: colors.text,
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
    text: {
      color: colors.text,
    }
  }), [colors]);

  const peopleOptions = [{ label: '-- Seleccioneu --', value: '' }, ...peopleGroups.map(pg => ({ label: pg.name, value: pg.id }))];
  const statusOptions = Object.values(AssignmentStatus).map(s => ({ label: s, value: s }));

  if (!event) {
    return <View style={dynamicStyles.container}><Text style={dynamicStyles.text}>{t('mobile.tech_sheet.event_not_found')}</Text></View>;
  }

  return (
    <ScrollView style={dynamicStyles.container} contentContainerStyle={dynamicStyles.contentContainer}>

      <Text style={dynamicStyles.label}>{t('mobile.form_labels.name')}</Text>
      <View style={[dynamicStyles.pickerContainer, errors.personGroupId ? dynamicStyles.inputError : null]}>
        <CustomSelect
          value={personGroupId}
          onValueChange={handlePersonChange}
          options={peopleOptions}
          placeholder={t('mobile.placeholders.select_option')}
          containerStyle={{}}
        />
      </View>
      {errors.personGroupId && <Text style={dynamicStyles.errorText}>{errors.personGroupId}</Text>}

      <Text style={dynamicStyles.label}>{t('mobile.form_labels.role')}</Text>
      <TextInput
        style={dynamicStyles.input}
        value={role}
        onChangeText={setRole}
        placeholder={t('mobile.placeholders.specify_role')}
        placeholderTextColor={colors.placeholder}
      />

      <View>
          <Text style={dynamicStyles.label}>{t('mobile.form_labels.start_date')}</Text>
          <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={[dynamicStyles.input, errors.startDate || errors.datesRange ? dynamicStyles.inputError : null]}>
            <Text style={dynamicStyles.dateText}>{startDate ? formatDateDMY(startDate.toISOString()) : t('mobile.placeholders.start_date')}</Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker themeVariant={theme} value={startDate || new Date(event.startDate)} mode="date" display="default" onChange={onStartDateChange} />
          )}
          {errors.startDate && <Text style={dynamicStyles.errorText}>{errors.startDate}</Text>}
        </View>

        <View>
          <Text style={dynamicStyles.label}>{t('mobile.form_labels.end_date')}</Text>
          <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={[dynamicStyles.input, errors.endDate || errors.datesRange ? dynamicStyles.inputError : null]}>
            <Text style={dynamicStyles.dateText}>{endDate ? formatDateDMY(endDate.toISOString()) : t('mobile.placeholders.end_date')}</Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker themeVariant={theme} value={endDate || startDate || new Date(event.endDate)} mode="date" display="default" onChange={onEndDateChange} minimumDate={startDate || undefined} />
          )}
          {errors.endDate && <Text style={dynamicStyles.errorText}>{errors.endDate}</Text>}
        </View>
        {errors.datesRange && <Text style={dynamicStyles.errorText}>{errors.datesRange}</Text>}

      <Text style={dynamicStyles.label}>{t('common.status')}</Text>
      <View style={dynamicStyles.pickerContainer}>
          <CustomSelect
            value={status}
            onValueChange={(val) => setStatus(val as AssignmentStatus)}
            options={statusOptions}
            placeholder={t('mobile.placeholders.select_option')}
          />
      </View>

      <Text style={dynamicStyles.label}>{t('mobile.form_labels.notes')}</Text>
      <TextInput style={dynamicStyles.inputMulti} value={notes} onChangeText={setNotes} multiline placeholder={t('mobile.placeholders.notes')} placeholderTextColor={colors.placeholder} />

      <Button title={assignmentId ? t('mobile.buttons.save_changes') : t('mobile.buttons.create_assignment')} onPress={() => performSave(false)} color={colors.primary} />
    </ScrollView>
  );
};

export default AssignmentFormScreen;
