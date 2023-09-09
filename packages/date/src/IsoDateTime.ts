import {DateIn, TZ} from "./date";
import {UtcDate} from "./UtcDate";
import {IsoDateApi} from "./IsoDate";


interface IsoDateTime extends IsoDateTimeApi {
}

export module IsoDateTime {
    export function of(date: DateIn) {
        return new IsoDateTimeApi(new Date(date));
    }
    export function clone(isoDateTime: IsoDateTime) {
        return isoDateTime.clone(isoDateTime);
    }
}

class IsoDateTimeApi {
    constructor(private date: Date) {
    }

    public toString(): string {
        return this.date.toISOString();
    }

    clone(isoDateTime: IsoDateTime) {
        return IsoDateTime.of(isoDateTime.date);
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
        return new IsoDateTimeApi(UtcDate.lastDayOfMonth(this.date))
    }

    addDays(inc?: number) {
        return new IsoDateTimeApi(UtcDate.addDays(this.date, inc));
    }

    addMonths(inc?: number) {
        return new IsoDateTimeApi(UtcDate.addMonths(this.date, inc));
    }

    addYears(inc?: number) {
        return new IsoDateTimeApi(UtcDate.addYears(this.date, inc));
    }

    addMinutes(inc?: number) {
        return new IsoDateTimeApi(UtcDate.addMinutes(this.date, inc));
    }

    addHours(inc?: number) {
        return new IsoDateTimeApi(UtcDate.addHours(this.date, inc));
    }

    addSeconds(inc?: number) {
        return new IsoDateTimeApi(UtcDate.addSeconds(this.date, inc));
    }

    addQuarter(inc?: number) {
        return new IsoDateTimeApi(UtcDate.addQuarter(this.date, inc))
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
