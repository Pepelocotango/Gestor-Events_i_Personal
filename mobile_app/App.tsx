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
import CustomHeader from './src/components/CustomHeader';
import {
  RootTabParamList,
  EventsStackParamList,
  PeopleStackParamList,
  MaterialStackParamList,
  ControlCenterStackParamList,
} from './src/navigation';

const EventsStack = createStackNavigator<EventsStackParamList>();
const PeopleStack = createStackNavigator<PeopleStackParamList>();
const MaterialStack = createStackNavigator<MaterialStackParamList>();
const ControlCenterStack = createStackNavigator<ControlCenterStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const commonScreenOptions = {
  header: (props: any) => <CustomHeader {...props} />,
};

const EventsStackNavigator = () => (
  <EventsStack.Navigator screenOptions={commonScreenOptions}>
    <EventsStack.Screen name="EventList" component={EventsScreen} />
    <EventsStack.Screen name="EventDetail" component={EventDetailScreen} />
    <EventsStack.Screen name="EventForm" component={EventFormScreen} />
    <EventsStack.Screen name="AssignmentForm" component={AssignmentFormScreen} />
  </EventsStack.Navigator>
);

const PeopleStackNavigator = () => (
  <PeopleStack.Navigator screenOptions={commonScreenOptions}>
    <PeopleStack.Screen name="PersonList" component={PeopleScreen} />
    <PeopleStack.Screen name="PersonForm" component={PersonFormScreen} />
  </PeopleStack.Navigator>
);

const MaterialStackNavigator = () => (
  <MaterialStack.Navigator screenOptions={commonScreenOptions}>
    <MaterialStack.Screen name="MaterialList" component={MaterialScreen} />
    <MaterialStack.Screen name="MaterialForm" component={MaterialFormScreen} />
  </MaterialStack.Navigator>
);

const ControlCenterStackNavigator = () => (
  <ControlCenterStack.Navigator screenOptions={commonScreenOptions}>
    <ControlCenterStack.Screen name="MaterialControl" component={MaterialControlScreen} />
  </ControlCenterStack.Navigator>
);

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string;

            switch (route.name) {
                case 'Events':
                  iconName = focused ? 'calendar' : 'calendar-outline';
                  break;
                case 'People':
                  iconName = focused ? 'people' : 'people-outline';
                  break;
                case 'Material':
                  iconName = focused ? 'cube' : 'cube-outline';
                  break;
                case 'ControlCenter':
                  iconName = focused ? 'server' : 'server-outline';
                  break;
                default:
                  iconName = 'alert-circle-outline';
                  break;
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Events" component={EventsStackNavigator} options={{ title: 'Esdeveniments' }} />
          <Tab.Screen name="People" component={PeopleStackNavigator} options={{ title: 'Persones' }} />
          <Tab.Screen name="Material" component={MaterialStackNavigator} options={{ title: 'Material' }} />
          <Tab.Screen name="ControlCenter" component={ControlCenterStackNavigator} options={{ title: 'Centre de Control' }} />
        </Tab.Navigator>
    </NavigationContainer>
  );
}
