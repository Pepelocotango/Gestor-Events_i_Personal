import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();

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
      Alert.alert(t('common.error'), t('people.name_required'));
      return;
    }
    if (!item.category.trim()) {
      Alert.alert(t('common.error'), t('material.name_required'));
      return;
    }

    const isDuplicate = materialItems.some(i =>
        i.name.trim().toLowerCase() === item.name.trim().toLowerCase() &&
        i.id !== materialId
    );

    if (isDuplicate) {
        Alert.alert(t('common.error'), t('material.name_duplicate'));
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
        <Text style={dynamicStyles.label}>{t('people.name_label')}</Text>
        <TextInput style={dynamicStyles.input} value={item.name} onChangeText={(val) => handleChange('name', val)} placeholderTextColor={colors.placeholder} />

        <Text style={dynamicStyles.label}>{t('material.category_label')}</Text>
        <TextInput style={dynamicStyles.input} value={item.category} onChangeText={(val) => handleChange('category', val)} placeholderTextColor={colors.placeholder} />

        <Text style={dynamicStyles.label}>{t('material.stock_label')}</Text>
        <TextInput style={dynamicStyles.input} value={String(item.stock)} onChangeText={(val) => handleChange('stock', parseInt(val) || 0)} keyboardType="numeric" placeholderTextColor={colors.placeholder} />

        <Text style={dynamicStyles.label}>{t('material.location_label')}</Text>
        <TextInput style={dynamicStyles.input} value={item.location} onChangeText={(val) => handleChange('location', val)} placeholderTextColor={colors.placeholder} />

        <Text style={dynamicStyles.label}>{t('material.notes_label')}</Text>
        <TextInput style={dynamicStyles.inputMulti} value={item.notes} onChangeText={(val) => handleChange('notes', val)} multiline placeholderTextColor={colors.placeholder} />

        <Button title={t('common.save')} onPress={handleSave} color={colors.primary} />
      </ScrollView>
    </View>
  );
};

export default MaterialFormScreen;
