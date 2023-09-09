import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import advancedFormat from "dayjs/plugin/advancedFormat"
import quarterOfYear from "dayjs/plugin/quarterOfYear"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isBetween from "dayjs/plugin/isBetween"
import {DateIn, TZ} from "./date";

import "dayjs/locale/de"
import "dayjs/locale/en"

export module UtcDate {
    dayjs.extend(utc)
    dayjs.extend(timezone)
    dayjs.extend(advancedFormat)
    dayjs.extend(quarterOfYear)
    dayjs.extend(isSameOrAfter)
    dayjs.extend(isBetween)

    export function localTZ() {
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

    export function addDays(date: DateIn, inc: number = 1) {
        const n = new Date(date);
        n.setUTCDate(n.getUTCDate() + inc)
        return n;
    }

    export function addMonths(date: DateIn, inc: number = 1) {
        const n = new Date(date);
        n.setUTCMonth(n.getUTCMonth() + inc)
        return n;
    }

    export function addYears(date: DateIn, inc: number = 1) {
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

    export function addQuarter(date: DateIn, inc: number = 1) {
        const n = new Date(date);
        return dayjs.utc(n).quarter(inc).toDate();
    }

    export function is(date: DateIn,  test: 'before' | 'after' | 'sameOrAfter', otherDate: DateIn):boolean;
    export function is(date: DateIn,  test: 'between' , otherDate: DateIn, otherEndDate: DateIn):boolean;
    export function is(date: DateIn,  test: 'between' |  'before' | 'after' | 'sameOrAfter' , otherDate: DateIn, otherEndDate?: DateIn):boolean{
        const n = new Date(date);
        const other = new Date(otherDate);
        switch (test){
            case "before":
                return dayjs.utc(n).isBefore(other)
            case "after":
                return dayjs.utc(n).isAfter(other);
            case "sameOrAfter":
                return dayjs.utc(n).isSameOrAfter(other);
            case "between":
                const otherEnd = new Date(otherEndDate ?? other);
                return dayjs.utc(n).isBetween(other, otherEnd);
        }
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