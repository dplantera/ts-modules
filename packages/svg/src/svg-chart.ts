import {Svg, Vec2} from "./svg";
import * as _ from "lodash";

export interface ChartOptions {
    axis: {
        /** set the ids from the svg representing the axis */
        id: { x: string, y: string },
        /** set the offset of the axis in percent so the graph will still have space on its edges  */
        offset: number | { x: number, y: number }
    },
    graphs: { filledLines: Array<{ data: Array<Vec2<number | string>>, id: string }> },
    pointsOfInterest?: Array<{ data: Vec2<number | string>, id: string }>
}

export module ChartTranslator {
    export function of(data: Array<Vec2>, arg: {
        maxSpace: Vec2,
        minSpace: Vec2
    } & Pick<ChartOptions['axis'], 'offset'>) {
        const {maxSpace: {x: maxWidth, y: maxHeight}, minSpace: {x: minWidth, y: minHeight}} = arg;
        const flipY = (p: number) => maxHeight - p;
        return {
            point(vec: Vec2, opt?: { withOffset: boolean }) {
                const option = opt ?? {withOffset: true};
                const extrema = option.withOffset ? extremePointsWithOffset(data, arg) : extremePoints(data)
                const {yDataMax, yDataMin, xDataMin, xDataMax} = extrema

                const scaledX = scale(vec.x, xDataMax, xDataMin, maxWidth, 0);
                const scaledY = scale(vec.y, yDataMax, yDataMin, maxHeight, 0);
                return {
                    x: scaledX,
                    y: flipY(scaledY)
                }
            },
            points(vec: Array<Vec2>, opt?: { withOffset: boolean }) {
                return vec.map((p) => this.point(p, opt))
            },
            findPointOnMax(givenX: number) {
                const {yDataMax, yDataMin, xDataMin, xDataMax} = extremePoints(data)
                const foundPoint = findPointAboveLine(givenX, {x: xDataMin, y: yDataMin}, {
                    x: xDataMax,
                    y: yDataMax
                }, {maxHeight: yDataMax})
                return this.point(foundPoint);
            }
        }
    }

    function extremePointsWithOffset(data: Array<Vec2>, arg?: Pick<ChartOptions['axis'], "offset">) {
        const offset = arg?.offset ?? 1
        const extrema = extremePoints(data);
        return withOffset(extrema, {offset});
    }

    function extremePoints(data: Array<Vec2>) {
        const xData = data.map(d => d.x)
        const yData = data.map(d => d.y)
        return {
            xDataMin: Math.min(...xData),
            xDataMax: Math.max(...xData),
            yDataMin: Math.min(...yData),
            yDataMax: Math.max(...yData),
        }
    }

    function withOffset(dim: ReturnType<typeof extremePoints>, arg: Pick<ChartOptions['axis'], "offset">) {
        const offset = typeof arg.offset === "number" ? {x: arg.offset, y: arg.offset} : arg.offset
        const xOffset = offset.x
        const yOffset = offset.y
        return {
            ...dim,
            xDataMax: dim.xDataMax * xOffset,
            yDataMax: dim.yDataMax * yOffset,
        }
    }

    function scale(pos: number, posMax: number, posMin: number, chartPosMax: number, chartPosMin: number) {
        return (pos - posMin) / (posMax - posMin) * (chartPosMax - chartPosMin) + chartPosMin
    }

    export function findPointAboveLine(givenX: number, p1: Vec2, p2: Vec2, arg: { maxHeight: number }) {
        const slope = (p2.y - p1.y) / (p2.x - p1.x);
        const y = slope * givenX;
        const invertedYAxisAware = arg.maxHeight - y;
        return {x: givenX, y: invertedYAxisAware};
    }
}
export module SvgChart {
    export async function fromFile(filePath: string, opts: ChartOptions) {
        return of((await Svg.fromFile(filePath)), opts)
    }

