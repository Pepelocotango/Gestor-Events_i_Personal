import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialControlRow } from '../types';
import { useDataStore } from '../stores/dataStore';
import { lightTheme, darkTheme } from '../utils/themes';
import { useTranslation } from 'react-i18next';

interface MaterialControlListProps {
  data: MaterialControlRow[];
}

const MaterialControlList: React.FC<MaterialControlListProps> = ({ data }) => {
  const { theme } = useDataStore();
  const { t } = useTranslation();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const dynamicStyles = useMemo(() => StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        padding: 15,
        marginVertical: 5,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: colors.border,
    },
    mainRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    itemName: {
        fontWeight: 'bold',
        fontSize: 16,
        color: colors.text,
    },
    details: {
        fontSize: 12,
        color: colors.text,
        opacity: 0.7,
        marginTop: 5,
    },
    negativeBalance: {
        color: colors['status-no'],
        fontWeight: 'bold',
    },
    positiveBalance: {
        color: colors['status-yes'],
        fontWeight: 'bold',
    },
    breakdownContainer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    breakdownTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
        color: colors.text,
    },
    breakdownItem: {
        marginLeft: 10,
        color: colors.text,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: colors.text,
    },
  }), [colors]);

  const renderItem = ({ item }: { item: MaterialControlRow }) => {
    const isExpanded = expandedIds.has(item.item.id);
    const balanceIsNegative = item.balance < 0;

    return (
      <View style={dynamicStyles.card}>
        <TouchableOpacity onPress={() => toggleExpand(item.item.id)}>
          <View style={dynamicStyles.mainRow}>
            <Text style={dynamicStyles.itemName}>{item.item.name}</Text>
            <Text style={balanceIsNegative ? dynamicStyles.negativeBalance : dynamicStyles.positiveBalance}>
              {t('mobile.material.balance')}: {item.balance}
            </Text>
          </View>
          <Text style={{color: colors.text}}>{t('mobile.material.stock')}: {item.item.stock} / {t('mobile.material.demand')}: {item.totalDemand}</Text>
          <Text style={dynamicStyles.details}>Categoria: {item.item.category} / {t('mobile.material.location')}: {item.item.location}</Text>
        </TouchableOpacity>
        {isExpanded && (
          <View style={dynamicStyles.breakdownContainer}>
            <Text style={dynamicStyles.breakdownTitle}>{t('mcc.breakdown_title')}:</Text>
            {item.breakdown.map(bd => (
              <Text key={bd.eventFrameId} style={dynamicStyles.breakdownItem}>
                - {bd.eventName}: {bd.quantity} {t('mcc.units_suffix')}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={item => item.item.id}
      ListEmptyComponent={<Text style={dynamicStyles.emptyText}>{t('mobile.material_control.no_results')}</Text>}
      contentContainerStyle={{ paddingBottom: 80 }}
    />
  );
};

export default MaterialControlList;
