import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import advancedFormat from "dayjs/plugin/advancedFormat"
import quarterOfYear from "dayjs/plugin/quarterOfYear"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isBetween from "dayjs/plugin/isBetween"
import duration from "dayjs/plugin/duration"
import {DateIn, Local, TZ} from "./date";

import "dayjs/locale/de"
import "dayjs/locale/en"

export module UtcDate {
    /** https://day.js.org/docs/en/plugin/plugin */
    dayjs.extend(duration)
    dayjs.extend(utc)
    dayjs.extend(timezone)
    dayjs.extend(advancedFormat)
    dayjs.extend(quarterOfYear)
    dayjs.extend(isSameOrAfter)
    dayjs.extend(isBetween)

    export type UtcCompareOperation = 'between' | 'before' | 'after' | 'sameOrAfter';
    export type UtcDurationUnit = 'year' | 'month' | 'week' | 'quarter';
    export type UtcChangeOperation = 'years' | 'months' | 'days' | 'hours'| 'minutes'| 'seconds' | 'quarter';
    /** A positive or negative integer to in- or decrement a current state. Decimals will be stripped / ignored */
    export type IncrementOrDecrement = number;
    /** See <a href="https://day.js.org/docs/en/display/format">format</a> or <a href="https://day.js.org/docs/en/plugin/advanced-format">advanced-format</a> */
    export type Format = string;
    export function localTZ() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    /** Unsafe access the internal implementation of the date library https://day.js.org/en/ */
    export function unsafeAccessToDateLibBackend(){
        return dayjs
    }

    /** Create a new date representing the lad day of the month for the giving date */
    export function lastDayOfMonth(date: DateIn) {
        // dayjs impl will change the time also but we only need the date... 1990-12-01T00:00:00Z => 1990-12-31T23:59:59.999Z
        // return dayjs.utc(date).endOf('month').toDate();
        const n = new Date(date);
        n.setUTCDate(1);
        n.setUTCMonth(n.getUTCMonth() + 1);
        n.setUTCDate(0);
        return n;

    }

    /** Local preset controls the end of the week (default is Saturday). For "de" the end of the week is Sunday */
    export function endOf(date:DateIn, unit: UtcDurationUnit, local: Local = Local.de){
        const n = new Date(date);
        const utc = dayjs.utc(n).locale(local);
        return utc.endOf(unit).toDate();
    }

    /** Local preset controls the start of the week (default is Sunday). For "de" the start of the week is Monday */
    export function startOf(date:DateIn, unit: UtcDurationUnit, local: Local = Local.de){
        const n = new Date(date);
        const utc = dayjs.utc(n).locale(local);
        return utc.startOf(unit).toDate();
    }

    export function quarter(date:DateIn) : number{
        return dayjs.utc(date).quarter();
    }

    /** Immutable change the provided date. */
    export function add(date:DateIn, op: UtcChangeOperation, inc: IncrementOrDecrement = 1){
        const n = new Date(date);
        switch (op){
            case "years":
                n.setFullYear(n.getUTCFullYear() + inc)
                break;
            case "months":
                n.setUTCMonth(n.getUTCMonth() + inc);
                break;
            case "days":
                n.setUTCDate(n.getUTCDate() + inc)
                break;
            case "hours":
                n.setUTCHours(n.getUTCHours() + inc)
                break;
            case "minutes":
                n.setUTCMinutes(n.getUTCMinutes() + inc)
                break;
            case "seconds":
                n.setUTCSeconds(n.getUTCSeconds() + inc)
                break;
            case "quarter":
                return addQuarter(date, inc);
        }
        return n;
    }

    /**
     *  Create a new date for the provided date which is incremented or decremented by the desired quarters.
     *  Values less than 1 will get the respective quarter of the previous year.
     *  Values greater than 4 respectively will return the quarters for the next year
     *  A value of 0 will return the current date;
     *
     *  @example ```typescript
     *  const date = '1990-07-22'
     *  const lastQuarterOfPreviousYear = IsoDateIme.of(date).quarter(0);
     *         // ^? 1989-07-22
     *  const firstQuarterOfYear = IsoDateIme.of(date).quarter(1);
     *         // ^? 1990-10-22
     *  const firstQuarterOfNextYear = IsoDateIme.of(date).quarter(5);
     *         // ^? 1991-02-22
     *  ```
     */
    export function addQuarter(date: DateIn, quarters: IncrementOrDecrement = 1) {
        const utc = dayjs.utc(new Date(date)) ;
        return utc.add(quarters, "quarter").toDate();
    }

    /** Create a string of the utc date in the desired format, timezone and 'language'*/
    export function formatTZ(date: DateIn, format: Format, locale: "de" | "en-US" = "de", timeZone: TZ = TZ.berlin) {
        let utc = dayjs.utc(date);
        let utcToX = timeZone !== TZ.utc ? utc.tz(timeZone) : utc;
        return utcToX.locale(locale).format(format)
    }

    /** Create a string of the utc date in the desired format. */
    export function format(date: DateIn, format: Format) {
        return dayjs.utc(date).format(format)
    }

    export function is(date: DateIn, op: Exclude<UtcCompareOperation, 'between'>, otherDate: DateIn): boolean;
    export function is(date: DateIn, op: Extract<UtcCompareOperation, 'between'>, otherDate: DateIn, otherEndDate: DateIn): boolean;
    export function is(date: DateIn, op: UtcCompareOperation, otherDate: DateIn, otherEndDate?: DateIn): boolean {
        const n = new Date(date);
        const other = new Date(otherDate);
        switch (op) {
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

}