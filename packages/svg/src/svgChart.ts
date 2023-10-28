import {Svg, Vec2} from "./svg";
import {INode} from "svgson";

export interface ChartOptions {
    axis: { id: { x: string, y: string } }
}

export module SvgChart {
    export async function fromFile(filePath: string, opts: ChartOptions) {
        return of((await Svg.fromFile(filePath)), opts)
    }

    export function of(svg: Svg, opts: ChartOptions) {
        const yAxis = svg.mutSelectById(opts.axis.id.y);
        const xAxis = svg.mutSelectById(opts.axis.id.x);
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
            translate(data: Array<Vec2>) {
                const xData = data.map(d => d.x);
                const yData = data.map(d => d.y);
                const xDataMin = Math.min(...xData);
                const xDataMax = Math.max(...xData);
                const yDataMin = Math.min(...yData);
                const yDataMax = Math.max(...yData);

                const flipY = (p: number) => this.height() - p;
                return data.map(d => ({
                    x: scaleChart(d.x, xDataMax, xDataMin, this.width()),
                    y: flipY(scaleChart(d.y, yDataMax, yDataMin, this.height()))
                }))
            },
            /*
              x1
                           x3

              x2           x4
             */
            updateFilledLine(id: string, data: Array<Vec2>) {
                const pts = this.translate(data);
                const last = pts.slice(-1)[0];
                const g1Tilgung = svg.mutSelectById(id);
                const g2 = g1Tilgung.mutGet();
                g2.attributes.d = `M ${pts[0].x} ${pts[0].y} ${pts.slice(1).map(s => (`L ${s.x} ${s.y}`))} L ${last.x} ${this.height()} L ${0} ${this.height()} Z`

            }
        }
    }
}

function scaleChart(pos: number, posMax: number, posMin: number, chartPosMax: number) {
    return ((pos) / (posMax)) * chartPosMax
}
