import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import 'uuid';
import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EventsScreen from './src/screens/EventsScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import EventFormScreen from './src/screens/EventFormScreen';
import AssignmentFormScreen from './src/screens/AssignmentFormScreen';
import PeopleScreen from './src/screens/PeopleScreen';
import PersonFormScreen from './src/screens/PersonFormScreen';
import MaterialScreen from './src/screens/MaterialScreen';
import MaterialFormScreen from './src/screens/MaterialFormScreen';
import MaterialControlScreen from './src/screens/MaterialControlScreen';
import {
  RootTabParamList,
  EventsStackParamList,
  PeopleStackParamList,
  MaterialStackParamList,
} from './src/navigation';

const EventsStack = createStackNavigator<EventsStackParamList>();
const PeopleStack = createStackNavigator<PeopleStackParamList>();
const MaterialStack = createStackNavigator<MaterialStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const EventsStackNavigator = () => (
  <EventsStack.Navigator>
    <EventsStack.Screen name="EventList" component={EventsScreen} options={{ title: 'Esdeveniments' }} />
    <EventsStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: "Detalls de l'Esdeveniment" }} />
    <EventsStack.Screen
      name="EventForm"
      component={EventFormScreen}
      options={({ route }) => ({
        title: route.params?.eventId ? 'Editar Esdeveniment' : 'Nou Esdeveniment',
      })}
    />
    <EventsStack.Screen
      name="AssignmentForm"
      component={AssignmentFormScreen}
      options={({ route }) => ({
        title: route.params?.assignmentId ? 'Editar Assignació' : 'Nova Assignació',
      })}
    />
  </EventsStack.Navigator>
);

const PeopleStackNavigator = () => (
  <PeopleStack.Navigator>
    <PeopleStack.Screen name="PersonList" component={PeopleScreen} options={{ title: 'Persones' }} />
    <PeopleStack.Screen
      name="PersonForm"
      component={PersonFormScreen}
      options={({ route }) => ({
        title: route.params?.personId ? 'Editar Persona' : 'Nova Persona',
      })}
    />
  </PeopleStack.Navigator>
);

const MaterialStackNavigator = () => (
  <MaterialStack.Navigator>
    <MaterialStack.Screen name="MaterialList" component={MaterialScreen} options={{ title: 'Material' }} />
    <MaterialStack.Screen
      name="MaterialForm"
      component={MaterialFormScreen}
      options={({ route }) => ({
        title: route.params?.materialId ? 'Editar Material' : 'Nou Material',
      })}
    />
    <MaterialStack.Screen name="MaterialControl" component={MaterialControlScreen} options={{ title: 'Centre de Control' }} />
  </MaterialStack.Navigator>
);

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Events') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'People') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Material') {
              iconName = focused ? 'cube' : 'cube-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Events" component={EventsStackNavigator} options={{ title: 'Esdeveniments', headerShown: false }} />
        <Tab.Screen name="People" component={PeopleStackNavigator} options={{ title: 'Persones', headerShown: false }} />
        <Tab.Screen name="Material" component={MaterialStackNavigator} options={{ title: 'Material', headerShown: false }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
