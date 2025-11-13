import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';
import HomeScreen from './src/screens/HomeScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import DataSourceScreen from './src/screens/DataSourceScreen';
import FilePickerScreen from './src/screens/FilePickerScreen';
import EventFormScreen from './src/screens/EventFormScreen';
import { RootStackParamList } from './src/navigation';
import { useDataStore } from './src/stores/dataStore';

const Stack = createStackNavigator<RootStackParamList>();

const WORKSPACE_URI_KEY = 'workspaceUri';

export default function App() {
  const [initialRoute, setInitialRoute] = useState<'DataSource' | 'FilePicker' | null>(null);
  const [workspaceUri, setWorkspaceUri] = useState<string | null>(null);
  const { setWorkspaceUri: setDataStoreWorkspaceUri } = useDataStore();

  useEffect(() => {
    const checkWorkspace = async () => {
      const uri = await SecureStore.getItemAsync(WORKSPACE_URI_KEY);
      if (uri) {
        setWorkspaceUri(uri);
        setDataStoreWorkspaceUri(uri);
        setInitialRoute('FilePicker');
      } else {
        setInitialRoute('DataSource');
      }
    };
    checkWorkspace();
  }, [setDataStoreWorkspaceUri]);

  useEffect(() => {
    const saveWorkspaceUri = async () => {
      const uriFromStore = useDataStore.getState().workspaceUri;
      if (uriFromStore) {
        await SecureStore.setItemAsync(WORKSPACE_URI_KEY, uriFromStore);
      }
    };

    const unsubscribe = useDataStore.subscribe(
      (state) => state.workspaceUri,
      saveWorkspaceUri
    );

    return () => unsubscribe();
  }, []);

  if (!initialRoute) {
    return null; // O un component de càrrega
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="DataSource"
          component={DataSourceScreen}
          options={{ title: 'Selecció de Carpeta' }}
        />
        <Stack.Screen
          name="FilePicker"
          component={FilePickerScreen}
          options={{ title: 'Selecció de Fitxer' }}
          initialParams={{ workspaceUri: workspaceUri || '' }}
        />
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
