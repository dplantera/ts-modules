import fs from "fs";
import {INode, parse, parseSync, stringify} from "svgson"
import * as _ from "lodash";
import {dim, Dimension, getBoundingBox} from "./svg/bbox";
import {parseMatrixParams, parsePos} from "./svg/parser";

export interface Svg extends ReturnType<typeof Svg.create> {
}

export module SvgPath {
    export interface Line {
        cmd: 'M' | 'L';
        point: Vec2
    }

    export interface ClosePath {
        cmd: 'Z'
    }

    type Segment = Line | ClosePath

    export function make() {
        const _path: Array<Segment> = []
        return {
            moveTo(vec: Vec2) {
                _path.push({cmd: 'M', point: vec});
                return this;
            },
            lineTo(...vec: Array<Vec2>) {
                vec.forEach(v => {
                    _path.push({cmd: 'L', point: v});
                });
                return this;
            },
            close() {
                if(_path.slice(-1)[0].cmd === 'Z'){
                    throw new Error("path already closed")
                }
                _path.push({cmd: 'Z'});
                return this;
            },
            /** fill the space below or above a line by creating and connecting a parallel path */
            fillLine(opts: { fillUpHeight: number }) {
                const first = _path[0];
                const last = _path.slice(-1)[0];
                if (first.cmd === 'Z' || last.cmd === 'Z') {
                    throw new Error("path closed")
                }
                return this.lineTo({x: last.point.x, y: opts.fillUpHeight})
                    .lineTo({x: first.point.x, y: opts.fillUpHeight})
                    .close()
            },
            toString() {
                return _path.map((p, index) => {
                    switch (p.cmd){
                        case "Z":
                            return `${p.cmd}`
                        case "M":
                        case "L": {
                            return `${p.cmd} ${p.point.x} ${p.point.y}`
                        }
                    }
                }).join(" ")
            }
        }
    }
}
export module Svg {

    export function of(svg: INode): Svg {
        return create(svg)
    }

    export function create(svg: INode) {
        return {
            get() {
                return _.cloneDeep(svg)
            },
            mutGet() {
                return svg
            },
            mutSelectById(id: string) {
                return of(selectById(svg, id))
            },
            bbox() {
                return getBoundingBox(svg);
            },
            dimensions(): Dimension {
                return dim(this.bbox());
            },
            mutMove(pos: Vec2) {
                move(svg, pos)
                return svg;
            },
            toFilledLine(path: Array<Vec2>, opts: { fillUpHeight: number }) {
                const [first, ...rest] = path
                const svgPath = SvgPath.make()
                    .moveTo(first)
                    .lineTo(...rest)
                    .fillLine(opts)
                this.mutGet().attributes.d = svgPath.toString();
            },
            async save(filePath: string) {
                const svgStr = this.toString();
                await fs.promises.writeFile(filePath, svgStr, "utf-8");
                return svgStr;
            },
            toString() {
                return stringify(svg);
            }
        }
    }

    export async function fromFile(filePath: string) {
        const svgStr = await fs.promises.readFile(filePath, "utf-8");
        return fromStr(svgStr);
    }

    export async function fromStr(svgStr: string) {
        return of((await parse(svgStr)))
    }

    export function fromStrSync(svgStr: string) {
        return of((parseSync(svgStr)))
    }

    export function selectById(node: INode, id: string): INode {
        const n = selectByIdRec(node, id)
        if (!n) {
            throw new Error(`could not finde node with id ${id}`);
        }
        return n;
    }

    function selectByIdRec(node: INode, id: string): INode | undefined {
        if (node.attributes.id === id) {
            return node;
        }
        for (const c of node.children) {
            const found = selectByIdRec(c, id);
            if (found) {
                return found;
            }
        }
        return undefined;
    }
}


export interface Vec2 {
    x: number;
    y: number
}

function move(node: INode, pos: Vec2) {
    const n = positionalNode(node);
    n.move(pos);
}

function positionalNode(node: INode) {
    const nodePos = parsePos(node);
    return {
        move(pos: Vec2) {
            setPos(node, pos);
            console.log(`moving to ${JSON.stringify(pos)} ${JSON.stringify(nodePos)}`)
        }
    }
}

function setPos(node: INode, pos: Vec2) {
    if (node.attributes.x && node.attributes.y) {
        node.attributes.x = `${pos.x}`;
        node.attributes.y = `${pos.y}`;
        return;
    }
    if (node.attributes.transform) {
        if (node.attributes.transform.startsWith("matrix(")) {
            const matrixParams = parseMatrixParams(node);
            matrixParams[4] = pos.x;
            matrixParams[5] = pos.y;
            node.attributes.transform = `matrix(${matrixParams.join(",")})`;
            return;
        }
    }
    throw new Error(`could not parse 'pos' for node ${JSON.stringify(node)}`)
}

