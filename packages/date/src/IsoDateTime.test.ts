import {IsoDateTime} from "./IsoDateTime";
import {UtcDate} from "./UtcDate";
import is = UtcDate.is;

describe("IsoDateTime", () => {
    const makeDate = () => "1990-12-01T00:00:00.000Z"

    test("change time", () => {
        const a = makeDate();
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
        const a = makeDate();
        const isoDT = IsoDateTime.of(a);
        expect(isoDT.toString()).toEqual("1990-12-01T00:00:00.000Z")
        expect(isoDT.lastDayOfMonth().toString()).toEqual("1990-12-31T00:00:00.000Z")
        expect(isoDT.lastDayOfMonth().addSeconds().toString()).toEqual("1990-12-31T00:00:01.000Z")
        expect(isoDT.lastDayOfMonth().addSeconds(-1).toString()).toEqual("1990-12-30T23:59:59.000Z")
    })

    test("format in utc", () => {
        const a = makeDate();
        const isoDT = IsoDateTime.of(a);
        expect(isoDT.format("YYYY-MM-DD:hh:mm:ss")).toEqual("1990-12-01:12:00:00")
        expect(isoDT.addHours().addSeconds().format("YYYY-MM-DD:HH:mm:ssZ")).toEqual("1990-12-01:01:00:01+00:00")
        expect(isoDT.addHours().addSeconds().format("YYYY-MM-DDTHH:mm:ssZ")).toEqual("1990-12-01T01:00:01+00:00")
        expect(isoDT.addHours(-1).addSeconds().format("YYYY-MM-DDTHH:mm:ssZ")).toEqual("1990-11-30T23:00:01+00:00")
    })

    test("formatDE", () => {
        const a = makeDate();
        const isoDT = IsoDateTime.of(a);
        expect(isoDT.formatDE("YYYY-MM-DD HH:mm:ssZ")).toEqual("1990-12-01 01:00:00+01:00")
        expect(isoDT.formatDE("MMMM YYYY DD Z")).toEqual("Dezember 1990 01 +01:00")
        expect(isoDT.formatDE("ddd, D. MMMM YYYY")).toEqual("Sa., 1. Dezember 1990")
        expect(isoDT.formatEN("ddd, D. MMMM YYYY")).toEqual("Sat, 1. December 1990")
    })

    test("formatEN and format", () => {
        const a = makeDate();
        const isoDT = IsoDateTime.of(a);
        expect(isoDT.formatEN("ddd, D. MMMM YYYY HH:mm Z", "UTC")).toEqual("Sat, 1. December 1990 00:00 +00:00")
        expect(isoDT.formatEN("ddd, D. MMMM YYYY HH:mm Z", "Europe/Berlin")).toEqual("Sat, 1. December 1990 01:00 +01:00")
        expect(isoDT.format("ddd, D. MMMM YYYY HH:mm Z")).toEqual("Sat, 1. December 1990 00:00 +00:00")
    })

    test("add quarter", () => {
        const a = makeDate();
        const isoDT = IsoDateTime.of(a);
        expect(isoDT.addQuarter().toString()).toEqual("1990-03-01T00:00:00.000Z")
        expect(isoDT.addQuarter(2).toString()).toEqual("1990-06-01T00:00:00.000Z")
    })

    test("is on same date", () => {
        const a = makeDate();
        const isoDT = IsoDateTime.of(a);
        expect(isoDT.is( 'sameOrAfter', isoDT)).toBeTruthy();
        expect(isoDT.is( 'between', isoDT, isoDT)).toBeFalsy();
        expect(isoDT.is( 'before', isoDT)).toBeFalsy();
        expect(isoDT.is( 'after', isoDT)).toBeFalsy();
    })
    test("is on different dates", () => {
        const a = makeDate();
        const between = IsoDateTime.of(a);
        const before = between.addSeconds(-1);
        const after = between.addSeconds(1);

        expect(before.is( 'before', after)).toBeTruthy();
        expect(before.is( 'after', after, between)).toBeFalsy();
        expect(before.is( 'between', after)).toBeFalsy();
        expect(before.is( 'sameOrAfter', after)).toBeFalsy();
        expect(before.is( 'sameOrAfter', between)).toBeFalsy();

        expect(after.is( 'after', before, between)).toBeTruthy();
        expect(after.is( 'between', before)).toBeFalsy();
        expect(after.is( 'sameOrAfter', before)).toBeTruthy();
        expect(after.is( 'sameOrAfter', between)).toBeTruthy();

        expect(between.is( 'after', after)).toBeFalsy();
        expect(between.is( 'after', before)).toBeTruthy();
        expect(between.is( 'after', between)).toBeFalsy();

        expect(between.is( 'before', after)).toBeTruthy();
        expect(between.is( 'before', before)).toBeFalsy();
        expect(between.is( 'before', between)).toBeFalsy();

        expect(between.is( 'sameOrAfter', after)).toBeFalsy();
        expect(between.is( 'sameOrAfter', before)).toBeTruthy();
        expect(between.is( 'sameOrAfter', between)).toBeTruthy();

        expect(between.is( 'between', after, before)).toBeTruthy();
        expect(between.is( 'between', between)).toBeFalsy();
        expect(between.is( 'between', between, after)).toBeFalsy();
        expect(between.is( 'between', between, before)).toBeFalsy();
    })
})
