// src/navigation.ts

export type RootStackParamList = {
  DataSource: undefined;
  FilePicker: { workspaceUri: string };
  Home: undefined;
  EventDetail: { eventId: string };
  EventForm: { eventId?: string }; // Paràmetre opcional
};
