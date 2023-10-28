import {Svg} from "../svg";
import {getBoundingBox} from "./bbox";

describe("bbox", () => {
    test("complex", async () => {
        const svg = await getElement("complex");
        expect(getBoundingBox(svg.get())).toEqual({"x1": 227, "x2": 454.5, "y1": 164.51, "y2": 256});
    })
    test("simple", async () => {
        const svg = await getElement("simple");
        expect(getBoundingBox(svg.get())).toEqual({"x1": 0, "x2": 500, "y1": 256, "y2": 256});
    })
    test("group", async () => {
        const svg = await getElement("group");
        expect(getBoundingBox(svg.get())).toEqual({"x1": 0, "x2": 5, "y1": 0, "y2": 250});
    })

    async function getElement(id: string){
        const svg = await Svg.fromStr(getSvg());
        return svg.mutSelectById(id);
    }
    function getSvg() {
        return `<svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg" xmlns:bx="https://boxy-svg.com">
    <g transform="matrix(1,0,0,1,250,128.0785)" id="group">
        <text style="fill: rgb(51, 51, 51); font-family: Arial, sans-serif; font-weight: 700; white-space: pre; font-size: 15px;"
              id="poi-label" x="5" y="15"><title>poi-label</title>Darlehen 1
        </text>
        <text style="fill: rgb(51, 51, 51); font-family: Arial, sans-serif; font-size: 13px; white-space: pre;"
              x="5" y="40">Ende der Sollzinsbindung
        </text>
        <text style="fill: rgb(51, 51, 51); font-family: Arial; font-size: 13px;" x="5" y="60">10.10.2024,
            200.000,00 €
        </text>
        <path style="fill: rgb(216, 216, 216); stroke: rgb(0, 0, 0); stroke-dasharray: 4;"
              d="M 0 250 L 0 0">
            <title>poi-mark</title>
        </path>
    </g>
    <path style="fill: rgb(216, 216, 216); stroke: rgb(0, 0, 0);" d="M 500 256 L 0 256" id="simple">
    </path>
    <path d="M 227 164.51 L 454.5 256 L 454 256 L 227 256 Z"
          style="fill-rule: nonzero; paint-order: stroke markers; fill: rgb(111, 111, 111); stroke: rgb(255, 255, 255);"
          id="complex" bx:shape="triangle 228.095 164.247 229.826 91.559 0 0 1@501d7a8a">
    </path>
</svg>`
    }
})