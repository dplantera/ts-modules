import fs from "fs";
import {INode, parse, stringify} from "svgson"
import * as _ from "lodash";

export interface Svg extends ReturnType<typeof Svg.create> {
}

export module Svg {

    export function of(svg: INode): Svg {
        return create(svg)
    }

    export function create(svg: INode) {
        let _dim: Vec2 | undefined = undefined;
        return {
            get() {
                return structuredClone(svg)
            },
            mutGet() {
                return svg
            },
            mutSelectById(id: string) {
                return of(selectById(svg, id))
            },
            length(): Vec2 {
                if (_.isNil(_dim)) {
                    _dim = length(svg)
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


     function length(node: INode) {
        if (node.name === 'path') {
            // M 0 6.221 L 0.308 256.465
            const path = parsePath(node);
            const xOrdinates = path.map(p => p.x);
            const yOrdinates = path.map(p => p.y);
            const minX = Math.min(...xOrdinates);
            const maxX = Math.max(...xOrdinates);
            const minY = Math.min(...yOrdinates);
            const maxY = Math.max(...yOrdinates);
            return {
                x: maxX - minX,
                y: maxY - minY
            }
        }
        throw new Error(`dimension yet not supported for ${JSON.stringify(node)}`)
    }
}


export interface Vec2 {
    x: number;
    y: number
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

function move(node: INode, pos: Vec2) {
    const n = positionalNode(node);
    n.move(pos);
}


function parsePos(node: INode): Vec2 {
    if (node.attributes.x && node.attributes.y) {
        return {
            x: Number.parseFloat(node.attributes.x),
            y: Number.parseFloat(node.attributes.y),
        };
    }
    if (node.attributes.transform) {
        if (node.attributes.transform.startsWith("matrix(")) {
            return parsePosFromMatrix(node)
        }
    }
    throw new Error(`could not parse 'pos' for node ${JSON.stringify(node)}`)
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

function parsePath(node: INode) {
    const values = parseFloats(node.attributes.d) ?? [];
    const chunks = []
    if (values.length < 2) {
        throw new Error(`expected at least one coordinate in path ${JSON.stringify(node)}`)
    }
    for (let i = 0; i < values.length - 1; i++) {
        chunks.push({x: values[i], y: values[i + 1]})
    }
    return chunks;
}

function parseFloats(text: string) {
    const reg = new RegExp("[0-9]{1,}\\.?[0-9]*", "gm")
    return text.match(reg)?.map(m => Number.parseFloat(m));
}

function parseMatrixParams(node: INode): number[] {
    const matrixParams = parseFloats(node.attributes.transform);
    if ((matrixParams?.length) !== 6) {
        throw new Error(`expected matrixParams to be of length 6 ${matrixParams} ${node.attributes.transform}`)
    }
    return matrixParams
}

function parsePosFromMatrix(node: INode): Vec2 {
    const matrixParams = parseMatrixParams(node);
    return {x: matrixParams?.[4], y: matrixParams?.[5]}
}
