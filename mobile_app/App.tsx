import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import 'uuid';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import EventFormScreen from './src/screens/EventFormScreen';
import { RootStackParamList } from './src/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Esdeveniments' }}
        />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{ title: "Detalls de l'Esdeveniment" }}
        />
        <Stack.Screen
          name="EventForm"
          component={EventFormScreen}
          options={({ route }) => ({
            title: route.params?.eventId ? 'Editar Esdeveniment' : 'Nou Esdeveniment',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
