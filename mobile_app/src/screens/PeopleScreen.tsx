import React, { useLayoutEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { PeopleStackParamList } from '../navigation';
import { PersonGroup } from '../types';

type PeopleScreenNavigationProp = StackNavigationProp<PeopleStackParamList, 'PersonList'>;

type Props = {
  navigation: PeopleScreenNavigationProp;
};

const PeopleScreen = ({ navigation }: Props) => {
  const { peopleGroups, deletePersonGroup } = useDataStore();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={() => navigation.navigate('PersonForm', {})}
          title="Afegir"
        />
      ),
    });
  }, [navigation]);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Eliminar Persona",
      "Esteu segur que voleu eliminar aquesta persona?",
      [
        { text: "Cancel·lar", style: "cancel" },
        { text: "Eliminar", onPress: () => deletePersonGroup(id), style: 'destructive' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={peopleGroups}
        keyExtractor={(item: PersonGroup) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemContent}>
              <Text style={styles.itemText}>{item.name}</Text>
              <Text style={styles.itemSubText}>{item.role}</Text>
            </View>
            <View style={styles.itemActions}>
              <Button title="Editar" onPress={() => navigation.navigate('PersonForm', { personId: item.id })} />
              <Button title="Eliminar" onPress={() => handleDelete(item.id)} color="red" />
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemSubText: {
    fontSize: 14,
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 10,
  },
});

export default PeopleScreen;
