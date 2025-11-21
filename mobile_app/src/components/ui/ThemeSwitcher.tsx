import React from 'react';
import { TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDataStore } from '../../stores/dataStore';
import { lightTheme, darkTheme } from '../../utils/themes';

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useDataStore((state) => ({
    theme: state.theme,
    toggleTheme: state.toggleTheme,
  }));
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 15 }}>
      <Ionicons
        name={theme === 'dark' ? 'sunny' : 'moon'}
        size={24}
        color={colors.text}
      />
    </TouchableOpacity>
  );
};

export default ThemeSwitcher;
