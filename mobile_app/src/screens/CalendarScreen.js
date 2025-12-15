"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var react_native_calendars_1 = require("react-native-calendars");
var dataStore_1 = require("../stores/dataStore");
var themes_1 = require("../utils/themes");
var native_1 = require("@react-navigation/native");
var CalendarScreen = function () {
    var _a = (0, dataStore_1.useDataStore)(), eventFrames = _a.eventFrames, theme = _a.theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var navigation = (0, native_1.useNavigation)();
    var _b = (0, react_1.useState)(''), selectedDate = _b[0], setSelectedDate = _b[1];
    var calendarTheme = (0, react_1.useMemo)(function () { return ({
        backgroundColor: colors.background,
        calendarBackground: colors.background,
        textSectionTitleColor: colors.text,
        textSectionTitleDisabledColor: colors.placeholder,
        selectedDayBackgroundColor: colors.primary,
        selectedDayTextColor: colors['selected-day-text'],
        todayTextColor: colors.primary,
        dayTextColor: colors.text,
        textDisabledColor: colors.placeholder,
        dotColor: colors.primary,
        selectedDotColor: colors['selected-day-text'],
        arrowColor: colors.primary,
        disabledArrowColor: colors.placeholder,
        monthTextColor: colors.text,
        indicatorColor: colors.primary,
        'stylesheet.calendar.header': {
            week: {
                marginTop: 5,
                flexDirection: 'row',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderColor: colors.border,
            }
        }
    }); }, [colors]);
    var markedDates = (0, react_1.useMemo)(function () {
        var markers = {};
        eventFrames.forEach(function (event) {
            var date = event.startDate.substring(0, 10);
            markers[date] = __assign(__assign({}, markers[date]), { marked: true, dotColor: colors.primary });
        });
        if (selectedDate) {
            markers[selectedDate] = __assign(__assign({}, markers[selectedDate]), { selected: true, selectedColor: colors.primary });
        }
        return markers;
    }, [eventFrames, selectedDate, colors.primary]);
    var eventsOnSelectedDate = (0, react_1.useMemo)(function () {
        if (!selectedDate)
            return [];
        return eventFrames.filter(function (event) { return event.startDate.substring(0, 10) === selectedDate; });
    }, [eventFrames, selectedDate]);
    var onDayPress = function (day) {
        setSelectedDate(day.dateString);
    };
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        eventListContainer: {
            flex: 1,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        listHeader: {
            fontSize: 18,
            fontWeight: 'bold',
            padding: 15,
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            color: colors.text,
        },
        eventItem: {
            paddingVertical: 15,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        eventName: {
            fontSize: 16,
            fontWeight: '500',
            color: colors.text,
        },
        eventPlace: {
            fontSize: 14,
            color: colors.text,
            opacity: 0.7,
            marginTop: 4,
        },
        placeholderContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        placeholderText: {
            fontSize: 16,
            color: colors.text,
            opacity: 0.7,
        },
        emptyListText: {
            textAlign: 'center',
            marginTop: 20,
            fontSize: 16,
            color: colors.text,
            opacity: 0.7,
        },
    }); }, [colors]);
    var renderEventItem = function (_a) {
        var item = _a.item;
        return (<react_native_1.TouchableOpacity style={dynamicStyles.eventItem} onPress={function () { return navigation.navigate('Events', { screen: 'EventDetail', params: { eventId: item.id } }); }}>
      <react_native_1.Text style={dynamicStyles.eventName}>{item.name}</react_native_1.Text>
      <react_native_1.Text style={dynamicStyles.eventPlace}>{item.place}</react_native_1.Text>
    </react_native_1.TouchableOpacity>);
    };
    return (<react_native_1.View style={dynamicStyles.container}>
      <react_native_calendars_1.Calendar key={theme} markedDates={markedDates} onDayPress={onDayPress} theme={calendarTheme}/>
      <react_native_1.View style={dynamicStyles.eventListContainer}>
        {selectedDate ? (<react_native_1.FlatList data={eventsOnSelectedDate} renderItem={renderEventItem} keyExtractor={function (item) { return item.id; }} ListEmptyComponent={<react_native_1.Text style={dynamicStyles.emptyListText}>No hi ha esdeveniments per a aquest dia.</react_native_1.Text>} ListHeaderComponent={<react_native_1.Text style={dynamicStyles.listHeader}>Esdeveniments per al {selectedDate}</react_native_1.Text>}/>) : (<react_native_1.View style={dynamicStyles.placeholderContainer}>
                <react_native_1.Text style={dynamicStyles.placeholderText}>Seleccioneu un dia per veure els esdeveniments.</react_native_1.Text>
            </react_native_1.View>)}
      </react_native_1.View>
    </react_native_1.View>);
};
exports.default = CalendarScreen;
