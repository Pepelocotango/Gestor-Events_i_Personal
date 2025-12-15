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
exports.SAFFileService = void 0;
var FileSystem = require("expo-file-system");
var DocumentPicker = require("expo-document-picker");
var Sharing = require("expo-sharing");
var SAFFileService = /** @class */ (function () {
    function SAFFileService() {
    }
    SAFFileService.prototype.openFile = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cacheDir, dirInfo, pickerOptions, result, asset, uri, content, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        cacheDir = "".concat(FileSystem.cacheDirectory, "DocumentPicker");
                        return [4 /*yield*/, FileSystem.getInfoAsync(cacheDir)];
                    case 1:
                        dirInfo = _a.sent();
                        if (!dirInfo.exists) return [3 /*break*/, 3];
                        return [4 /*yield*/, FileSystem.deleteAsync(cacheDir, { idempotent: true })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        pickerOptions = {
                            copyToCacheDirectory: true,
                            multiple: false,
                            type: '*/*',
                        };
                        return [4 /*yield*/, DocumentPicker.getDocumentAsync(pickerOptions)];
                    case 4:
                        result = _a.sent();
                        if (!(!result.canceled && result.assets.length > 0)) return [3 /*break*/, 6];
                        asset = result.assets[0];
                        uri = asset.uri;
                        return [4 /*yield*/, FileSystem.readAsStringAsync(uri, {
                                encoding: 'utf8',
                            })];
                    case 5:
                        content = _a.sent();
                        data = JSON.parse(content);
                        return [2 /*return*/, {
                                uri: asset.uri,
                                name: asset.name,
                                content: data,
                            }];
                    case 6: return [2 /*return*/, null];
                    case 7:
                        error_1 = _a.sent();
                        console.error("Error a l'obrir el fitxer:", error_1);
                        throw new Error("No s'ha pogut obrir el fitxer: ".concat(error_1.message));
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    SAFFileService.prototype.saveFileAs = function (jsonString, fileName) {
        return __awaiter(this, void 0, void 0, function () {
            var permissions, result, name_1, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync()];
                    case 1:
                        permissions = _b.sent();
                        if (!permissions.granted) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/json')];
                    case 2:
                        result = _b.sent();
                        return [4 /*yield*/, FileSystem.writeAsStringAsync(result, jsonString, {
                                encoding: 'utf8',
                            })];
                    case 3:
                        _b.sent();
                        name_1 = ((_a = result.split('%2F').pop()) === null || _a === void 0 ? void 0 : _a.split('?')[0]) || fileName;
                        return [2 /*return*/, { uri: result, name: decodeURIComponent(name_1) }];
                    case 4:
                        error_2 = _b.sent();
                        console.error('Error al desar el fitxer com a:', error_2);
                        throw new Error('No s’ha pogut desar el fitxer.');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    SAFFileService.prototype.shareFile = function (jsonString, fileName) {
        return __awaiter(this, void 0, void 0, function () {
            var temporaryFilePath, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        temporaryFilePath = "".concat(FileSystem.cacheDirectory).concat(fileName);
                        return [4 /*yield*/, FileSystem.writeAsStringAsync(temporaryFilePath, jsonString, {
                                encoding: 'utf8',
                            })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, Sharing.shareAsync(temporaryFilePath, {
                                mimeType: 'application/json',
                                dialogTitle: 'Compartir fitxer...',
                            })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Error al compartir el fitxer:', error_3);
                        throw new Error('No s’ha pogut compartir el fitxer.');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return SAFFileService;
}());
exports.SAFFileService = SAFFileService;
