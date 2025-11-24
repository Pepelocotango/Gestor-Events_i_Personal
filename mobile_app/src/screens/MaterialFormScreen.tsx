import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialStackParamList } from '../navigation';
import { MaterialItem } from '../types';
import { lightTheme, darkTheme } from '../utils/themes';

type MaterialFormScreenNavigationProp = StackNavigationProp<MaterialStackParamList, 'MaterialForm'>;
type MaterialFormScreenRouteProp = RouteProp<MaterialStackParamList, 'MaterialForm'>;

type Props = {
  navigation: MaterialFormScreenNavigationProp;
  route: MaterialFormScreenRouteProp;
};

const MaterialFormScreen = ({ navigation, route }: Props) => {
  const { materialId } = route.params;
  const { materialItems, addMaterialItem, updateMaterialItem, theme } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;

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
      <TextInput style={dynamicStyles.input} value={item.name} onChangeText={(val) => handleChange('name', val)} placeholderTextColor={colors.placeholder} />

      <Text style={dynamicStyles.label}>Categoria</Text>
      <TextInput style={dynamicStyles.input} value={item.category} onChangeText={(val) => handleChange('category', val)} placeholderTextColor={colors.placeholder} />

      <Text style={dynamicStyles.label}>Stock</Text>
      <TextInput style={dynamicStyles.input} value={String(item.stock)} onChangeText={(val) => handleChange('stock', parseInt(val) || 0)} keyboardType="numeric" placeholderTextColor={colors.placeholder} />

      <Text style={dynamicStyles.label}>Ubicació</Text>
      <TextInput style={dynamicStyles.input} value={item.location} onChangeText={(val) => handleChange('location', val)} placeholderTextColor={colors.placeholder} />

      <Text style={dynamicStyles.label}>Notes</Text>
      <TextInput style={dynamicStyles.inputMulti} value={item.notes} onChangeText={(val) => handleChange('notes', val)} multiline placeholderTextColor={colors.placeholder} />

      <Button title="Desar" onPress={handleSave} color={colors.primary} />
    </ScrollView>
  );
};

export default MaterialFormScreen;
