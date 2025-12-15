"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateRangeDMY = exports.formatDateDMY = exports.formatDate = void 0;
var formatDate = function (dateString) {
    if (!dateString) {
        return 'No especificat';
    }
    // Intenta parsejar directament, funciona per a formats ISO (YYYY-MM-DD)
    var isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
        return isoDate.toLocaleDateString();
    }
    // Si falla, intenta parsejar el format 'dd/mm/yyyy'
    var parts = dateString.split('/');
    if (parts.length === 3) {
        var day = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10) - 1; // Els mesos a JS són de 0 a 11
        var year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            var ddmmyyyyDate = new Date(year, month, day);
            if (!isNaN(ddmmyyyyDate.getTime())) {
                return ddmmyyyyDate.toLocaleDateString();
            }
        }
    }
    // Si tot falla, retorna la data original
    return dateString;
};
exports.formatDate = formatDate;
var formatDateDMY = function (dateString) {
    var date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return 'Data invàlida';
    }
    var day = date.getDate().toString().padStart(2, '0');
    var month = (date.getMonth() + 1).toString().padStart(2, '0');
    var year = date.getFullYear();
    return "".concat(day, "/").concat(month, "/").concat(year);
};
exports.formatDateDMY = formatDateDMY;
var formatDateRangeDMY = function (start, end) {
    var startDate = new Date(start);
    var endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 'Dates invàlides';
    }
    var startDay = startDate.getDate().toString().padStart(2, '0');
    var startMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
    var startYear = startDate.getFullYear();
    var endDay = endDate.getDate().toString().padStart(2, '0');
    var endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
    if (start.split('T')[0] === end.split('T')[0]) {
        return "".concat(startDay, "/").concat(startMonth, "/").concat(startYear);
    }
    return "".concat(startDay, "/").concat(startMonth, " - ").concat(endDay, "/").concat(endMonth);
};
exports.formatDateRangeDMY = formatDateRangeDMY;
