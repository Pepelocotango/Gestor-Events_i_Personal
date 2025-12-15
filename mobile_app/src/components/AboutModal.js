"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var MaterialCommunityIcons_1 = require("react-native-vector-icons/MaterialCommunityIcons");
var dataStore_1 = require("../stores/dataStore");
var themes_1 = require("../utils/themes");
var expo_constants_1 = require("expo-constants");
var GITHUB_URL = 'https://github.com/Pepelocotango/Gestor-Events_i_Personal';
var PAYPAL_URL = 'https://paypal.me/RosePep';
var AboutModal = function (_a) {
    var _b, _c;
    var visible = _a.visible, onClose = _a.onClose;
    var theme = (0, dataStore_1.useDataStore)(function (state) { return state.theme; });
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var appName = ((_b = expo_constants_1.default.expoConfig) === null || _b === void 0 ? void 0 : _b.name) || "Gestor d'Esdeveniments";
    var appVersion = ((_c = expo_constants_1.default.expoConfig) === null || _c === void 0 ? void 0 : _c.version) ? "v".concat(expo_constants_1.default.expoConfig.version) : '';
    var appDescription = "Aplicació mòbil per visualitzar i gestionar esdeveniments, personal i material. Permet consultar i editar la informació bàsica dels esdeveniments, gestionar el personal assignat i revisar l'inventari de material. Sincronitza amb l'aplicació d'escriptori per a una gestió completa.";
    var handleLinkPress = function (url) { return __awaiter(void 0, void 0, void 0, function () {
        var supported;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, react_native_1.Linking.canOpenURL(url)];
                case 1:
                    supported = _a.sent();
                    if (!supported) return [3 /*break*/, 3];
                    return [4 /*yield*/, react_native_1.Linking.openURL(url)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var dynamicStyles = react_native_1.StyleSheet.create({
        modalOverlay: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
        },
        modalContent: {
            backgroundColor: colors.card,
            borderRadius: 10,
            width: '85%',
            maxWidth: 400,
            padding: 20,
        },
        titleContainer: {
            alignItems: 'center',
            marginBottom: 16,
        },
        title: {
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 4,
        },
        version: {
            fontSize: 14,
            color: colors.text,
            opacity: 0.7,
            marginBottom: 8,
        },
        description: {
            fontSize: 14,
            color: colors.text,
            marginBottom: 20,
            textAlign: 'center',
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 12,
            textAlign: 'center',
        },
        linkButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.primary,
            padding: 12,
            borderRadius: 6,
            marginBottom: 10,
        },
        linkText: {
            color: colors.background,
            marginLeft: 8,
            fontWeight: '500',
        },
        closeButton: {
            marginTop: 20,
            padding: 10,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 6,
        },
        closeButtonText: {
            color: colors.text,
            fontWeight: '500',
        },
    });
    return (<react_native_1.Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <react_native_1.TouchableOpacity style={dynamicStyles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <react_native_1.View style={dynamicStyles.modalContent}>
          <react_native_1.View style={dynamicStyles.titleContainer}>
            <react_native_1.Text style={dynamicStyles.title}>{appName}</react_native_1.Text>
            <react_native_1.Text style={dynamicStyles.version}>Versió {appVersion}</react_native_1.Text>
            <react_native_1.Text style={dynamicStyles.description}>
              {appDescription}
            </react_native_1.Text>
          </react_native_1.View>

          <react_native_1.Text style={dynamicStyles.sectionTitle}>Enllaços d'Interès</react_native_1.Text>

          <react_native_1.TouchableOpacity style={dynamicStyles.linkButton} onPress={function () { return handleLinkPress(GITHUB_URL); }}>
            <react_native_1.Text style={dynamicStyles.linkText}>Repositori a GitHub</react_native_1.Text>
            <MaterialCommunityIcons_1.default name="open-in-new" size={20} color={colors.background} style={{ marginLeft: 8 }}/>
          </react_native_1.TouchableOpacity>

          <react_native_1.TouchableOpacity style={dynamicStyles.linkButton} onPress={function () { return handleLinkPress(PAYPAL_URL); }}>
            <react_native_1.Text style={dynamicStyles.linkText}>Fes una donació</react_native_1.Text>
            <MaterialCommunityIcons_1.default name="open-in-new" size={20} color={colors.background} style={{ marginLeft: 8 }}/>
          </react_native_1.TouchableOpacity>

          <react_native_1.TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
            <react_native_1.Text style={dynamicStyles.closeButtonText}>Tancar</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>
      </react_native_1.TouchableOpacity>
    </react_native_1.Modal>);
};
exports.default = AboutModal;
