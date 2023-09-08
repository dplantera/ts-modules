import dayjs, {} from "dayjs";
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

import "dayjs/locale/de"
import "dayjs/locale/en"

export const TZ = {
    berlin: "Europe/Berlin",
    utc: "UTC"
} as const
export type TZ = typeof TZ[keyof typeof TZ];

export const Locals = {
    de: () => new Intl.Locale("DE"),
    en: () => new Intl.Locale("en-Us")
}

export const Format = () => ({
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short'
} as const)


export type DateIn = Date | string | number;
export module UtcDate {
    dayjs.extend(utc)
    dayjs.extend(timezone)

    export function localTz() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    export function lastDayOfMonth(date: DateIn) {
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

    export function formatTZ(date: DateIn, format: string, locale: "de" | "en-US" = "de", timeZone: TZ = TZ.berlin){
        let utc = dayjs.utc(date);
        let utcToX = timeZone !== TZ.utc ? utc.tz(timeZone) : utc;
        return utcToX.locale(locale ).format(format)
    }

    export function format(date: DateIn, format: string){
        return dayjs.utc(date).format(format)
    }

}


export module IsoDateTime {
    class IsoDateTime {
        constructor(private date: Date) {
        }

        public toString(): string {
            return this.date.toISOString();
        }
        format(fmt: string){
            return UtcDate.format(this.date, fmt);
        }
        formatDE(fmt: string){
            return UtcDate.formatTZ(this.date, fmt, "de", TZ.berlin);
        }
        formatEN(fmt: string, tz: TZ = TZ.utc){
            return UtcDate.formatTZ(this.date, fmt, "en-US", tz);
        }
        lastDayOfMonth(){
            return new IsoDateTime(UtcDate.lastDayOfMonth(this.date))
        }

        addDays(inc?: number) {
            return new IsoDateTime( UtcDate.addDay(this.date, inc));
        }

        addMonths(inc?: number) {
            return new IsoDateTime(UtcDate.addMonth(this.date, inc));
        }

        addYears(inc?: number) {
            return new IsoDateTime(UtcDate.addYear(this.date, inc));
        }

        addMinutes(inc?: number) {
            return new IsoDateTime(UtcDate.addMinutes(this.date, inc));
        }

        addHours(inc?: number) {
            return new IsoDateTime(UtcDate.addHours(this.date, inc));
        }

        addSeconds(inc?: number) {
            return new IsoDateTime(UtcDate.addSeconds(this.date, inc));
        }
    }

    export function of(date: DateIn) {
        return new IsoDateTime(new Date(date));
    }

}


export module IsoDate {

}