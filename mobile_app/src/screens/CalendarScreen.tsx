import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ListRenderItem } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useDataStore } from '../stores/dataStore';
import { EventFrame } from '../types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootTabParamList } from '../navigation';

type CalendarScreenNavigationProp = StackNavigationProp<RootTabParamList>;

const CalendarScreen = () => {
  const { eventFrames } = useDataStore();
  const navigation = useNavigation<CalendarScreenNavigationProp>();
  const [selectedDate, setSelectedDate] = useState<string>('');

  const markedDates = useMemo(() => {
    const markers: { [key: string]: any } = {};
    eventFrames.forEach(event => {
      const date = event.startDate.substring(0, 10);
      markers[date] = { ...markers[date], marked: true, dotColor: '#007AFF' };
    });
    if (selectedDate) {
      markers[selectedDate] = { ...markers[selectedDate], selected: true, selectedColor: '#007AFF' };
    }
    return markers;
  }, [eventFrames, selectedDate]);

  const eventsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return eventFrames.filter(event => event.startDate.substring(0, 10) === selectedDate);
  }, [eventFrames, selectedDate]);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const renderEventItem: ListRenderItem<EventFrame> = ({ item }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => navigation.navigate('Events', { screen: 'EventDetail', params: { eventId: item.id } })}
    >
      <Text style={styles.eventName}>{item.name}</Text>
      <Text style={styles.eventPlace}>{item.place}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        onDayPress={onDayPress}
        theme={{
          todayTextColor: '#007AFF',
          arrowColor: '#007AFF',
        }}
      />
      <View style={styles.eventListContainer}>
        {selectedDate ? (
            <FlatList
              data={eventsOnSelectedDate}
              renderItem={renderEventItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text style={styles.emptyListText}>No hi ha esdeveniments per a aquest dia.</Text>}
              ListHeaderComponent={<Text style={styles.listHeader}>Esdeveniments per al {selectedDate}</Text>}
            />
        ) : (
            <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>Seleccioneu un dia per veure els esdeveniments.</Text>
            </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  eventListContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 15,
    backgroundColor: '#f7f7f7',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  eventItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  eventName: {
    fontSize: 16,
    fontWeight: '500',
  },
  eventPlace: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

export default CalendarScreen;
