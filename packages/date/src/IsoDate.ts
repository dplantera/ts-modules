import {DateIn, TZ} from "./date";
import {UtcDate} from "./UtcDate";
import {IsoDateTime} from "./IsoDateTime";
import UtcDurationUnit = UtcDate.UtcDurationUnit;


export class IsoDate {
    constructor(private date: Date) {
    }
    public static of(date: DateIn) {
        return new IsoDate(new Date(date));
    }

    public toString(): string {
        return this.format("YYYY-MM-DD");
    }

    clone() {
        return IsoDateTime.of(this.date);
    }

    format(fmt: string) {
        if (/(hHmsSZaAxXk)/ug.test(fmt)) {
            throw new Error("It is not allowed to apply time formats on IsoDate like hh:mm:ss or timezone Z. Only date formats are allowed e.g. YYYY-MM-DD");
        }
        return UtcDate.format(this.date, fmt);
    }

    addYears(inc?: number) {
        return new IsoDate(UtcDate.add(this.date,'years', inc));
    }

    lastDayOfMonth() {
        return new IsoDate(UtcDate.lastDayOfMonth(this.date))
    }

    addDays(inc?: number) {
        return new IsoDate(UtcDate.add(this.date,'days', inc));
    }

    addMonths(inc?: number) {
        return new IsoDate(UtcDate.add(this.date,'months', inc));
    }

    addQuarter(inc?: number) {
        return new IsoDate(UtcDate.add(this.date, 'quarter',inc));
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

    startOf(unit: UtcDurationUnit) {
        const d = new Date(this.date);
        const start = UtcDate.startOf(this.date, unit);
        this.updateFromDateMutable(d, start);
        return new IsoDate(d);
    }

    endOf(unit: UtcDurationUnit) {
        const d = new Date(this.date);
        const end = UtcDate.endOf(this.date, unit);
        this.updateFromDateMutable(d, end);
        return new IsoDate(d);
    }

    private updateFromDateMutable(current: Date, update: Date) {
        current.setUTCFullYear(update.getUTCFullYear());
        current.setUTCMonth(update.getUTCMonth());
        current.setUTCDate(update.getUTCDate());
    }
}
