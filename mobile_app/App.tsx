import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import DataSourceScreen from './src/screens/DataSourceScreen';
import { RootStackParamList } from './src/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="DataSource">
        <Stack.Screen
          name="DataSource"
          component={DataSourceScreen}
          options={{ title: 'Selecció de Dades' }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Esdeveniments' }}
        />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{ title: 'Detalls de l\'Esdeveniment' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
