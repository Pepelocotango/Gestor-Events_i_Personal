import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'ca', name: 'CA', flag: '🏴' },
    { code: 'es', name: 'ES', flag: '🇪🇸' },
    { code: 'en', name: 'EN', flag: '🇬🇧' },
  ];

  const changeLanguage = async (languageCode: string) => {
    try {
      // Save to AsyncStorage for persistence
      await AsyncStorage.setItem('app_language', languageCode);
      
      // Change i18n language
      await i18n.changeLanguage(languageCode);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  return (
    <View style={styles.container}>
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.languageButton,
            i18n.language === lang.code && styles.activeButton,
          ]}
          onPress={() => changeLanguage(lang.code)}
        >
          <Text style={styles.flag}>{lang.flag}</Text>
          <Text
            style={[
              styles.languageText,
              i18n.language === lang.code && styles.activeText,
            ]}
          >
            {lang.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  activeButton: {
    backgroundColor: '#3b82f6',
  },
  flag: {
    fontSize: 16,
    marginRight: 4,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeText: {
    color: '#ffffff',
  },
});

export default LanguageSelector;
