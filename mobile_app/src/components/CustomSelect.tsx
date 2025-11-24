import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDataStore } from '../stores/dataStore';
import { lightTheme, darkTheme } from '../utils/themes';

type Option = { label: string; value: string };

type CustomSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  containerStyle?: any;
  textStyle?: any;
};

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onValueChange, options, placeholder = '', containerStyle, textStyle }) => {
  const { theme } = useDataStore();
  const colors = theme === 'dark' ? darkTheme : lightTheme;
  const [visible, setVisible] = useState(false);

  const selected = options.find(o => o.value === value);

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }, containerStyle]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: value ? colors.text : colors.placeholder }, textStyle]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Icon name="chevron-down" size={20} color={colors.text} />
      </TouchableOpacity>

      <Modal visible={visible} animationType="fade" transparent>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value || item.label}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
                  onPress={() => {
                    onValueChange(item.value);
                    setVisible(false);
                  }}
                >
                  <Text style={{ color: colors.text }}>{item.label}</Text>
                  {item.value === value && <Icon name="check" size={18} color={colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    maxHeight: '70%',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
});

export default CustomSelect;
