import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';

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

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleExpansion} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.icon}>{isExpanded ? '-' : '+'}</Text>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    borderColor: '#e0e0e0',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  icon: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 15,
    borderTopColor: '#e0e0e0',
    borderTopWidth: 1,
  },
});

export default CollapsibleSection;
