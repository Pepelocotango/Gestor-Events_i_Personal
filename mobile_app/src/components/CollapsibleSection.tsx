import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useDataStore } from '../stores/dataStore';
import { lightTheme, darkTheme } from '../utils/themes';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, isExpanded: controlledIsExpanded, onToggle }) => {
  const { theme } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const [internalIsExpanded, setInternalIsExpanded] = useState(true);

  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : internalIsExpanded;

  const toggleExpansion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsExpanded(!internalIsExpanded);
    }
  };

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 8,
      marginBottom: 10,
      overflow: 'hidden',
      borderColor: colors.border,
      borderWidth: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      backgroundColor: colors.card,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    icon: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
    },
    content: {
      padding: 15,
      borderTopColor: colors.border,
      borderTopWidth: 1,
    },
  }), [colors]);

  return (
    <View style={dynamicStyles.container}>
      <TouchableOpacity onPress={toggleExpansion} style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>{title}</Text>
        <Text style={dynamicStyles.icon}>{isExpanded ? '-' : '+'}</Text>
      </TouchableOpacity>
      {isExpanded && (
        <View style={dynamicStyles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

export default CollapsibleSection;
