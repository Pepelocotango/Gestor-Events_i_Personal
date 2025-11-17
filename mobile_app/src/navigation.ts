export type EventsStackParamList = {
  EventList: undefined;
  EventDetail: { eventId: string };
  EventForm: { eventId?: string };
  AssignmentForm: { eventFrameId: string; assignmentId?: string };
};

export type PeopleStackParamList = {
  PersonList: undefined;
  PersonForm: { personId?: string };
};

export type MaterialStackParamList = {
  MaterialList: undefined;
  MaterialForm: { materialId?: string };
  MaterialControl: undefined;
};

export type RootTabParamList = {
  Events: undefined;
  People: undefined;
  Material: undefined;
};
