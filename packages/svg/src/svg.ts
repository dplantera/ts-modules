import fs from "fs";
import {INode, parse, stringify} from "svgson"
import * as _ from "lodash";
import {dim, Dimension, getBoundingBox} from "./svg/bbox";
import {parseMatrixParams, parsePos} from "./svg/parser";

export interface Svg extends ReturnType<typeof Svg.create> {
}

export module Svg {

    export function of(svg: INode): Svg {
        return create(svg)
    }

    export function create(svg: INode) {
        let _dim: Dimension | undefined = undefined;
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
            bbox(){
                return getBoundingBox(svg);
            },
            dimensions(): Dimension {
                if (_.isNil(_dim)) {
                    _dim = dim(this.bbox())
                    // _dim = elLength(svg)
                }
                return _dim;
            },
            mutMove(pos: Vec2) {
                move(svg, pos )
                return svg;
            },
            async save(filePath: string) {
                const svgStr = this.toString();
                await fs.promises.writeFile(filePath, svgStr, "utf-8");
                return svgStr;
            },
            toString(){
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

