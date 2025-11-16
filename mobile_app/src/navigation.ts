export type EventsStackParamList = {
  EventList: undefined;
  EventDetail: { eventId: string };
  EventForm: { eventId?: string };
};

export type PeopleStackParamList = {
  PersonList: undefined;
  PersonForm: { personId?: string };
};

export type MaterialStackParamList = {
  MaterialList: undefined;
  MaterialForm: { materialId?: string };
};

export type RootTabParamList = {
  Events: undefined;
  People: undefined;
  Material: undefined;
};
