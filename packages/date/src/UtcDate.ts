import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import advancedFormat from "dayjs/plugin/advancedFormat"

import {DateIn, TZ} from "./date";

import "dayjs/locale/de"
import "dayjs/locale/en"

export module UtcDate {
    dayjs.extend(utc)
    dayjs.extend(timezone)
    dayjs.extend(advancedFormat)
    export function localTz() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    export function lastDayOfMonth(date: DateIn) {
        // dayjs impl will change the time also but we only need the date... 1990-12-01T00:00:00Z => 1990-12-31T23:59:59.999Z
        // return dayjs.utc(date).endOf('month').toDate();
        const n = new Date(date);
        n.setUTCDate(1);
        n.setUTCMonth(n.getUTCMonth() + 1);
        n.setUTCDate(0);
        return n;

    }

    export function addDay(date: DateIn, inc: number = 1) {
        const n = new Date(date);
        n.setUTCDate(n.getUTCDate() + inc)
        return n;
    }

    export function addMonth(date: DateIn, inc: number = 1) {
        const n = new Date(date);
        n.setUTCMonth(n.getUTCMonth() + inc)
        return n;
    }

    export function addYear(date: DateIn, inc: number = 1) {
        const n = new Date(date);
        n.setFullYear(n.getUTCFullYear() + inc)
        return n;
    }

    export function addMinutes(date: DateIn, inc: number = 1) {
        const n = new Date(date);
        n.setUTCMinutes(n.getUTCMinutes() + inc)
        return n;
    }

    export function addHours(date: DateIn, inc: number = 1) {
        const n = new Date(date);
        n.setUTCHours(n.getUTCHours() + inc)
        return n;
    }

    export function addSeconds(date: DateIn, inc: number = 1) {
        const n = new Date(date);
        n.setUTCSeconds(n.getUTCSeconds() + inc)
        return n;
    }

    export function formatTZ(date: DateIn, format: string, locale: "de" | "en-US" = "de", timeZone: TZ = TZ.berlin) {
        let utc = dayjs.utc(date);
        let utcToX = timeZone !== TZ.utc ? utc.tz(timeZone) : utc;
        return utcToX.locale(locale).format(format)
    }

    export function format(date: DateIn, format: string) {
        return dayjs.utc(date).format(format)
    }

}