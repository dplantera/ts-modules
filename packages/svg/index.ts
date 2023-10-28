#!/usr/bin/env -S node -r "ts-node/register"

import {SvgChart} from "./src/svgChart";


async function main() {
    const seriesA = [{x: 0, y: 10}, {x: 5, y: 5}];
    const seriesB = [{x: 5.1, y: 4.9}, {x: 10, y: 0}];
    const chart = await SvgChart.fromFile("template.svg", {
        axis: {id: {y: "y-axis", x: "x-axis"}},
        graphs: {filledLines: [{data: seriesA, id: "tilgung"}, {data: seriesB, id: 'anfi'}]},
        pointsOfInterest: ["poi-1"]
    });
    // chart.updatePosFilledLine("tilgung", seriesA);
    // chart.updatePosFilledLine("anfi", seriesB);
    chart.updateFilledLineGraphs();
    chart.updatePosElement("poi-1", {x: 2, y: 10.2})

    await chart.save("out.svg");
}


main().then(() => console.log("done"));

