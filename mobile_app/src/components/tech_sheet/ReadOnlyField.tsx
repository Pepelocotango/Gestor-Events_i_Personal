import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type ReadOnlyFieldProps = {
  label: string;
  value: string | undefined | null;
};

export default function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value || 'No especificat'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  value: {
    flex: 1,
  },
});
