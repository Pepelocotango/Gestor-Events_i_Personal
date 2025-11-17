import React from 'react';
import { View, Button, StyleSheet, Switch, Text } from 'react-native';

interface ActionToolbarProps {
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;
  toggleAllCards: () => void;
  areAllExpanded: boolean;
}

const ActionToolbar: React.FC<ActionToolbarProps> = ({
  sortOrder,
  setSortOrder,
  showArchived,
  setShowArchived,
  toggleAllCards,
  areAllExpanded,
}) => {
  return (
    <View style={styles.container}>
      <Button
        title={sortOrder === 'asc' ? 'Ordena Desc' : 'Ordena Asc'}
        onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
      />
      <View style={styles.switchContainer}>
        <Text>Arxivats</Text>
        <Switch value={showArchived} onValueChange={setShowArchived} />
      </View>
      <Button
        title={areAllExpanded ? 'Replega Tot' : 'Expandeix Tot'}
        onPress={toggleAllCards}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#e9e9e9',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ActionToolbar;
