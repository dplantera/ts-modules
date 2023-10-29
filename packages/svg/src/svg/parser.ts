import {Vec2} from "../svg";
import {INode} from "svgson";
import * as _ from "lodash";

export function parsePos(node: INode): Vec2 {
    if (node.attributes.x && node.attributes.y) {
        return {
            x: Number.parseFloat(node.attributes.x),
            y: Number.parseFloat(node.attributes.y),
        };
    }
    if (node.attributes.transform) {
        if (node.attributes.transform.includes("matrix(")) {
            return parsePosFromMatrix(node)
        }
    }
    throw new Error(`could not parse 'pos' for node ${JSON.stringify(node)}`)
}

export interface TransformObj extends Record<'matrix' | 'scale' | string, string> {

}
export function parseTransform(node:INode): TransformObj {
    // const funcNames = /(?<func>(\w+(?=\()))/g;
    // const params =/(?<params>[0-9,.]+)/g
    const com = /(?<func>\w+(?=\((?<params>[0-9,.]+)))/g
    const transform = node.attributes.transform;
    const parsedTransform: TransformObj = {};
    const match3 = transform.matchAll(com)
    for(const m of match3){
        const func = m.groups?.["func"];
        const params = m.groups?.["params"];
        if(_.isNil(func) || _.isNil(params)){
           throw new Error(`failed parsing transfrom ${transform}`)
        }
        parsedTransform[func] = params
    }
    return parsedTransform;
}
export function parseScale(node:INode){
    const transform = parseTransform(node);
    const params = parseFloats(transform.scale);
    if(_.isNil(params)){
        return 1;
    }
    if(params.length > 1){
        return {x: params[0], y: params[1]}
    }
    return params[0]
}

export function parseStyle(style: string): Record<"font-weight" | "font-size" | "font-family" | string, string> {
    // fill: rgb(51, 51, 51); font-family: Arial, sans-serif; font-weight: 700; white-space: pre; font-size: 15px;
    return style.split(";").reduce((acc, curr) => {
        const [key, value] = curr.split(":")
        if(_.isNil(key) || _.isNil(value) || key === "" || value === ""){
            return acc;
        }
        return {...acc, [key.trim()]: value.trim()}
    }, {});
}

export function parseUnit(str: string): { unit: 'px' | string, value: number } {
    const value = parseFloats(str)?.[0];
    const unit = str.match(/\w+/)?.[0]
    if (_.isNil(value) || _.isNil(unit)) {
        throw new Error(`could not parse unit ${str}`)
    }
    return {unit, value}
}

export function bboxPath(node: INode) {
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
    const transform = parseTransform(node);
    const matrixParams = parseFloats(transform.matrix);
    if ((matrixParams?.length) !== 6) {
        throw new Error(`expected matrixParams to be of length 6 ${matrixParams} ${node.attributes.transform}`)
    }
    return matrixParams
}

function parsePosFromMatrix(node: INode): Vec2 {
    const matrixParams = parseMatrixParams(node);
    return {x: matrixParams?.[4], y: matrixParams?.[5]}
}
