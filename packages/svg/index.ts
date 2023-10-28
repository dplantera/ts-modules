#!/usr/bin/env -S node -r "ts-node/register"

import {INode, parse, stringify} from "svgson"
import * as fs from "fs";
import {Svg} from "./src/svg";
import {SvgChart} from "./src/svgChart";

function scaleChart(pos: number, posMax: number, posMin: number, chartPosMax: number) {
    return ((pos) / (posMax)) * chartPosMax
}


async function main() {
    const data = [{x: 0, y: 10}, {x: 5, y: 5}];
    const chart = await SvgChart.fromFile("template.svg", {axis: {id: {y: "y-axis", x : "x-axis"}}});
    chart.updateFilledLine("tilgung", data);

    const poi1 = chart.mutSvg().mutSelectById( "poi-1")
    poi1.mutMove({x: 0, y: 0})

    await chart.save("out.svg");
}


main().then(() => console.log("done"));

