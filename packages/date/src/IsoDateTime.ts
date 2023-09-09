import {DateIn, TZ} from "./date";
import {UtcDate} from "./UtcDate";


export type IsoDateTime = IsoDateTime._IsoDateTime;
export module IsoDateTime {
    export type _IsoDateTime = IsoDateTime;
    export function of(date: DateIn) {
        return new IsoDateTime(new Date(date));
    }

    class IsoDateTime {
        constructor(private date: Date) {
        }

        public toString(): string {
            return this.date.toISOString();
        }

        format(fmt: string) {
            return UtcDate.format(this.date, fmt);
        }

        formatDE(fmt: string) {
            return UtcDate.formatTZ(this.date, fmt, "de", TZ.berlin);
        }

        formatEN(fmt: string, tz: TZ = TZ.utc) {
            return UtcDate.formatTZ(this.date, fmt, "en-US", tz);
        }

        lastDayOfMonth() {
            return new IsoDateTime(UtcDate.lastDayOfMonth(this.date))
        }

        addDays(inc?: number) {
            return new IsoDateTime(UtcDate.addDay(this.date, inc));
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
}
