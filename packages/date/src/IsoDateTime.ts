import {DateIn, TZ} from "./date";
import {UtcDate} from "./UtcDate";
import {IsoDate} from "./IsoDate";
import UtcDurationUnit = UtcDate.UtcDurationUnit;


export class IsoDateTime {
    constructor(private date: Date) {
    }

    public static of(date: DateIn) {
        return new IsoDateTime(new Date(date));
    }
    public toString(): string {
        return this.date.toISOString();
    }

    clone() {
        return IsoDateTime.of(this.date);
    }
    toDate(){
        return new Date(this.date);
    }
    format(fmt: UtcDate.Format) {
        return UtcDate.format(this.date, fmt);
    }

    formatDE(fmt: UtcDate.Format) {
        return UtcDate.formatTZ(this.date, fmt, "de", TZ.berlin);
    }

    formatEN(fmt: UtcDate.Format, tz: TZ = TZ.utc) {
        return UtcDate.formatTZ(this.date, fmt, "en-US", tz);
    }

    lastDayOfMonth() {
        return new IsoDateTime(UtcDate.lastDayOfMonth(this.date))
    }

    addDays(inc?: UtcDate.IncrementOrDecrement) {
        return new IsoDateTime(UtcDate.add(this.date, 'days',inc));
    }

    addMonths(inc?: UtcDate.IncrementOrDecrement) {
        return new IsoDateTime(UtcDate.add(this.date, 'months',inc));
    }

    addYears(inc?: UtcDate.IncrementOrDecrement) {
        return new IsoDateTime(UtcDate.add(this.date, 'years',inc));
    }

    addMinutes(inc?: UtcDate.IncrementOrDecrement) {
        return new IsoDateTime(UtcDate.add(this.date, 'minutes',inc));
    }

    addHours(inc?: UtcDate.IncrementOrDecrement) {
        return new IsoDateTime(UtcDate.add(this.date, 'hours',inc));
    }

    addSeconds(inc?: UtcDate.IncrementOrDecrement) {
        return new IsoDateTime(UtcDate.add(this.date, 'seconds',inc));
    }

    addQuarter(inc?: UtcDate.IncrementOrDecrement) {
        return new IsoDateTime(UtcDate.add(this.date, 'quarter',inc));
    }

    startOf(unit: UtcDurationUnit) {
        return UtcDate.startOf(this.date, unit);
    }

    endOf(unit: UtcDurationUnit) {
        return UtcDate.endOf(this.date, unit);
    }

    is(op: UtcDate.UtcCompareOperation, b: IsoDateTime, c?: IsoDateTime) {
        switch (op){
            case "between":
                return UtcDate.is(this.date, op, b.date, c?.date ?? b.date);
            case "before":
            case "after":
            case "sameOrAfter":
                return UtcDate.is(this.date, op, b.date);
        }
    }
}
