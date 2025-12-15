"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var MaterialCommunityIcons_1 = require("react-native-vector-icons/MaterialCommunityIcons");
var dataStore_1 = require("../stores/dataStore");
var themes_1 = require("../utils/themes");
var CustomSelect = function (_a) {
    var value = _a.value, onValueChange = _a.onValueChange, options = _a.options, _b = _a.placeholder, placeholder = _b === void 0 ? '' : _b, containerStyle = _a.containerStyle, textStyle = _a.textStyle;
    var theme = (0, dataStore_1.useDataStore)().theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var _c = (0, react_1.useState)(false), visible = _c[0], setVisible = _c[1];
    var selected = options.find(function (o) { return o.value === value; });
    return (<>
      <react_native_1.TouchableOpacity style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }, containerStyle]} onPress={function () { return setVisible(true); }} activeOpacity={0.8}>
        <react_native_1.Text style={[styles.buttonText, { color: value ? colors.text : colors.placeholder }, textStyle]}>
          {selected ? selected.label : placeholder}
        </react_native_1.Text>
        <MaterialCommunityIcons_1.default name="chevron-down" size={20} color={colors.text}/>
      </react_native_1.TouchableOpacity>

      <react_native_1.Modal visible={visible} animationType="fade" transparent>
        <react_native_1.TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={function () { return setVisible(false); }}>
          <react_native_1.View style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <react_native_1.FlatList data={options} keyExtractor={function (item) { return item.value || item.label; }} renderItem={function (_a) {
            var item = _a.item;
            return (<react_native_1.TouchableOpacity style={[styles.option, { backgroundColor: colors.card, borderBottomColor: colors.border }]} onPress={function () {
                    onValueChange(item.value);
                    setVisible(false);
                }}>
                  <react_native_1.Text style={{ color: colors.text }}>{item.label}</react_native_1.Text>
                  {item.value === value && <MaterialCommunityIcons_1.default name="check" size={18} color={colors.primary}/>}
                </react_native_1.TouchableOpacity>);
        }}/>
          </react_native_1.View>
        </react_native_1.TouchableOpacity>
      </react_native_1.Modal>
    </>);
};
var styles = react_native_1.StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    buttonText: {
        fontSize: 16,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 20,
    },
    modal: {
        maxHeight: '70%',
        borderRadius: 10,
        borderWidth: 1,
        paddingVertical: 6,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
});
exports.default = CustomSelect;
