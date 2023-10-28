import {Svg, Vec2} from "./svg";

export interface ChartOptions {
    axis: { id: { x: string, y: string } },
    graphs: { filledLines: Array<{ data: Array<Vec2>, id: string }> },
    pointsOfInterest?: {}
}

export module SvgChart {
    export async function fromFile(filePath: string, opts: ChartOptions) {
        return of((await Svg.fromFile(filePath)), opts)
    }

    export function of(svg: Svg, opts: ChartOptions) {
        const yAxis = svg.mutSelectById(opts.axis.id.y);
        const xAxis = svg.mutSelectById(opts.axis.id.x);
        const translatePoint = {
            "default": (a: Vec2) => a
        };
        // we need a bucket with all points - so we can scale with alignment
        const graphs = {
            filledLines: opts.graphs.filledLines.flatMap(v => v.data.flatMap(d => ({...d, ref: v.id})))
        };
        return {
            height() {
                return yAxis.length().y
            },
            width() {
                return xAxis.length().x
            },
            mutSvg() {
                return svg
            },
            save(filePath: string) {
                return svg.save(filePath);
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

            translate(data: Array<Vec2>) {
                const {xDataMin, yDataMin, yDataMax, xDataMax} = this.extremePoints();
                const flipY = (p: number) => this.height() - p;
                // we may change it when we need multiple translation e.g. multiple y-axis
                translatePoint.default = (vec: Vec2) => ({
                    x: scaleChart(vec.x, xDataMax, xDataMin, this.width()),
                    y: flipY(scaleChart(vec.y, yDataMax, yDataMin, this.height()))
                })
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
                const pts = this.translate(data);
                const first = pts[0];
                const last = pts.slice(-1)[0];

                svg.mutSelectById(id).mutGet().attributes.d = `M ${pts[0].x} ${pts[0].y} ${pts.slice(1).map(s => (`L ${s.x} ${s.y}`))} L ${last.x} ${this.height()} L ${first.x} ${this.height()} Z`
            },
            updatePosElement(id: string, pos: Vec2) {
                const poi1 = svg.mutSelectById(id)
                poi1.mutMove(this.translatePoint(pos))
            },
            updateFilledLineGraphs() {
                opts.graphs.filledLines.forEach(({data, id}) => this.updatePosFilledLine(id, data))
            },
        }
    }
}

function scaleChart(pos: number, posMax: number, posMin: number, chartPosMax: number) {
    return ((pos) / (posMax)) * chartPosMax
}
