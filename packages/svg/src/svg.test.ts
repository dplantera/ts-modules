import {ChartTranslator} from "./svg-chart";

describe("svg", () => {
    test("findPointAboveLine positive orientation", () => {
        /*
          (0,0)|
               |  o (x, y_max - y)
               |
     (0, y_max) - - - - - - (x_max, y_max)
         */
        const yMax = 5, xMax = 5;
        const p1 = () => ({x: 0, y: 0}), p2 = () => ({x: xMax, y: yMax});
        const translate = ChartTranslator.of([p1(), p2()], {
            minSpace: {x: 0, y: 0},
            maxSpace: {x: xMax, y: yMax},
            offset: 1
        })
        expect(translate.findPointOnMax(0)).toEqual({x: 0, y: 0})
        expect(translate.findPointOnMax(1)).toEqual({x: 1, y: 1})
        expect(translate.findPointOnMax(3)).toEqual({x: 3, y: 3})
        expect(translate.findPointOnMax(5)).toEqual({x: 5, y: 5})
    })

    test.skip("findPointAboveLine negative orientation", () => {
        /*
          (0,0)|
               |  o (x, y_max - y)
               |
     (0, y_max) - - - - - - (x_max, y_max)
         */
        const yMax = 5, xMax = 5;
        // fixme: we change the starting points but the chart is (yet) not aware of any orientation of the graph....
        const p1 = () => ({x: 0, y: 0}), p2 = () => ({x: xMax, y: yMax});
        const translate = ChartTranslator.of([p2(), p1()], {
            minSpace: {x: 0, y: 0},
            maxSpace: {x: xMax, y: yMax},
            offset: 1
        })
        expect(translate.findPointOnMax(0)).toEqual({x: 0, y: yMax})
        expect(translate.findPointOnMax(1)).toEqual({x: 1, y: yMax - 1})
        expect(translate.findPointOnMax(3)).toEqual({x: 3, y: yMax - 3})
        expect(translate.findPointOnMax(5)).toEqual({x: 5, y: yMax - 5})
    })
    test.skip("findPointAboveLine 2", () => {
        // 1672531200000
        const xMin = new Date("2023-01-01").getTime();
        // 2650752000000
        const xMax = new Date("2053-12-31").getTime();
        const yMin = 0;
        const yMax = 10;
        const p1 = () => ({x: xMin, y: yMin}), p2 = () => ({x: xMax, y: yMax});
        const translate = ChartTranslator.of([p1(), p2()], {
            minSpace: {x: 0, y: 0},
            maxSpace: {x: xMax, y: yMax},
            offset: 1 // means no offset...
        })
        const min = translate.point({x: xMin, y: yMin})
        expect(translate.findPointOnMax(xMin)).toEqual(min)
        // expect(translate.findPointOnMax(xMax)).toEqual(max)
    })
})