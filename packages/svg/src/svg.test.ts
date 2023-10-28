import {findPointAboveLine} from "./svg-chart";

describe("svg", () => {
    test("findPointAboveLine", () => {
        /*
          (0,0)|
               |  o (x, y_max - y)
               |
     (0, y_max) - - - - - - (x_max, y_max)
         */
        const yMax = 5, xMax = 5;
        const p1 = () => ({x: 0, y: 0}), p2 = () => ({x: xMax, y: yMax}) ;
        expect(findPointAboveLine(1, p1(), p2())).toEqual({x: 1, y: yMax - 1})
        expect(findPointAboveLine(3, p1(), p2())).toEqual({x: 3, y: yMax - 3})
        expect(findPointAboveLine(0, p1(), p2())).toEqual({x: 0, y: yMax})
        expect(findPointAboveLine(5, p1(), p2())).toEqual({x: 5, y: yMax - 5})
    })
})