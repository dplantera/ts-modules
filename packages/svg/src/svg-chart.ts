import { Svg, Vec2} from "./svg";

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

export module SvgChart {
    export async function fromFile(filePath: string, opts: ChartOptions) {
        return of((await Svg.fromFile(filePath)), opts)
    }

    export function of(svg: Svg, opts: ChartOptions) {
        const yAxis = svg.mutSelectById(opts.axis.id.y);
        const xAxis = svg.mutSelectById(opts.axis.id.x);
        const translatePoint = {
            "default": (a: Vec2) => ({...a, xWithOffset: a.x, yWithOffset: a.y}),
            absolute: (a: Vec2) => ({...a, xWithOffset: a.x, yWithOffset: a.y}),
        };
        // we need a bucket with all points - so we can scale with alignment
        const graphs = {
            filledLines: opts.graphs.filledLines.flatMap(v => v.data.flatMap(d => ({...d, ref: v.id}))),
            points: opts.pointsOfInterest ?? []
        };
        const api = {
            height() {
                return yAxis.dimensions().height
            },
            width() {
                return xAxis.dimensions().width
            },
            mutSvg() {
                return svg
            },
            save(filePath: string) {
                return svg.save(filePath);
            },
            axisOffset(axis: 'x' | 'y') {
                if (typeof opts.axis.offset === "number") {
                    return 1 + opts.axis.offset;
                }
                return 1 + opts.axis.offset[axis]
            },
            extremePoints() {
                // fixme: maybe optimize
                const xData = graphs.filledLines.map(d => d.x)
                const yData = graphs.filledLines.map(d => d.y)
                return {
                    xDataMin: Math.min(...xData),
                    xDataMax: Math.max(...xData),
                    yDataMin: Math.min(...yData),
                    yDataMax: Math.max(...yData),
                }
            },
            withOffset(dim: ReturnType<typeof this.extremePoints>) {
                return {
                    ...dim,
                    xDataMax: dim.xDataMax * this.axisOffset('x'),
                    yDataMax: dim.yDataMax * this.axisOffset('y'),
                }
            },
            // todo: refactor - just added quickly support for diffrent minimum and maximum (scaled with and without offset)
            init() {
                const extrema = this.extremePoints();
                const extremaWithOffset = this.withOffset(extrema);
                const flipY = (p: number) => this.height() - p;
                // we may change it when we need multiple translation e.g. multiple y-axis
                translatePoint.default = (vec: Vec2) => ({
                    x: scaleChart(vec.x, extrema.xDataMax, extrema.xDataMin, this.width(), 0),
                    y: flipY(scaleChart(vec.y, extrema.yDataMax, extrema.yDataMin, this.height(), 0)),
                    xWithOffset: scaleChart(vec.x, extremaWithOffset.xDataMax, extremaWithOffset.xDataMin, this.width(), 0),
                    yWithOffset: flipY(scaleChart(vec.y, extremaWithOffset.yDataMax, extremaWithOffset.yDataMin, this.height(), 0))
                })
            },
            translate(data: Array<Vec2>) {
                return data.map(translatePoint.default)
            },
            translatePoint(vec: Vec2) {
                return translatePoint.default(vec)
            },
            /*
              x1
                           x3

              x2           x4
             */
            updatePosFilledLine(id: string, data: Array<Vec2>) {
                const withOffsets = this.translate(data).map(d => ({x: d.xWithOffset, y: d.yWithOffset}));
                const first = withOffsets[0];
                const last = withOffsets.slice(-1)[0];

                svg.mutSelectById(id).mutGet().attributes.d = `M ${withOffsets[0].x} ${withOffsets[0].y} ${withOffsets.slice(1).map(s => (`L ${s.x} ${s.y}`))} L ${last.x} ${this.height()} L ${first.x} ${this.height()} Z`
            },
            updatePoi(id: string, pos: Vec2) {
                const poi1 = svg.mutSelectById(id);
                const extrema = this.extremePoints();
                console.log("extrema", extrema, pos)
                const poiPos = findPointAboveLine(pos.x, {x: extrema.xDataMin, y: extrema.yDataMin}, {
                    x: extrema.xDataMax,
                    y: extrema.yDataMax
                })
                const poiPosTranslated = this.translatePoint(poiPos);
                const dim = poi1.dimensions();
                // todo: get radius from poi marker
                const offsetMarkerRadius = 5;
                const newPoint = {x: poiPosTranslated.xWithOffset, y: poiPosTranslated.yWithOffset - dim.height + offsetMarkerRadius};
                console.log(poiPos, pos, newPoint)

                poi1.mutMove(newPoint)
            },
            toString() {
              return this.mutSvg().toString()
            },
            update() {
                opts.graphs.filledLines.forEach(({data, id}) => this.updatePosFilledLine(id, data));
                opts.pointsOfInterest?.forEach(({id, data}) => this.updatePoi(id, data))
            },
        }
        api.init();
        return api
    }
}


function scaleChart(pos: number, posMax: number, posMin: number, chartPosMax: number, chartPosMin: number) {
    return (pos - posMin) / (posMax - posMin) * (chartPosMax - chartPosMin) + chartPosMin
}

export function findPointAboveLine(givenX: number, p1: Vec2, p2: Vec2) {
    // const slope = (p2.y - p1.y) / (p2.x - p1.x);
    const top = p2.y + p1.y
    const slope = top / (p2.x - p1.x);
    const y =slope * givenX ; // Equation of the line
    const invertedYAxisAware = p2.y - y;
    return {x: givenX, y: invertedYAxisAware};
}

