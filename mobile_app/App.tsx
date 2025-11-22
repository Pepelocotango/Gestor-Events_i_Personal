import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import 'uuid';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDataStore } from './src/stores/dataStore';
import EventsScreen from './src/screens/EventsScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import TechSheetDetailScreen from './src/screens/TechSheetDetailScreen';
import TechSheetListScreen from './src/screens/TechSheetListScreen';
import EventFormScreen from './src/screens/EventFormScreen';
import AssignmentFormScreen from './src/screens/AssignmentFormScreen';
import PeopleScreen from './src/screens/PeopleScreen';
import PersonFormScreen from './src/screens/PersonFormScreen';
import MaterialScreen from './src/screens/MaterialScreen';
import MaterialFormScreen from './src/screens/MaterialFormScreen';
import MaterialControlScreen from './src/screens/MaterialControlScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import CustomHeader from './src/components/CustomHeader';
import {
  RootTabParamList,
  EventsStackParamList,
  TechSheetsStackParamList,
  PeopleStackParamList,
  MaterialStackParamList,
  ControlCenterStackParamList,
  SummaryStackParamList,
  CalendarStackParamList,
} from './src/navigation';

const EventsStack = createStackNavigator<EventsStackParamList>();
const TechSheetsStack = createStackNavigator<TechSheetsStackParamList>();
const PeopleStack = createStackNavigator<PeopleStackParamList>();
const MaterialStack = createStackNavigator<MaterialStackParamList>();
const ControlCenterStack = createStackNavigator<ControlCenterStackParamList>();
const SummaryStack = createStackNavigator<SummaryStackParamList>();
const CalendarStack = createStackNavigator<CalendarStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const commonScreenOptions = {
  header: (props: any) => <CustomHeader {...props} />,
};

const EventsStackNavigator = () => (
  <EventsStack.Navigator screenOptions={commonScreenOptions}>
    <EventsStack.Screen name="EventList" component={EventsScreen} />
    <EventsStack.Screen name="EventDetail" component={EventDetailScreen} />
    <EventsStack.Screen name="TechSheetDetail" component={TechSheetDetailScreen} />
    <EventsStack.Screen name="EventForm" component={EventFormScreen} />
    <EventsStack.Screen name="AssignmentForm" component={AssignmentFormScreen} />
  </EventsStack.Navigator>
);

const TechSheetsStackNavigator = () => (
  <TechSheetsStack.Navigator screenOptions={commonScreenOptions}>
    <TechSheetsStack.Screen name="TechSheetList" component={TechSheetListScreen} />
    <TechSheetsStack.Screen name="TechSheetDetail" component={TechSheetDetailScreen} />
  </TechSheetsStack.Navigator>
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

const SummaryStackNavigator = () => (
  <SummaryStack.Navigator screenOptions={commonScreenOptions}>
    <SummaryStack.Screen name="Summary" component={SummaryScreen} />
  </SummaryStack.Navigator>
);

const CalendarStackNavigator = () => (
    <CalendarStack.Navigator screenOptions={commonScreenOptions}>
        <CalendarStack.Screen name="CalendarView" component={CalendarScreen} />
    </CalendarStack.Navigator>
);

export default function App() {
  const { theme, init, isThemeLoading } = useDataStore((state) => ({
    theme: state.theme,
    init: state.init,
    isThemeLoading: state.isThemeLoading,
  }));
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Promesa per a la durada mínima de la pantalla de benvinguda (2 segons)
        const splashTimer = new Promise(resolve => setTimeout(resolve, 2000));

        // Promesa per a la càrrega del tema amb un temps d'espera d'1.5 segons
        const themeLoaderWithTimeout = new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.warn("La càrrega del tema ha trigat massa, continuant amb el tema per defecte.");
            resolve(null); // Resol amb null si hi ha un temps d'espera
          }, 1500);

          init().then(() => {
            clearTimeout(timeout);
            resolve(null);
          }).catch(error => {
            console.warn("Error en carregar el tema:", error);
            clearTimeout(timeout);
            resolve(null); // Resol igualment en cas d'error
          });
        });

        // Espera que tant el temporitzador de la pantalla de benvinguda com la càrrega del tema (o el seu temps d'espera) finalitzin
        await Promise.all([themeLoaderWithTimeout, splashTimer]);

      } catch (e) {
        console.warn("S'ha produït un error inesperat durant la inicialització de l'aplicació:", e);
      } finally {
        // L'aplicació està a punt per ser mostrada
        setIsAppReady(true);
      }
    };

    prepareApp();
  }, [init]);

  if (!isAppReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const navigationTheme = theme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: string;

            switch (route.name) {
                case 'Events':
                  iconName = focused ? 'list' : 'list-outline';
                  break;
                case 'Calendar':
                    iconName = focused ? 'calendar' : 'calendar-outline';
                    break;
                case 'TechSheets':
                  iconName = focused ? 'document-text' : 'document-text-outline';
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
                case 'Summaries':
                  iconName = focused ? 'analytics' : 'analytics-outline';
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
          <Tab.Screen name="Calendar" component={CalendarStackNavigator} options={{ title: 'Calendari' }} />
          <Tab.Screen name="TechSheets" component={TechSheetsStackNavigator} options={{ title: 'Fitxes de Bolo' }} />
          <Tab.Screen name="People" component={PeopleStackNavigator} options={{ title: 'Persones' }} />
          <Tab.Screen name="Material" component={MaterialStackNavigator} options={{ title: 'Material' }} />
          <Tab.Screen name="ControlCenter" component={ControlCenterStackNavigator} options={{ title: 'Centre de Control' }} />
          <Tab.Screen name="Summaries" component={SummaryStackNavigator} options={{ title: 'Resums' }} />
        </Tab.Navigator>
    </NavigationContainer>
  );
}
