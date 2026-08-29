import type {
    PrimaryObject,
    CuboidRasterStructure
} from "./types";

import {
    drawCuboidWireframe
} from "./rasterizeCuboidWireframe";


export function rasterizeCuboidObject(
    objects: PrimaryObject[],
    canvasWidth = 200,
    canvasHeight = 200
): CuboidRasterStructure {

    const structure:
        CuboidRasterStructure = {

        width: canvasWidth,
        height: canvasHeight,
        commands: []
    };


  for (const object of objects) {

    drawCuboidWireframe(
        structure,
        object.cuboid,
        object.id
    );
}


    return structure;
}