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
var dataStore_1 = require("../stores/dataStore");
var SAFFileService_1 = require("../services/SAFFileService");
var MaterialCommunityIcons_1 = require("react-native-vector-icons/MaterialCommunityIcons");
var expo_constants_1 = require("expo-constants");
var ThemeSwitcher_1 = require("./ui/ThemeSwitcher");
var themes_1 = require("../utils/themes");
var AboutModal_1 = require("./AboutModal");
var fileService = new SAFFileService_1.SAFFileService();
var CustomHeader = function (_a) {
    var _b, _c, _d;
    var navigation = _a.navigation, route = _a.route;
    var _e = (0, dataStore_1.useDataStore)(), fileName = _e.fileName, hasUnsavedChanges = _e.hasUnsavedChanges, setData = _e.setData, clearData = _e.clearData, saveFileAs = _e.saveFileAs, shareFile = _e.shareFile, theme = _e.theme;
    var colors = theme === 'dark' ? themes_1.darkTheme : themes_1.lightTheme;
    var canGoBack = navigation.canGoBack();
    var _f = (0, react_1.useState)(false), isAboutModalVisible = _f[0], setAboutModalVisible = _f[1];
    var handleOpenFile = function () { return __awaiter(void 0, void 0, void 0, function () {
        var openAndSetData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    openAndSetData = function () { return __awaiter(void 0, void 0, void 0, function () {
                        var result, error_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, fileService.openFile()];
                                case 1:
                                    result = _a.sent();
                                    if (result) {
                                        setData(result.content, result.name, result.uri);
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_1 = _a.sent();
                                    react_native_1.Alert.alert("Error", "El fitxer seleccionat no és vàlid o està malmès.");
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); };
                    if (!hasUnsavedChanges) return [3 /*break*/, 1];
                    react_native_1.Alert.alert("Descartar canvis?", "Teniu canvis no desats. Esteu segur que voleu tancar el fitxer actual i descartar els canvis?", [
                        { text: "Cancel·lar", style: "cancel" },
                        { text: "Descartar", style: "destructive", onPress: openAndSetData },
                    ]);
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, openAndSetData()];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleSaveFileAs = function () { return __awaiter(void 0, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, saveFileAs()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    react_native_1.Alert.alert("Error", "No s'ha pogut desar el fitxer amb un nom nou.");
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleShareFile = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            react_native_1.Alert.alert("A punt per compartir", "Per reemplaçar i sobreescriure un fitxer existent a Dropbox o Drive, marqueu el fitxer com 'Available offline'. Per Dropbox utilitzeu el gestor natiu de Dropbox i marqueu 'Upload here' -> 'Replace' -> 'show in folder' per assegurar la sincronització. Per Drive utilitzeu un gestor de fitxers (com FileExplorer) connectat a Drive, obriu Drive i actualitzeu.Sense aquests passos Drive crearà un fitxer duplicat.S'obrirà el diàleg per compartir. Si deseu a Google Drive o a un altre servei al núvol, recordeu de sobreescriure el fitxer existent si voleu actualitzar-lo.", [
                {
                    text: "D'acord",
                    onPress: function () { return __awaiter(void 0, void 0, void 0, function () {
                        var e_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, shareFile()];
                                case 1:
                                    _a.sent();
                                    return [3 /*break*/, 3];
                                case 2:
                                    e_2 = _a.sent();
                                    react_native_1.Alert.alert("Error", "No s'ha pogut compartir el fitxer.");
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); },
                },
            ]);
            return [2 /*return*/];
        });
    }); };
    var handleCloseFile = function () {
        if (hasUnsavedChanges) {
            react_native_1.Alert.alert("Descartar canvis?", "Teniu canvis no desats. Esteu segur que voleu tancar el fitxer i descartar els canvis?", [
                { text: "Cancel·lar", style: "cancel" },
                { text: "Descartar", style: "destructive", onPress: clearData },
            ]);
        }
        else {
            clearData();
        }
    };
    var appVersion = ((_c = (_b = expo_constants_1.default.expoConfig) === null || _b === void 0 ? void 0 : _b.extra) === null || _c === void 0 ? void 0 : _c.version) || ((_d = expo_constants_1.default.expoConfig) === null || _d === void 0 ? void 0 : _d.version);
    var headerTitle = fileName
        ? fileName
        : "Gestor d'Esdeveniments v".concat(appVersion);
    var dynamicStyles = (0, react_1.useMemo)(function () { return react_native_1.StyleSheet.create({
        container: {
            paddingTop: 35,
            paddingBottom: 8,
            paddingHorizontal: 15,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        title: {
            fontSize: 14,
            color: colors.text,
            opacity: 0.7,
        },
        openButtonText: {
            fontSize: 16,
            color: colors.primary,
            fontWeight: 'bold',
        },
        iconColor: {
            color: colors.text,
        },
        disabledIconColor: {
            color: colors.placeholder,
        },
        accentIconColor: {
            color: colors.primary,
        },
        destructiveIconColor: {
            color: colors.destructive,
        },
    }); }, [colors]);
    return (<>
      <react_native_1.View style={dynamicStyles.container}>
        <react_native_1.View style={styles.topRow}>
          <react_native_1.Text style={dynamicStyles.title}>{headerTitle}</react_native_1.Text>
        </react_native_1.View>
        <react_native_1.View style={styles.bottomRow}>
          <react_native_1.View style={styles.buttonGroup}>
            {canGoBack && (<react_native_1.TouchableOpacity onPress={function () { return navigation.goBack(); }}>
                <MaterialCommunityIcons_1.default name="arrow-left" size={28} style={dynamicStyles.iconColor}/>
              </react_native_1.TouchableOpacity>)}
          </react_native_1.View>
          <react_native_1.View style={styles.buttonGroup}>
            {fileName ? (<>
                <react_native_1.TouchableOpacity onPress={handleSaveFileAs}>
                  <MaterialCommunityIcons_1.default name="content-save-all-outline" size={28} style={dynamicStyles.iconColor}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.TouchableOpacity onPress={handleShareFile}>
                  <MaterialCommunityIcons_1.default name="share-variant" size={28} style={hasUnsavedChanges ? dynamicStyles.accentIconColor : dynamicStyles.iconColor}/>
                </react_native_1.TouchableOpacity>
                <react_native_1.TouchableOpacity onPress={handleCloseFile}>
                  <MaterialCommunityIcons_1.default name="close-circle-outline" size={28} style={dynamicStyles.destructiveIconColor}/>
                </react_native_1.TouchableOpacity>
              </>) : (<react_native_1.TouchableOpacity onPress={handleOpenFile} style={styles.openButton}>
                <MaterialCommunityIcons_1.default name="folder-open-outline" size={28} style={dynamicStyles.accentIconColor}/>
                <react_native_1.Text style={dynamicStyles.openButtonText}>Obrir</react_native_1.Text>
              </react_native_1.TouchableOpacity>)}
            <react_native_1.TouchableOpacity onPress={function () { return setAboutModalVisible(true); }}>
              <MaterialCommunityIcons_1.default name="information-outline" size={28} style={dynamicStyles.iconColor}/>
            </react_native_1.TouchableOpacity>
            <ThemeSwitcher_1.default />
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.View>

      <AboutModal_1.default visible={isAboutModalVisible} onClose={function () { return setAboutModalVisible(false); }}/>
    </>);
};
var styles = react_native_1.StyleSheet.create({
    topRow: {
        alignItems: 'center',
        marginBottom: 8,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    buttonGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    openButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});
exports.default = CustomHeader;
