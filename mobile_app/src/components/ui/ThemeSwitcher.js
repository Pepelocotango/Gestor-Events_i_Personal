"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var Ionicons_1 = require("react-native-vector-icons/Ionicons");
var dataStore_1 = require("../../stores/dataStore");
var themes_1 = require("../../utils/themes");
var ThemeSwitcher = function () {
    var theme = (0, dataStore_1.useDataStore)(function (state) { return state.theme; });
    var toggleTheme = (0, dataStore_1.useDataStore)(function (state) { return state.toggleTheme; });
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    return (<react_native_1.TouchableOpacity onPress={toggleTheme} style={{ marginRight: 15 }}>
      <Ionicons_1.default name={theme === 'dark' ? 'sunny' : 'moon'} size={24} color={colors.text}/>
    </react_native_1.TouchableOpacity>);
};
exports.default = ThemeSwitcher;
