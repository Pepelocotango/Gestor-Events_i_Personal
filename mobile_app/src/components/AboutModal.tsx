import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDataStore } from '../stores/dataStore';
import { lightTheme, darkTheme } from '../utils/themes';
import Constants from 'expo-constants';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

const GITHUB_URL = 'https://github.com/Pepelocotango/Gestor-Events_i_Personal';
const PAYPAL_URL = 'https://paypal.me/RosePep';

const AboutModal: React.FC<AboutModalProps> = ({ visible, onClose }) => {
  const theme = useDataStore((state) => state.theme);
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  
  const appName = Constants.expoConfig?.name || "Gestor d'Esdeveniments";
  const appVersion = Constants.expoConfig?.version ? `v${Constants.expoConfig.version}` : '';
  const appDescription = "Aplicació mòbil per visualitzar i gestionar esdeveniments, personal i material. Permet consultar i editar la informació bàsica dels esdeveniments, gestionar el personal assignat i revisar l'inventari de material. Sincronitza amb l'aplicació d'escriptori per a una gestió completa.";

  const handleLinkPress = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const dynamicStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 10,
      width: '85%',
      maxWidth: 400,
      padding: 20,
    },
    titleContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    version: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.7,
      marginBottom: 8,
    },
    description: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    linkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 6,
      marginBottom: 10,
    },
    linkText: {
      color: colors.background,
      marginLeft: 8,
      fontWeight: '500',
    },
    closeButton: {
      marginTop: 20,
      padding: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
    },
    closeButtonText: {
      color: colors.text,
      fontWeight: '500',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={dynamicStyles.modalOverlay} 
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={dynamicStyles.modalContent}>
          <View style={dynamicStyles.titleContainer}>
            <Text style={dynamicStyles.title}>{appName}</Text>
            <Text style={dynamicStyles.version}>Versió {appVersion}</Text>
            <Text style={dynamicStyles.description}>
              {appDescription}
            </Text>
          </View>

          <Text style={dynamicStyles.sectionTitle}>Enllaços d'Interès</Text>
          
          <TouchableOpacity 
            style={dynamicStyles.linkButton}
            onPress={() => handleLinkPress(GITHUB_URL)}
          >
            <Text style={dynamicStyles.linkText}>Repositori a GitHub</Text>
            <Icon name="open-in-new" size={20} color={colors.background} style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={dynamicStyles.linkButton}
            onPress={() => handleLinkPress(PAYPAL_URL)}
          >
            <Text style={dynamicStyles.linkText}>Fes una donació</Text>
            <Icon name="open-in-new" size={20} color={colors.background} style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={dynamicStyles.closeButton}
            onPress={onClose}
          >
            <Text style={dynamicStyles.closeButtonText}>Tancar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default AboutModal;
