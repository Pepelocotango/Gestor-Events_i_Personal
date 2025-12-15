"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var types_1 = require("../types");
var dates_1 = require("../utils/dates");
var dataStore_1 = require("../stores/dataStore");
var statusUtils_1 = require("../utils/statusUtils");
var date_fns_1 = require("date-fns");
var themes_1 = require("../utils/themes");
var DailyStatusEditor = function (_a) {
    var assignment = _a.assignment, eventFrameId = _a.eventFrameId, isUnlocked = _a.isUnlocked;
    var updateDailyAssignmentStatus = (0, dataStore_1.useDataStore)(function (state) { return state.updateDailyAssignmentStatus; });
    var theme = (0, dataStore_1.useDataStore)(function (state) { return state.theme; });
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var days = (0, dates_1.getDaysBetween)(assignment.startDate, assignment.endDate);
    var getStatusForDay = function (date) {
        var _a;
        var dateString = (0, date_fns_1.format)(date, 'yyyy-MM-dd');
        return ((_a = assignment.dailyStatuses) === null || _a === void 0 ? void 0 : _a[dateString]) || types_1.AssignmentStatus.Pending;
    };
    var handleStatusChange = function (date, currentStatus) {
        var statuses = [
            types_1.AssignmentStatus.Pending,
            types_1.AssignmentStatus.Yes,
            types_1.AssignmentStatus.No
        ];
        var currentIndex = statuses.indexOf(currentStatus);
        var nextIndex = (currentIndex + 1) % statuses.length;
        var nextStatus = statuses[nextIndex];
        updateDailyAssignmentStatus(eventFrameId, assignment.id, (0, date_fns_1.format)(date, 'yyyy-MM-dd'), nextStatus);
    };
    var styles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        container: {
            marginTop: 10,
            marginLeft: 15,
            paddingLeft: 10,
            borderLeftWidth: 1,
            borderLeftColor: colors.border,
        },
        dayRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 6,
        },
        dayText: {
            fontSize: 14,
            color: colors.text,
        },
        statusText: {
            fontSize: 14,
            fontWeight: 'bold',
        },
    }); }, [colors]);
    return (<react_native_1.View style={styles.container}>
      {days.map(function (day) {
            var dayStatus = getStatusForDay(day);
            return (<react_native_1.View key={day.toISOString()} style={styles.dayRow}>
            <react_native_1.Text style={styles.dayText}>
              {day.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'numeric' })}
            </react_native_1.Text>
            <react_native_1.TouchableOpacity onPress={function () { return handleStatusChange(day, dayStatus); }} disabled={!isUnlocked}>
              <react_native_1.Text style={[
                    styles.statusText,
                    { color: (0, statusUtils_1.getStatusColor)(dayStatus), opacity: isUnlocked ? 1 : 0.4 }
                ]}>
                {dayStatus}
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>);
        })}
    </react_native_1.View>);
};
exports.default = DailyStatusEditor;
