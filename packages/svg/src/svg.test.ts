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
        const p1 = () => ({x: 0, y: 0}), p2 = () => ({x: xMax, y: yMax}) ;
        const translate = ChartTranslator.of([p1(), p2()], {
            minSpace: {x: 0, y: 0},
            maxSpace: {x: xMax, y: yMax},
            offset: 1
        })
        expect(translate.findPointOnMax(0)).toEqual({x: 0, y: yMax})
        expect(translate.findPointOnMax(1)).toEqual({x: 1, y: yMax - 1})
        expect(translate.findPointOnMax(3)).toEqual({x: 3, y: yMax - 3})
        expect(translate.findPointOnMax(5)).toEqual({x: 5, y: yMax - 5})
    })

    test("findPointAboveLine negative orientation", () => {
        /*
          (0,0)|
               |  o (x, y_max - y)
               |
     (0, y_max) - - - - - - (x_max, y_max)
         */
        const yMax = 5, xMax = 5;
        const p2 = () => ({x: 0, y: 0}), p1 = () => ({x: xMax, y: yMax}) ;
        const translate = ChartTranslator.of([p1(), p2()], {
            minSpace: {x: 0, y: 0},
            maxSpace: {x: xMax, y: yMax},
            offset: 1
        })
        expect(translate.findPointOnMax(0)).toEqual({x: 0, y: yMax})
        expect(translate.findPointOnMax(1)).toEqual({x: 1, y: yMax - 1})
        expect(translate.findPointOnMax(3)).toEqual({x: 3, y: yMax - 3})
        expect(translate.findPointOnMax(5)).toEqual({x: 5, y: yMax - 5})
    })
    // test("findPointAboveLine 2", () => {
    //     // 1672531200000
    //     const min = new Date("2023-01-01").getTime();
    //     // 2650752000000
    //     const max = new Date("2053-12-31").getTime();
    //     /*
    //       (0,0)|
    //            |  o (x, y_max - y)
    //            |
    //  (0, y_max) - - - - - - (x_max, y_max)
    //      */
    //     const yMax = 10, xMax = max;
    //     const p1 = () => ({x: min, y: 0}), p2 = () => ({x: xMax, y: yMax}) ;
    //     const translate = ChartTranslator.of([p1(), p2()], {
    //         minSpace: {x: 0, y: 0},
    //         maxSpace: {x: xMax, y: yMax},
    //         offset: 1
    //     })
    //     expect(findPointAboveLine(0, p1(), p2())).toEqual({x: 0, y: 10})
    //     // expect(findPointAboveLine(1, p1(), p2())).toEqual({x: 1, y: 9.999999999996227})
    //     // expect(findPointAboveLine(3, p1(), p2())).toEqual({x: 3, y: 9.999999999988683})
    //     expect(findPointAboveLine(5, p1(), p2())).toEqual({x: 5, y: 9.999999999981137})
    // })
})