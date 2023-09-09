import { Locals, TZ} from "./date";
import {UtcDate} from "./UtcDate";


describe("date", () => {
    const date = () => "1990-12-01T00:00:00.000Z"
    const getTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

    test("last day of month", () => {
        const a = date();
        const last = UtcDate.lastDayOfMonth(a);
        expect(last.toISOString()).toEqual("1990-12-31T00:00:00.000Z")
    })

    test("Date is UTC", () => {
        const a = new Date(date()).toISOString();
        expect(a).toEqual(date())
    })

    test("toDateString return local date", () => {
        const a = new Date(date()).toDateString();
        const b = getTz()
        expect(a).toEqual("Sat Dec 01 1990")
    })

    test("print date in berlin", () => {
         const Format = () => ({
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZoneName: 'short'
        } as const)

        const a = new Date(date());

        const print = a.toLocaleTimeString(Locals.de(), {timeZone: TZ.berlin, ...Format()})
        const iso = new Intl.DateTimeFormat("DE", {timeZone: TZ.berlin, ...Format()})
        expect(print).toEqual("01.12.1990, 01:00:00 MEZ")
        expect(iso.format(a)).toEqual("01.12.1990, 01:00:00 MEZ")
        expect(a.toISOString()).toEqual("1990-12-01T00:00:00.000Z")
    })
})