#!/usr/bin/env -S node -r "ts-node/register"

import {SvgChart} from "./src/svgChart";


async function main() {
    const seriesA = [{x: 0, y: 10}, {x: 2.5, y: 7.5},{x: 5, y: 5}];
    const seriesB = [{x: 5, y: 5}, {x: 7.5, y: 2.5}, {x: 10, y: 0}];
    const chart = await SvgChart.fromFile("template.svg", {
        axis: {id: {y: "y-axis", x: "x-axis"}, offset: {x: 0.1, y: 0.4}},
        graphs: {filledLines: [{data: seriesA, id: "tilgung"}, {data: seriesB, id: 'anfi'}]},
        // pointsOfInterest: [{data: {x: 5, y: 5}, id: "poi-1"}]
        pointsOfInterest: [{data: {x: 7.5, y: 2.5}, id: "poi-1"}]
        // pointsOfInterest: [{data: {x: 2.5, y: 7.5}, id: "poi-1"}]
    });

    chart.update();

    await chart.save("out.svg");
}


main().then(() => console.log("done"));

