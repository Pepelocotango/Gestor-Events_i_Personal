import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import 'uuid';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState, useMemo } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system';
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
import { lightTheme, darkTheme } from './src/utils/themes';

SplashScreen.preventAutoHideAsync();

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
  const init = useDataStore((state) => state.init);
  const isThemeLoading = useDataStore((state) => state.isThemeLoading);
  const theme = useDataStore((state) => state.theme);

  const [isSplashTimeFinished, setIsSplashTimeFinished] = useState(false);

  const handleDeepLink = async (url: string | null) => {
    if (!url) return;

    try {
      const content = await FileSystem.readAsStringAsync(url);
      const parsedData = JSON.parse(content);

      let fileName = "Fitxer Importat";
      try {
        const decodedUrl = decodeURIComponent(url);
        const urlParts = decodedUrl.split('/');
        fileName = urlParts.pop() || fileName;
      } catch (e) {
        console.warn("Could not decode or parse filename from URL", e);
      }

      useDataStore.getState().setData(parsedData, fileName, url);
    } catch (error) {
      console.error("Failed to handle deep link:", error);
      Alert.alert(
        "Error a l'obrir el fitxer",
        "No s'ha pogut llegir o processar el fitxer. Assegura't que el format és correcte."
      );
    }
  };

  useEffect(() => {
    init();
    const splashTimer = setTimeout(() => {
      setIsSplashTimeFinished(true);
    }, 2000);

    // Deep linking for cold start
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Deep linking for when app is already open
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      clearTimeout(splashTimer);
      subscription.remove();
    };
  }, []);

  const isAppReady = !isThemeLoading && isSplashTimeFinished;

  useEffect(() => {
    async function hideSplash() {
      if (isAppReady) {
        await SplashScreen.hideAsync();
      }
    }
    hideSplash();
  }, [isAppReady]);

  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const navigationTheme = useMemo(() => ({
    dark: theme === 'dark',
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  }), [theme, colors]);

  if (!isAppReady) {
    return null;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
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
