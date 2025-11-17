import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialStackParamList } from '../navigation';
import { MaterialItem } from '../types';

type MaterialFormScreenNavigationProp = StackNavigationProp<MaterialStackParamList, 'MaterialForm'>;
type MaterialFormScreenRouteProp = RouteProp<MaterialStackParamList, 'MaterialForm'>;

type Props = {
  navigation: MaterialFormScreenNavigationProp;
  route: MaterialFormScreenRouteProp;
};

const MaterialFormScreen = ({ navigation, route }: Props) => {
  const { materialId } = route.params;
  const { materialItems, addMaterialItem, updateMaterialItem } = useDataStore();

  const [item, setItem] = useState<Omit<MaterialItem, 'id'>>({
    name: '',
    category: '',
    stock: 0,
    location: '',
    notes: '',
  });

  useEffect(() => {
    if (materialId) {
      const existingItem = materialItems.find(i => i.id === materialId);
      if (existingItem) {
        setItem(existingItem);
      }
    }
  }, [materialId, materialItems]);

  const handleSave = () => {
    if (!item.name.trim()) {
      Alert.alert("Error", "El camp 'Nom' és obligatori.");
      return;
    }
    if (!item.category.trim()) {
      Alert.alert("Error", "El camp 'Categoria' és obligatori.");
      return;
    }

    const isDuplicate = materialItems.some(i =>
        i.name.trim().toLowerCase() === item.name.trim().toLowerCase() &&
        i.id !== materialId
    );

    if (isDuplicate) {
        Alert.alert("Error", "Ja existeix un ítem de material amb aquest nom.");
        return;
    }

    if (materialId) {
      updateMaterialItem(materialId, { ...item, name: item.name.trim(), category: item.category.trim() });
    } else {
      addMaterialItem(item);
    }
    navigation.goBack();
  };

  const handleChange = (field: keyof Omit<MaterialItem, 'id'>, value: string | number) => {
    setItem(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Nom</Text>
      <TextInput style={styles.input} value={item.name} onChangeText={(val) => handleChange('name', val)} />

      <Text style={styles.label}>Categoria</Text>
      <TextInput style={styles.input} value={item.category} onChangeText={(val) => handleChange('category', val)} />

      <Text style={styles.label}>Stock</Text>
      <TextInput style={styles.input} value={String(item.stock)} onChangeText={(val) => handleChange('stock', parseInt(val) || 0)} keyboardType="numeric" />

      <Text style={styles.label}>Ubicació</Text>
      <TextInput style={styles.input} value={item.location} onChangeText={(val) => handleChange('location', val)} />

      <Text style={styles.label}>Notes</Text>
      <TextInput style={styles.inputMulti} value={item.notes} onChangeText={(val) => handleChange('notes', val)} multiline />

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

export default MaterialFormScreen;
