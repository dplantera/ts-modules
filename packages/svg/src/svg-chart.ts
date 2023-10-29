import {Svg, Vec2} from "./svg";

export interface ChartOptions {
    axis: {
        /** set the ids from the svg representing the axis */
        id: { x: string, y: string },
        /** set the offset of the axis in percent so the graph will still have space on its edges  */
        offset: number | { x: number, y: number }
    },
    graphs: { filledLines: Array<{ data: Array<Vec2>, id: string }> },
    pointsOfInterest?: Array<{ data: Vec2, id: string }>
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

        // we need a bucket with all points - so we can scale with alignment
        const graphs = {
            filledLines: opts.graphs.filledLines.flatMap(v => v.data.flatMap(d => ({...d, ref: v.id}))),
            points: opts.pointsOfInterest ?? []
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
                opts.graphs.filledLines.forEach(({data, id}) => this.updatePosFilledLine(id, data));
                opts.pointsOfInterest?.forEach(({id, data}) => this.updatePoi(id, data))
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
