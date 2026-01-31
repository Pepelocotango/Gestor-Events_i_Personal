import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDataStore } from '../stores/dataStore';
import { SAFFileService } from '../services/SAFFileService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Constants from 'expo-constants';
import ThemeSwitcher from './ui/ThemeSwitcher';
import { lightTheme, darkTheme } from '../utils/themes';
import AboutModal from './AboutModal';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from 'react-i18next';

const fileService = new SAFFileService();

type ActiveScreen = 'EventList' | 'PersonList' | 'MaterialList' | 'MaterialControl' | 'TechSheetList' | 'Summary' | 'CalendarView';

interface CustomHeaderProps {
  navigation: any;
  route: { name: ActiveScreen };
}

const CustomHeader = ({ navigation, route }: CustomHeaderProps) => {
  const {
    fileName,
    hasUnsavedChanges,
    setData,
    clearData,
    saveFileAs,
    shareFile,
    theme,
  } = useDataStore();
  const { t } = useTranslation();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const canGoBack = navigation.canGoBack();
  const [isAboutModalVisible, setAboutModalVisible] = useState(false);

  const handleOpenFile = async () => {
    const openAndSetData = async () => {
      try {
        const result = await fileService.openFile();
        if (result) {
          setData(result.content, result.name, result.uri);
        }
      } catch (error) {
        Alert.alert("Error", t('mobile.alerts.invalid_file'));
      }
    };

    if (hasUnsavedChanges) {
      Alert.alert(
        t('mobile.alerts.discard_changes'),
        t('mobile.alerts.discard_changes_message'),
        [
          { text: t('mobile.alerts.cancel'), style: "cancel" },
          { text: t('mobile.alerts.discard'), style: "destructive", onPress: openAndSetData },
        ]
      );
    } else {
      await openAndSetData();
    }
  };

  const handleSaveFileAs = async () => {
    try {
      await saveFileAs();
    } catch (e) {
      Alert.alert("Error", "No s'ha pogut desar el fitxer amb un nom nou.");
    }
  };

  const handleShareFile = async () => {
    Alert.alert(
      "A punt per compartir",
      t('mobile.alerts.share_instructions'),
       [
        {
          text: t('mobile.alerts.ok'),
          onPress: async () => {
            try {
              await shareFile();
            } catch (e) {
              Alert.alert("Error", "No s'ha pogut compartir el fitxer.");
            }
          },
        },
      ]
    );
  };

  const handleCloseFile = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        t('mobile.alerts.discard_changes'),
        t('mobile.alerts.discard_changes_message'),
        [
          { text: t('mobile.alerts.cancel'), style: "cancel" },
          { text: t('mobile.alerts.discard'), style: "destructive", onPress: clearData },
        ]
      );
    } else {
      clearData();
    }
  };

  const appVersion = Constants.expoConfig?.extra?.version || Constants.expoConfig?.version;
  const headerTitle = fileName
    ? fileName
    : `Gestor d'Esdeveniments v${appVersion}`;

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      paddingTop: 35,
      paddingBottom: 8,
      paddingHorizontal: 15,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.7,
    },
    openButtonText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: 'bold',
    },
    iconColor: {
      color: colors.text,
    },
    disabledIconColor: {
      color: colors.placeholder,
    },
    accentIconColor: {
      color: colors.primary,
    },
    destructiveIconColor: {
      color: colors.destructive,
    },
  }), [colors]);

  return (
    <>
      <View style={dynamicStyles.container}>
        <View style={styles.topRow}>
          <Text style={dynamicStyles.title}>{headerTitle}</Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.buttonGroup}>
            {canGoBack && (
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={28} style={dynamicStyles.iconColor} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.buttonGroup}>
            {fileName ? (
              <>
                <TouchableOpacity onPress={handleSaveFileAs}>
                  <Icon name="content-save-all-outline" size={28} style={dynamicStyles.iconColor} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShareFile}>
                  <Icon name="share-variant" size={28} style={hasUnsavedChanges ? dynamicStyles.accentIconColor : dynamicStyles.iconColor} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCloseFile}>
                  <Icon name="close-circle-outline" size={28} style={dynamicStyles.destructiveIconColor} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={handleOpenFile} style={styles.openButton}>
                <Icon name="folder-open-outline" size={28} style={dynamicStyles.accentIconColor} />
                <Text style={dynamicStyles.openButtonText}>{t('common.open')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setAboutModalVisible(true)}>
              <Icon name="information-outline" size={28} style={dynamicStyles.iconColor} />
            </TouchableOpacity>
            <ThemeSwitcher />
            <LanguageSelector />
          </View>
        </View>
      </View>
      
      <AboutModal 
        visible={isAboutModalVisible}
        onClose={() => setAboutModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  topRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default CustomHeader;
