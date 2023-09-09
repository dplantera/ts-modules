import{IsoDate} from "./IsoDate";

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

    test("format with valid patterns", () => {
        const a = makeDate();
        const isoDT = IsoDate.of(a);
        expect(isoDT.format("YYYY-MM-DD")).toEqual("1990-12-01")
        expect(isoDT.format("ddd, D. MMMM YYYY")).toEqual("Sat, 1. December 1990")
        expect(isoDT.format("Q/YYYY-MM-DD")).toEqual("4/1990-12-01")
    })

    test("format with invalid time patterns", () => {
        const a = makeDate();
        const isoDT = IsoDate.of(a);
        expect(() => isoDT.format("hh::mm:ss am")).toThrow()
        expect(() => isoDT.format("hh::mm:ss am")).toThrow()
        expect(() => isoDT.format("hh")).toThrow()
        expect(() => isoDT.format("mm")).toThrow()
        expect(() => isoDT.format("ss")).toThrow()
        expect(() => isoDT.format("")).toThrow()
    })

    const quarterCases = [
        {
            date: "1990-02-22",
            addQuarter: -1,
            expString: "1989-11-22",
            expDate: (d: IsoDate) => d.addMonths(-3)
        },
        {
            date: "1990-02-22",
            addQuarter: 0,
            expString: "1990-02-22",
            expDate: (d: IsoDate) => d
        },
        {
            date: "1990-02-22",
            addQuarter: 1,
            expString: "1990-05-22",
            expDate: (d: IsoDate) => d.addMonths(3)
        },
        {
            date: "1990-02-22",
            addQuarter: 5,
            expString: "1991-05-22",
            expDate: (d: IsoDate) => d.addYears(1).addMonths(3)
        }
    ]
    test.each(quarterCases)("add quarter: $date + ($addQuarter) = $expString", (quarterCase) => {
        const isoDate = IsoDate.of(quarterCase.date);

        expect(isoDate.toString()).toEqual(quarterCase.date)
        expect(isoDate.addQuarter(quarterCase.addQuarter).toString()).toEqual(quarterCase.expString)
        expect(isoDate.addQuarter(quarterCase.addQuarter).toString()).toEqual(quarterCase.expDate(isoDate).toString())
    })

})
