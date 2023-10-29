import {SvgChart} from "./svg-chart";
import fs from "fs";
import * as process from "process";
import * as path from "path";

describe("SvgChart", () => {
    test("time", async () => {
        const seriesA = [
            {x: "2023-01-01", y: 10},
            {x: "2028-12-31", y: 7.5},
            {x: "2033-12-31", y: 5}
        ];
        const seriesB = [
            {x: "2033-12-31", y: 5},
            {x: "2043-12-31", y: 2.5},
            {x: "2053-12-31", y: 0}
        ];
        const chart = await SvgChart.fromFile("template.svg", {
            axis: {id: {y: "y-axis", x: "x-axis"}, offset: {x: 0.1, y: 0.4}},
            graphs: {
                filledLines: [
                    {data: seriesA, id: "tilgung"},
                    {data: seriesB, id: "anfi"},
                ]
            },
            // pointsOfInterest: [{data: {x: 5, y: 5}, id: "poi-1"}]
            pointsOfInterest: [{data: seriesB[0], id: "poi-1"}]
        });
        chart.update();
        // await chart.save("out.svg")
        const expected = fs.readFileSync(path.resolve(process.cwd(), "test/fixtures/qualitative.svg"), "utf-8")
        equalWithoutNewLines(chart.toString(), expected)
    })
    test("simple", async () => {
        const seriesA = [{x: 0, y: 10}, {x: 2.5, y: 7.5}, {x: 5, y: 5}];
        const seriesB = [{x: 5, y: 5}, {x: 7.5, y: 2.5}, {x: 10, y: 0}];
        const chart = await SvgChart.fromFile("template.svg", {
            axis: {id: {y: "y-axis", x: "x-axis"}, offset: {x: 0.1, y: 0.4}},
            graphs: {filledLines: [{data: seriesA, id: "tilgung"}, {data: seriesB, id: 'anfi'}]},
            // pointsOfInterest: [{data: {x: 2.5, y: 7.5}, id: "poi-1"}]
            // pointsOfInterest: [{data: {x: 5, y: 5}, id: "poi-1"}]
            pointsOfInterest: [{data: {x: 7.5, y: 2.5}, id: "poi-1"}]
        });
        chart.update();
        // await chart.save("out.svg")
        const expected = fs.readFileSync(path.resolve(process.cwd(), "test/fixtures/simple.svg"), "utf-8")
        equalWithoutNewLines(chart.toString(), expected)
    })

    test("simple scaled", async () => {
        const seriesA = [{x: 0, y: 10000}, {x: 2500, y: 7500}, {x: 5000, y: 5000}];
        const seriesB = [{x: 5000, y: 5000}, {x: 7500, y: 2500}, {x: 10000, y: 0}];
        const chart = await SvgChart.fromFile("template.svg", {
            axis: {id: {y: "y-axis", x: "x-axis"}, offset: {x: 0.1, y: 0.4}},
            graphs: {filledLines: [{data: seriesA, id: "tilgung"}, {data: seriesB, id: 'anfi'}]},
            pointsOfInterest: [{data: {x: 7500, y: 2500}, id: "poi-1"}]
        });
        chart.update();
        // await chart.save("out.svg")
        const expected = fs.readFileSync(path.resolve(process.cwd(), "test/fixtures/simple.svg"), "utf-8")
        equalWithoutNewLines(chart.toString(), expected)
    })

    function equalWithoutNewLines(a: string, b: string) {
        const reg = new RegExp("\n|\r\n|\\s", "gmu")
        expect(a.replaceAll(reg, "")).toEqual(b.replaceAll(reg, ""))
    }
})