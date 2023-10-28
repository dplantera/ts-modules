import {Vec2} from "../svg";
import {INode} from "svgson";
import {Dimension} from "./bbox";

export function parsePos(node: INode): Vec2 {
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

export function bboxPath(node: INode){
    if (node.name === 'path') {
        // M 0 6.221 L 0.308 256.465
        const path = parsePath(node);
        const xOrdinates = path.map(p => p.x);
        const yOrdinates = path.map(p => p.y);
        const minX = Math.min(...xOrdinates);
        const maxX = Math.max(...xOrdinates);
        const minY = Math.min(...yOrdinates);
        const maxY = Math.max(...yOrdinates);
        return {x1: minX, y1: minY, x2: maxX, y2: maxY}
        // return {
        //     width: maxX - minX,
        //     height: maxY - minY
        // }
    }
    throw new Error(`dimension yet not supported for ${JSON.stringify(node)}`)
}

export function parsePath(node: INode) {
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

export function parseMatrixParams(node: INode): number[] {
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
