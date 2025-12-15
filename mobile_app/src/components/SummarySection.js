"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var types_1 = require("../types");
var dateFormat_1 = require("../utils/dateFormat");
var CollapsibleSection_1 = require("./CollapsibleSection");
var dataStore_1 = require("../stores/dataStore");
var themes_1 = require("../utils/themes");
var SummarySection = function (_a) {
    var title = _a.title, data = _a.data, groupingType = _a.groupingType, isExpanded = _a.isExpanded, onToggle = _a.onToggle;
    var theme = (0, dataStore_1.useDataStore)(function (state) { return state.theme; });
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var getStatusColor = function (status) {
        switch (status) {
            case types_1.AssignmentStatus.Yes: return colors['status-yes'];
            case types_1.AssignmentStatus.Pending: return colors['status-pending'];
            case types_1.AssignmentStatus.No: return colors['status-no'];
            case types_1.AssignmentStatus.Mixed: return colors['status-mixed'];
            default: return colors.text;
        }
    };
    var getLabel = function (a) {
        if (groupingType === 'person') {
            return "".concat(a.eventFrameName, " (").concat((0, dateFormat_1.formatDateRangeDMY)(a.assignmentStartDate, a.assignmentEndDate), ")");
        }
        if (groupingType === 'date') {
            return "".concat(a.assignmentPersonName, " - ").concat(a.eventFrameName);
        }
        return "".concat(a.assignmentPersonName, " (").concat((0, dateFormat_1.formatDateRangeDMY)(a.assignmentStartDate, a.assignmentEndDate), ")");
    };
    var styles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        noDataText: {
            fontStyle: 'italic',
            color: colors.placeholder,
        },
        groupContainer: {
            marginBottom: 15,
        },
        groupTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 5,
            color: colors.primary,
        },
        assignmentContainer: {
            marginLeft: 10,
            marginBottom: 5,
        },
        assignmentText: {
            fontSize: 14,
            color: colors.text,
        },
        mixedDetailsContainer: {
            marginLeft: 15,
            marginTop: 5,
        },
        mixedDetailText: {
            fontSize: 12,
            fontWeight: 'bold',
        },
    }); }, [colors]);
    return (<CollapsibleSection_1.default title={title} isExpanded={isExpanded} onToggle={onToggle}>
      {data.length === 0 ? (<react_native_1.Text style={styles.noDataText}>No hi ha dades per aquest resum.</react_native_1.Text>) : (data.map(function (_a) {
            var groupKey = _a[0], assignments = _a[1];
            return (<react_native_1.View key={groupKey} style={styles.groupContainer}>
            <react_native_1.Text style={styles.groupTitle}>{groupKey}</react_native_1.Text>
            {assignments.map(function (a) {
                    var status = Object.values(types_1.AssignmentStatus).includes(a.assignmentStatus)
                        ? a.assignmentStatus
                        : undefined;
                    return (<react_native_1.View key={a.id} style={styles.assignmentContainer}>
                  <react_native_1.Text style={styles.assignmentText}>
                    {getLabel(a)}
                    {status && (<>
                        {' - '}
                        <react_native_1.Text style={{ color: getStatusColor(status), fontWeight: 'bold' }}>
                          ({status})
                        </react_native_1.Text>
                      </>)}
                  </react_native_1.Text>
                  {a.assignmentStatus === types_1.AssignmentStatus.Mixed && a.assignmentObject.dailyStatuses && (<react_native_1.View style={styles.mixedDetailsContainer}>
                      {Object.entries(a.assignmentObject.dailyStatuses)
                                .sort(function (_a, _b) {
                                var dateA = _a[0];
                                var dateB = _b[0];
                                return new Date(dateA).getTime() - new Date(dateB).getTime();
                            })
                                .map(function (_a) {
                                var date = _a[0], dailyStatus = _a[1];
                                var validDailyStatus = Object.values(types_1.AssignmentStatus).includes(dailyStatus)
                                    ? dailyStatus
                                    : undefined;
                                if (!validDailyStatus)
                                    return null;
                                return (<react_native_1.Text key={date} style={[styles.mixedDetailText, { color: getStatusColor(validDailyStatus) }]}>
                              {(0, dateFormat_1.formatDateDMY)(date)} - {validDailyStatus}
                            </react_native_1.Text>);
                            })}
                    </react_native_1.View>)}
                </react_native_1.View>);
                })}
          </react_native_1.View>);
        }))}
    </CollapsibleSection_1.default>);
};
exports.default = react_1.default.memo(SummarySection);
