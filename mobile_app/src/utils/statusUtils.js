"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusColor = void 0;
var types_1 = require("../types");
var getStatusColor = function (status) {
    switch (status) {
        case types_1.AssignmentStatus.Yes: return '#4CAF50'; // Green
        case types_1.AssignmentStatus.Pending: return '#FFC107'; // Amber
        case types_1.AssignmentStatus.No: return '#F44336'; // Red
        case types_1.AssignmentStatus.Mixed: return '#2196F3'; // Blue
        default: return '#333'; // Default dark grey
    }
};
exports.getStatusColor = getStatusColor;
