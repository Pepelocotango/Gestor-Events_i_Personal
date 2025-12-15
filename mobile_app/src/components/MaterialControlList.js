"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var dataStore_1 = require("../stores/dataStore");
var themes_1 = require("../utils/themes");
var MaterialControlList = function (_a) {
    var data = _a.data;
    var theme = (0, dataStore_1.useDataStore)().theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var _b = (0, react_1.useState)(new Set()), expandedIds = _b[0], setExpandedIds = _b[1];
    var toggleExpand = function (id) {
        setExpandedIds(function (prev) {
            var newSet = new Set(prev);
            if (newSet.has(id))
                newSet.delete(id);
            else
                newSet.add(id);
            return newSet;
        });
    };
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        card: {
            backgroundColor: colors.card,
            padding: 15,
            marginVertical: 5,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: colors.border,
        },
        mainRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 5,
        },
        itemName: {
            fontWeight: 'bold',
            fontSize: 16,
            color: colors.text,
        },
        details: {
            fontSize: 12,
            color: colors.text,
            opacity: 0.7,
            marginTop: 5,
        },
        negativeBalance: {
            color: colors['status-no'],
            fontWeight: 'bold',
        },
        positiveBalance: {
            color: colors['status-yes'],
            fontWeight: 'bold',
        },
        breakdownContainer: {
            marginTop: 10,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        breakdownTitle: {
            fontWeight: 'bold',
            marginBottom: 5,
            color: colors.text,
        },
        breakdownItem: {
            marginLeft: 10,
            color: colors.text,
        },
        emptyText: {
            textAlign: 'center',
            marginTop: 20,
            color: colors.text,
        },
    }); }, [colors]);
    var renderItem = function (_a) {
        var item = _a.item;
        var isExpanded = expandedIds.has(item.item.id);
        var balanceIsNegative = item.balance < 0;
        return (<react_native_1.View style={dynamicStyles.card}>
        <react_native_1.TouchableOpacity onPress={function () { return toggleExpand(item.item.id); }}>
          <react_native_1.View style={dynamicStyles.mainRow}>
            <react_native_1.Text style={dynamicStyles.itemName}>{item.item.name}</react_native_1.Text>
            <react_native_1.Text style={balanceIsNegative ? dynamicStyles.negativeBalance : dynamicStyles.positiveBalance}>
              Balanç: {item.balance}
            </react_native_1.Text>
          </react_native_1.View>
          <react_native_1.Text style={{ color: colors.text }}>Estoc: {item.item.stock} / Demanda: {item.totalDemand}</react_native_1.Text>
          <react_native_1.Text style={dynamicStyles.details}>Categoria: {item.item.category} / Origen: {item.item.location}</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        {isExpanded && (<react_native_1.View style={dynamicStyles.breakdownContainer}>
            <react_native_1.Text style={dynamicStyles.breakdownTitle}>Desglossament:</react_native_1.Text>
            {item.breakdown.map(function (bd) { return (<react_native_1.Text key={bd.eventFrameId} style={dynamicStyles.breakdownItem}>
                - {bd.eventName}: {bd.quantity} unitat(s)
              </react_native_1.Text>); })}
          </react_native_1.View>)}
      </react_native_1.View>);
    };
    return (<react_native_1.FlatList data={data} renderItem={renderItem} keyExtractor={function (item) { return item.item.id; }} ListEmptyComponent={<react_native_1.Text style={dynamicStyles.emptyText}>No s'han trobat resultats.</react_native_1.Text>} contentContainerStyle={{ paddingBottom: 80 }}/>);
};
exports.default = MaterialControlList;
