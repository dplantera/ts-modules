import {DateIn, UtcDate, Format, IsoDateTime, Locals, TZ} from "./dates";


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
        const a = new Date(date());

        const print = a.toLocaleTimeString(Locals.de(), {timeZone: TZ.berlin, ...Format()})
        const iso = new Intl.DateTimeFormat("DE", {timeZone: TZ.berlin, ...Format()})
        expect(print).toEqual("01.12.1990, 01:00:00 MEZ")
        expect(iso.format(a)).toEqual("01.12.1990, 01:00:00 MEZ")
        expect(a.toISOString()).toEqual("1990-12-01T00:00:00.000Z")
    })

    describe("IsoDateTime", () => {
        test("change time", () => {
            const a = date();
            const isoDT = IsoDateTime.of(a);
            expect(isoDT.toString()).toEqual("1990-12-01T00:00:00.000Z")
            expect(isoDT.addHours(-1).toString()).toEqual("1990-11-30T23:00:00.000Z")
            expect(isoDT.addMinutes(-1).toString()).toEqual("1990-11-30T23:59:00.000Z")
            expect(isoDT.addMinutes(-1).addMinutes().toString()).toEqual("1990-12-01T00:00:00.000Z")
            expect(isoDT.addDays(1).toString()).toEqual("1990-12-02T00:00:00.000Z")
            expect(isoDT.addDays(-1).toString()).toEqual("1990-11-30T00:00:00.000Z")
            expect(isoDT.addMonths(1).toString()).toEqual("1991-01-01T00:00:00.000Z")
            expect(isoDT.addMonths(-1).toString()).toEqual("1990-11-01T00:00:00.000Z")
            expect(isoDT.addSeconds(-1).toString()).toEqual("1990-11-30T23:59:59.000Z")
            expect(isoDT.addSeconds(-1).addSeconds(2).toString()).toEqual("1990-12-01T00:00:01.000Z")
            expect(isoDT.addYears(3).addYears(-6).addSeconds(-1).toString()).toEqual("1987-11-30T23:59:59.000Z")
        })

        test("change date", () => {
            const a = date();
            const isoDT = IsoDateTime.of(a);
            expect(isoDT.toString()).toEqual("1990-12-01T00:00:00.000Z")
            expect(isoDT.lastDayOfMonth().toString()).toEqual("1990-12-31T00:00:00.000Z")
            expect(isoDT.lastDayOfMonth().addSeconds().toString()).toEqual("1990-12-31T00:00:01.000Z")
            expect(isoDT.lastDayOfMonth().addSeconds(-1).toString()).toEqual("1990-12-30T23:59:59.000Z")
        })

        test("format in utc", () => {
            const a = date();
            const isoDT = IsoDateTime.of(a);
            expect(isoDT.format("YYYY-MM-DD:hh:mm:ss")).toEqual("1990-12-01:12:00:00")
            expect(isoDT.addHours().addSeconds().format("YYYY-MM-DD:HH:mm:ssZ")).toEqual("1990-12-01:01:00:01+00:00")
            expect(isoDT.addHours().addSeconds().format("YYYY-MM-DDTHH:mm:ssZ")).toEqual("1990-12-01T01:00:01+00:00")
            expect(isoDT.addHours(-1).addSeconds().format("YYYY-MM-DDTHH:mm:ssZ")).toEqual("1990-11-30T23:00:01+00:00")
        })

        test("formatDE", () => {
            const a = date();
            const isoDT = IsoDateTime.of(a);
            expect(isoDT.formatDE("YYYY-MM-DD HH:mm:ssZ")).toEqual("1990-12-01 01:00:00+01:00")
            expect(isoDT.formatDE("MMMM YYYY DD Z")).toEqual("Dezember 1990 01 +01:00")
            expect(isoDT.formatDE("ddd, D. MMMM YYYY")).toEqual("Sa., 1. Dezember 1990")
            expect(isoDT.formatEN("ddd, D. MMMM YYYY")).toEqual("Sat, 1. December 1990")
        })

        test("formatEN and format", () => {
            const a = date();
            const isoDT = IsoDateTime.of(a);
            expect(isoDT.formatEN("ddd, D. MMMM YYYY HH:mm Z", "UTC")).toEqual("Sat, 1. December 1990 00:00 +00:00")
            expect(isoDT.formatEN("ddd, D. MMMM YYYY HH:mm Z", "Europe/Berlin")).toEqual("Sat, 1. December 1990 01:00 +01:00")
            expect(isoDT.format("ddd, D. MMMM YYYY HH:mm Z")).toEqual("Sat, 1. December 1990 00:00 +00:00")
        })
    })
})