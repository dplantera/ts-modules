import {IsoDate} from "./IsoDate";
import {date} from "zod";

describe("IsoDate", () => {
    const makeDate = () => "1990-12-01"

    test("change time", () => {
        const a = makeDate();
        const isoDT = IsoDate.of(a);
        expect(isoDT.toString()).toEqual("1990-12-01")
        expect(isoDT.addDays(1).toString()).toEqual("1990-12-02")
        expect(isoDT.addDays(-1).toString()).toEqual("1990-11-30")
        expect(isoDT.addMonths(1).toString()).toEqual("1991-01-01")
        expect(isoDT.addMonths(-1).toString()).toEqual("1990-11-01")
    })

    test("change date", () => {
        const a = makeDate();
        const isoDT = IsoDate.of(a);
        expect(isoDT.toString()).toEqual("1990-12-01")
        expect(isoDT.lastDayOfMonth().toString()).toEqual("1990-12-31")
    })

    test("format in utc", () => {
        const a = makeDate();
        const isoDT = IsoDate.of(a);
        expect(isoDT.format("YYYY-MM-DD")).toEqual("1990-12-01")
    })

    test("formatDE", () => {
        const a = makeDate();
        const isoDT = IsoDate.of(a);
    })

    test("formatEN and format", () => {
        const a = makeDate();
        const isoDT = IsoDate.of(a);
        expect(isoDT.format("ddd, D. MMMM YYYY")).toEqual("Sat, 1. December 1990")
        expect(isoDT.format("Q/YYYY-MM-DD")).toEqual("4/1990-12-01")
    })

    test("add quarter", () => {
        const a = makeDate();
        const isoDT = IsoDate.of(a);
        expect(isoDT.toString()).toEqual(makeDate())
        expect(isoDT.addQuarter().toString()).toEqual("1990-03-01")
        expect(isoDT.addQuarter(2).toString()).toEqual("1990-06-01")
        expect(isoDT.addQuarter(-1).toString()).toEqual("1989-09-01")
    })
})
