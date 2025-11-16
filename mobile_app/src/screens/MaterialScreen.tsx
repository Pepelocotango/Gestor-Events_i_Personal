import React, { useLayoutEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialStackParamList } from '../navigation';
import { MaterialItem } from '../types';

type MaterialScreenNavigationProp = StackNavigationProp<MaterialStackParamList, 'MaterialList'>;

type Props = {
  navigation: MaterialScreenNavigationProp;
};

const MaterialScreen = ({ navigation }: Props) => {
  const { materialItems, deleteMaterialItem } = useDataStore();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={() => navigation.navigate('MaterialForm', {})}
          title="Afegir"
        />
      ),
    });
  }, [navigation]);

  const handleDelete = (id: string) => {
    Alert.alert(
      "Eliminar Material",
      "Esteu segur que voleu eliminar aquest ítem de material?",
      [
        { text: "Cancel·lar", style: "cancel" },
        { text: "Eliminar", onPress: () => deleteMaterialItem(id), style: 'destructive' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={materialItems}
        keyExtractor={(item: MaterialItem) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemContent}>
              <Text style={styles.itemText}>{item.name}</Text>
              <Text style={styles.itemSubText}>Stock: {item.stock}</Text>
            </View>
            <View style={styles.itemActions}>
              <Button title="Editar" onPress={() => navigation.navigate('MaterialForm', { materialId: item.id })} />
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

export default MaterialScreen;
