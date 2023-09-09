import {DateIn, TZ} from "./date";
import {UtcDate} from "./UtcDate";
import {IsoDateTime} from "./IsoDateTime";


interface IsoDate extends IsoDateApi {
}
export module IsoDate {
    export function of(date: DateIn) {
        return new IsoDateApi(new Date(date));
    }

}


export class IsoDateApi {
    constructor(private date: Date) {
    }

    public toString(): string {
        return this.format("YYYY-MM-DD");
    }

    format(fmt: string) {
        if (/(hHmsSZaAxXk)/ug.test(fmt)) {
            throw new Error("It is not allowed to apply time formats on IsoDate like hh:mm:ss or timezone Z. Only date formats are allowed e.g. YYYY-MM-DD");
        }
        return UtcDate.format(this.date, fmt);
    }

    addYears(inc?: number) {
        return new IsoDateApi(UtcDate.addYears(this.date, inc));
    }

    lastDayOfMonth() {
        return new IsoDateApi(UtcDate.lastDayOfMonth(this.date))
    }

    addDays(inc?: number) {
        return new IsoDateApi(UtcDate.addDays(this.date, inc));
    }

    addMonths(inc?: number) {
        return new IsoDateApi(UtcDate.addMonths(this.date, inc));
    }

    addQuarter(inc?: number) {
        return new IsoDateApi(UtcDate.addQuarter(this.date, inc))
    }

    is(a: IsoDate, op: UtcDate.UtcCompareOperation, b: IsoDate, c?: IsoDate) {
        switch (op){
            case "between":
                return UtcDate.is(a.date, op, b.date, c?.date ?? b.date);
            case "before":
            case "after":
            case "sameOrAfter":
                return UtcDate.is(a.date, op, b.date);
        }
    }
}