    export function of(svg: Svg, opts: ChartOptions) {
        const xAxis = svg.mutSelectById(opts.axis.id.x);
        const yAxis = svg.mutSelectById(opts.axis.id.y);

        const chartWidth = xAxis.dimensions().width;
        const chartHeight = yAxis.dimensions().height;

        const xAxisOffset = axisOffset('x', opts);
        const yAxisOffset = axisOffset('y', opts);

        // todo: refactor out logic to handle NaN type value for x-axis
        const xValueGenerator = () => {
            let counter = 0;
            const cache: Record<string, number> = {};
            return (id: string |number) =>  {
                if(typeof id === "number") {
                    return id;
                }
                if(_.isNil(cache[id])){
                    cache[id] = counter++;
                }
                return cache[id];
            }
        }
        const getXValue = xValueGenerator();
        // we need a bucket with all points - so we can scale with alignment
        const mapFilledLines = opts.graphs.filledLines
            .flatMap((v, gIdx) => v.data.flatMap((d, idx) => (
                {
                    y: d.y,
                    ref: v.id,
                    x: getXValue(d.x),
                    value: d.x
                }))
            );
        const graphs = {
            filledLines: mapFilledLines,
            points: opts.pointsOfInterest?.map(d => ({
                x: typeof d.data.x === "string" ? mapFilledLines.find(p => p.value === d.data.x)?.x ?? Number.parseFloat(d.data.x) : d.data.x,
                y: d.data.y,
                ref: d.id,
                value: d.data.x
            })) ?? []
        } satisfies {
            filledLines: Array<Vec2 & { ref: string, value: string | number }>;
            points: Array<Vec2 & { ref: string, value: string | number }>
        };

        const translate = ChartTranslator.of(graphs.filledLines, {
            offset: {x: xAxisOffset, y: yAxisOffset},
            maxSpace: {x: chartWidth, y: chartHeight},
            minSpace: {x: 0, y: 0}
        })

        return {
            height() {
                return chartHeight
            },
            width() {
                return chartWidth
            },
            mutSvg() {
                return svg
            },
            save(filePath: string) {
                return svg.save(filePath);
            },
            updatePosFilledLine(id: string, data: Array<Vec2>) {
                svg.mutSelectById(id).toFilledLine(translate.points(data), {fillUpHeight: this.height()})
            },
            updatePoi(id: string, posRaw: Vec2) {
                const poi1 = svg.mutSelectById(id);
                const poi1Data = poi1.mutSelectById("poi-data");
                poi1Data.setContent(`${posRaw.x}, ${posRaw.y}`)

                const poiPosTranslated = translate.findPointOnMax(posRaw.x);
                // todo: get radius from poi marker
                const dim = poi1.dimensions();
                const offsetMarkerRadius = 5;

                const newPoint = {x: poiPosTranslated.x, y: poiPosTranslated.y - dim.height + offsetMarkerRadius};
                poi1.setPos(newPoint)

                // try scale on overflow
                const poiWidth = newPoint.x + dim.width;
                if (poiWidth > chartWidth) {
                    console.log(`found overflow for ${id} - try to fix it by scaling`, newPoint.x + dim.width)
                    const f = (chartWidth / poiWidth);
                    poi1.scale(f);
                }
            },
            toString() {
                return this.mutSvg().toString()
            },
            update() {
                const graphsById = _.groupBy(graphs.filledLines, 'ref');
                Object.entries(graphsById).forEach(([key, data]) => {
                    this.updatePosFilledLine(key, data);
                })

                const poisById = _.groupBy(graphs.points, 'ref');
                Object.entries(poisById).forEach(([key, data]) => {
                    data.forEach(poi => this.updatePoi(key, poi));
                })
            },
        }
    }

    function axisOffset(axis: 'x' | 'y', opts: ChartOptions) {
        if (typeof opts.axis.offset === "number") {
            return 1 + opts.axis.offset;
        }
        return 1 + opts.axis.offset[axis]
    }
}
