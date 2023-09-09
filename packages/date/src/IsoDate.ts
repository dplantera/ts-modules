import {DateIn, TZ} from "./date";
import {UtcDate} from "./UtcDate";


export type IsoDate = IsoDate._IsoDate;
export module IsoDate {
    export type _IsoDate = IsoDate;
    export function of(date: DateIn) {
        return new IsoDate(new Date(date));
    }

    class IsoDate {
        constructor(private date: Date) {
        }

        public toString(): string {
            return this.format("YYYY-MM-DD");
        }

        format(fmt: string) {
            if(/(hHmsSZaAxXk)/ug.test(fmt)){
                throw new Error("It is not allowed to apply time formats on IsoDate like hh:mm:ss or timezone Z. Only date formats are allowed e.g. YYYY-MM-DD");
            }
            return UtcDate.format(this.date, fmt);
        }

        addYears(inc?: number) {
            return new IsoDate(UtcDate.addYear(this.date, inc));
        }

        lastDayOfMonth() {
            return new IsoDate(UtcDate.lastDayOfMonth(this.date))
        }

        addDays(inc?: number) {
            return new IsoDate(UtcDate.addDay(this.date, inc));
        }

        addMonths(inc?: number) {
            return new IsoDate(UtcDate.addMonth(this.date, inc));
        }
    }
}
