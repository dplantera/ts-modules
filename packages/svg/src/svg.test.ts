import {findPointAboveLine} from "./svgChart";

describe("svg", () => {
    test("findPointAboveLine", () => {
        const p1 = () => ({x: 0, y: 0});
        const p2 = () => ({x: 5, y:5});
        expect(findPointAboveLine(1, p1(), p2())).toEqual({x: 1, y: 1})
        expect(findPointAboveLine(3, p1(), p2())).toEqual({x: 3, y: 3})
        expect(findPointAboveLine(0, p1(), p2())).toEqual({x: 0, y: 0})
        expect(findPointAboveLine(5, p1(), p2())).toEqual({x: 5, y: 5})
    })
})