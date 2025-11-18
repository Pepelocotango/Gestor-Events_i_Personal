import { NavigatorScreenParams } from '@react-navigation/native';

export type EventsStackParamList = {
  EventList: undefined;
  EventDetail: { eventId: string };
  TechSheetDetail: { eventId: string };
  EventForm: { eventId?: string };
  AssignmentForm: { eventFrameId: string; assignmentId?: string };
};

export type TechSheetsStackParamList = {
  TechSheetList: undefined;
  TechSheetDetail: { eventId: string };
};

export type PeopleStackParamList = {
  PersonList: undefined;
  PersonForm: { personId?: string };
};

export type MaterialStackParamList = {
  MaterialList: undefined;
  MaterialForm: { materialId?: string };
};

export type ControlCenterStackParamList = {
  MaterialControl: undefined;
};

export type SummaryStackParamList = {
  Summary: undefined;
};

export type CalendarStackParamList = {
    Calendar: undefined;
};

export type RootTabParamList = {
  Events: NavigatorScreenParams<EventsStackParamList>;
  Calendar: undefined;
  TechSheets: undefined;
  People: undefined;
  Material: undefined;
  ControlCenter: undefined;
  Summaries: undefined;
};
