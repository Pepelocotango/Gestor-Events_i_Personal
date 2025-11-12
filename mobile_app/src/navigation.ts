// src/navigation.ts

export type RootStackParamList = {
  DataSource: undefined;
  Home: undefined;
  EventDetail: { eventId: string };
  EventForm: { eventId?: string }; // Paràmetre opcional
};
