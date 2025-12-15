"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDaysBetween = exports.isMultiDay = void 0;
var isMultiDay = function (startDate, endDate) {
    var start = new Date(startDate);
    var end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    // If times are different, it's multi-day
    return start.getTime() !== end.getTime();
};
exports.isMultiDay = isMultiDay;
var getDaysBetween = function (startDate, endDate) {
    var dates = [];
    // Start from the beginning of the start date
    var currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    var lastDate = new Date(endDate);
    lastDate.setHours(0, 0, 0, 0);
    while (currentDate.getTime() <= lastDate.getTime()) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};
exports.getDaysBetween = getDaysBetween;
