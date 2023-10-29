import fs from "fs";
import {INode, parse, parseSync, stringify} from "svgson"
import * as _ from "lodash";
import {dim, Dimension, getBoundingBox} from "./svg/bbox";
import {parseMatrixParams, parsePos, parseScale, parseTransform, TransformObj} from "./svg/parser";

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
            transform(transform?:TransformObj){
                const parsed = parseTransform(svg);
                if(_.isNil(transform)){
                    return parsed;
                }
                const merged = _.merge(parsed, transform);
                svg.attributes.transform = Object.entries(merged).map(([k, v]) => `${k}(${v})`).join(" ")
                return parseTransform(svg);
            },
            scale(factor?: number){
                  if(_.isNil(factor)){
                      return parseScale(svg)
                  }
                 this.transform({scale: `${factor}`});
                 const n = positionalNode(this);
                 const pos = n.getPos();
                 const correction = (1 - factor) * 10 * 8;
                 pos.y += correction;
                 n.setPos(pos);
                 return factor;
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
            setPos(pos: Vec2) {
                const n = positionalNode(this);
                n.setPos(pos);
                return svg;
            },
            /** fill the space below or above a line by creating and connecting a parallel path */
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
        const n = selectByRec(node, {where: (n) => n.attributes.id === id})
        if (!n) {
            throw new Error(`could not finde node with id ${id}`);
        }
        return n;
    }

    export function selectByType(node: INode, type: string, op?: {where: (n: INode) => boolean;}): INode | undefined{
        return selectByRec(node, {where: (n) => n.type === type && (op?.where(n) ?? true)});
    }
    export function selectBy(node: INode, op: {where: (n: INode) => boolean; skip?: (n: INode) => boolean}): INode | undefined{
        return selectByRec(node, op);
    }

    function selectByRec(node: INode, op: {where: (n: INode) => boolean, skip?: (n: INode) => boolean}): INode | undefined {
        if(op.skip?.(node) ?? false) {
            return undefined;
        }
        if (op.where(node) ) {
            return node;
        }
        for (const c of node.children) {
            const found = selectByRec(c,  op);
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

function positionalNode(node: Svg) {
    const nodePos = parsePos(node.mutGet());
    return {
        getPos(){return nodePos},
        setPos(pos: Vec2) {
            setPos(node, pos);
            console.log(`moving to ${JSON.stringify(pos)} from ${JSON.stringify(nodePos)}`)
        }
    }
}

function setPos(svg: Svg, pos: Vec2) {
    const node = svg.mutGet();
    if (node.attributes.x && node.attributes.y) {
        node.attributes.x = `${pos.x}`;
        node.attributes.y = `${pos.y}`;
        return;
    }
    if (node.attributes.transform) {
        if (node.attributes.transform.includes("matrix(")) {
            const matrixParams = parseMatrixParams(node);
            matrixParams[4] = pos.x;
            matrixParams[5] = pos.y;
            svg.transform({matrix: matrixParams.join(",") })
            return;
        }
    }
    throw new Error(`could not parse 'pos' for node ${JSON.stringify(node)}`)
}

