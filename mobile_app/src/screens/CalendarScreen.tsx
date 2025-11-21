import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ListRenderItem } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useDataStore } from '../stores/dataStore';
import { EventFrame } from '../types';
import { lightTheme, darkTheme } from '../utils/themes';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootTabParamList } from '../navigation';

type CalendarScreenNavigationProp = StackNavigationProp<RootTabParamList>;

const CalendarScreen = () => {
  const { eventFrames, theme } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const navigation = useNavigation<CalendarScreenNavigationProp>();
  const [selectedDate, setSelectedDate] = useState<string>('');

  const calendarTheme = useMemo(() => ({
    calendarBackground: colors.background,
    textSectionTitleColor: colors.text,
    dayTextColor: colors.text,
    todayTextColor: colors.primary,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: '#ffffff',
    monthTextColor: colors.text,
    arrowColor: colors.primary,
    'stylesheet.calendar.header': {
      week: {
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderColor: colors.border,
      }
    }
  }), [colors]);

  const markedDates = useMemo(() => {
    const markers: { [key: string]: any } = {};
    eventFrames.forEach(event => {
      const date = event.startDate.substring(0, 10);
      markers[date] = { ...markers[date], marked: true, dotColor: colors.primary };
    });
    if (selectedDate) {
      markers[selectedDate] = { ...markers[selectedDate], selected: true, selectedColor: colors.primary };
    }
    return markers;
  }, [eventFrames, selectedDate, colors.primary]);

  const eventsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return eventFrames.filter(event => event.startDate.substring(0, 10) === selectedDate);
  }, [eventFrames, selectedDate]);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    eventListContainer: {
      flex: 1,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    listHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      padding: 15,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      color: colors.text,
    },
    eventItem: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    eventName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    eventPlace: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.7,
      marginTop: 4,
    },
    placeholderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: 16,
      color: colors.text,
      opacity: 0.7,
    },
    emptyListText: {
      textAlign: 'center',
      marginTop: 20,
      fontSize: 16,
      color: colors.text,
      opacity: 0.7,
    },
  }), [colors]);

  const renderEventItem: ListRenderItem<EventFrame> = ({ item }) => (
    <TouchableOpacity
      style={dynamicStyles.eventItem}
      onPress={() => navigation.navigate('Events', { screen: 'EventDetail', params: { eventId: item.id } })}
    >
      <Text style={dynamicStyles.eventName}>{item.name}</Text>
      <Text style={dynamicStyles.eventPlace}>{item.place}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={dynamicStyles.container}>
      <Calendar
        markedDates={markedDates}
        onDayPress={onDayPress}
        theme={calendarTheme}
      />
      <View style={dynamicStyles.eventListContainer}>
        {selectedDate ? (
            <FlatList
              data={eventsOnSelectedDate}
              renderItem={renderEventItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text style={dynamicStyles.emptyListText}>No hi ha esdeveniments per a aquest dia.</Text>}
              ListHeaderComponent={<Text style={dynamicStyles.listHeader}>Esdeveniments per al {selectedDate}</Text>}
            />
        ) : (
            <View style={dynamicStyles.placeholderContainer}>
                <Text style={dynamicStyles.placeholderText}>Seleccioneu un dia per veure els esdeveniments.</Text>
            </View>
        )}
      </View>
    </View>
  );
};

export default CalendarScreen;
