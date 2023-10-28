import svgPathBbox from "svg-path-bbox";
import {INode} from "svgson";
import {bboxPath, parsePath} from "./parser";
import * as _ from "lodash";

export interface Dimension {
    width: number;
    height: number;
}

export function dim(bbox: ReturnType<typeof getBoundingBox>): Dimension{
    if(_.isNil(bbox)){
        throw new Error("no bounding box provided")
    }
    return {
        width: bbox.x2 -( bbox?.x1 ?? 0),
        height: bbox.y2 - (bbox?.y1 ?? 0),
    }
}


// Define the bounding box function for various shapes
export function getBoundingBox(shape: INode) {
    switch (shape.name) {
        case 'rect': {
            const x = parseFloat(shape.attributes['x']);
            const y = parseFloat(shape.attributes['y']);
            const width = parseFloat(shape.attributes['width']);
            const height = parseFloat(shape.attributes['height']);
            return {x1: x, y1: y, x2: x + width, y2: y + height};
        }
        case 'circle': {
            const cx = parseFloat(shape.attributes['cx']);
            const cy = parseFloat(shape.attributes['cy']);
            const r = parseFloat(shape.attributes['r']);
            return {x1: cx - r, y1: cy - r, x2: cx + r, y2: cy + r};
        }
        case 'path': {
            // fixme: something is off - using the library we get same values but misplaced - or current approach is misplaced - need to revisit
            // const bbox = svgPathBbox(shape.attributes.d);
            // const n =  {x1: bbox[0],  y1: bbox[2],  x2: bbox[1],  y2: bbox[3]};
            // return {x1: bbox[0], y1: bbox[1], x2: bbox[2],   y2: bbox[3]};
            return bboxPath(shape)
        }
        case 'text': {
            const x = parseFloat(shape.attributes['x']);
            const y = parseFloat(shape.attributes['y']);
            return {x1: undefined, y1: undefined, x2: x, y2: y};
        }
        case 'title': {
            return undefined;
        }
        case 'g': {
            const collectiveBox = {x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity};
            shape.children.forEach(c => {
                const shapeBoundingBox = getBoundingBox(c);
                if(_.isNil(shapeBoundingBox)){
                    return;
                }
                if(!_.isNil(shapeBoundingBox.x1)) {
                    collectiveBox.x1 = Math.min(collectiveBox.x1, shapeBoundingBox.x1);
                }
                if(!_.isNil(shapeBoundingBox.y1)) {
                    collectiveBox.y1 = Math.min(collectiveBox.y1, shapeBoundingBox.y1);
                }
                collectiveBox.x2 = Math.max(collectiveBox.x2, shapeBoundingBox.x2);
                collectiveBox.y2 = Math.max(collectiveBox.y2, shapeBoundingBox.y2);
            })
            return collectiveBox;
        }
    }
    throw new Error(`parsing bounding box for shape ${shape.name} yet not supported`)
}
