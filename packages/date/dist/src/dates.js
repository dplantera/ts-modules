"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsoDateTime = exports.UtcDate = exports.Format = exports.Locals = exports.TZ = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
require("dayjs/locale/de");
require("dayjs/locale/en");
exports.TZ = {
    berlin: "Europe/Berlin",
    utc: "UTC"
};
exports.Locals = {
    de: () => new Intl.Locale("DE"),
    en: () => new Intl.Locale("en-Us")
};
const Format = () => ({
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short'
});
exports.Format = Format;
var UtcDate;
(function (UtcDate) {
    dayjs_1.default.extend(utc_1.default);
    dayjs_1.default.extend(timezone_1.default);
    function localTz() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    UtcDate.localTz = localTz;
    function lastDayOfMonth(date) {
        const n = new Date(date);
        n.setUTCDate(1);
        n.setUTCMonth(n.getUTCMonth() + 1);
        n.setUTCDate(0);
        return n;
    }
    UtcDate.lastDayOfMonth = lastDayOfMonth;
    function addDay(date, inc = 1) {
        const n = new Date(date);
        n.setUTCDate(n.getUTCDate() + inc);
        return n;
    }
    UtcDate.addDay = addDay;
    function addMonth(date, inc = 1) {
        const n = new Date(date);
        n.setUTCMonth(n.getUTCMonth() + inc);
        return n;
    }
    UtcDate.addMonth = addMonth;
    function addYear(date, inc = 1) {
        const n = new Date(date);
        n.setFullYear(n.getUTCFullYear() + inc);
        return n;
    }
    UtcDate.addYear = addYear;
    function addMinutes(date, inc = 1) {
        const n = new Date(date);
        n.setUTCMinutes(n.getUTCMinutes() + inc);
        return n;
    }
    UtcDate.addMinutes = addMinutes;
    function addHours(date, inc = 1) {
        const n = new Date(date);
        n.setUTCHours(n.getUTCHours() + inc);
        return n;
    }
    UtcDate.addHours = addHours;
    function addSeconds(date, inc = 1) {
        const n = new Date(date);
        n.setUTCSeconds(n.getUTCSeconds() + inc);
        return n;
    }
    UtcDate.addSeconds = addSeconds;
    function formatTZ(date, format, locale = "de", timeZone = exports.TZ.berlin) {
        let utc = dayjs_1.default.utc(date);
        let utcToX = timeZone !== exports.TZ.utc ? utc.tz(timeZone) : utc;
        return utcToX.locale(locale).format(format);
    }
    UtcDate.formatTZ = formatTZ;
    function format(date, format) {
        return dayjs_1.default.utc(date).format(format);
    }
    UtcDate.format = format;
})(UtcDate || (exports.UtcDate = UtcDate = {}));
var IsoDateTime;
(function (IsoDateTime_1) {
    class IsoDateTime {
        date;
        constructor(date) {
            this.date = date;
        }
        toString() {
            return this.date.toISOString();
        }
        format(fmt) {
            return UtcDate.format(this.date, fmt);
        }
        formatDE(fmt) {
            return UtcDate.formatTZ(this.date, fmt, "de", exports.TZ.berlin);
        }
        formatEN(fmt, tz = exports.TZ.utc) {
            return UtcDate.formatTZ(this.date, fmt, "en-US", tz);
        }
        lastDayOfMonth() {
            return new IsoDateTime(UtcDate.lastDayOfMonth(this.date));
        }
        addDays(inc) {
            return new IsoDateTime(UtcDate.addDay(this.date, inc));
        }
        addMonths(inc) {
            return new IsoDateTime(UtcDate.addMonth(this.date, inc));
        }
        addYears(inc) {
            return new IsoDateTime(UtcDate.addYear(this.date, inc));
        }
        addMinutes(inc) {
            return new IsoDateTime(UtcDate.addMinutes(this.date, inc));
        }
        addHours(inc) {
            return new IsoDateTime(UtcDate.addHours(this.date, inc));
        }
        addSeconds(inc) {
            return new IsoDateTime(UtcDate.addSeconds(this.date, inc));
        }
    }
    function of(date) {
        return new IsoDateTime(new Date(date));
    }
    IsoDateTime_1.of = of;
})(IsoDateTime || (exports.IsoDateTime = IsoDateTime = {}));
