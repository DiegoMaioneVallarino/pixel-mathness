import type {
    PixelMatrix
} from "../../pixelmathness/types/PixelMatrix";

import type {
    PrimaryObject
} from "./types";

import {
    drawCuboidWireframe
} from "./rasterizeCuboidWireframe";

import type {
    CuboidPalette
} from "./cuboidPalette";

import {
    defaultCuboidPalette
} from "./cuboidPalette";



function createBlankMatrix(
    width: number,
    height: number
): PixelMatrix {

    return Array.from(
        { length: height },
        () =>
            Array.from(
                { length: width },
                () => ({
                    r: 255,
                    g: 255,
                    b: 255,
                    a: 255
                })
            )
    );
}


export function rasterizeCuboidObject(
    objects: PrimaryObject[],
    canvasWidth = 200,
    canvasHeight = 200,
    surfaceAlpha = 1,
    interiorDiagonalAlpha = 0.45,
    interiorVerticalAlpha = 0.25,
    palette: CuboidPalette =
        defaultCuboidPalette
): PixelMatrix {

    const matrix =
        createBlankMatrix(
            canvasWidth,
            canvasHeight
        );


    for (
        const object
        of objects
    ) {

        drawCuboidWireframe(
    matrix,
    object.cuboid,
    surfaceAlpha,
    interiorDiagonalAlpha,
    interiorVerticalAlpha,
    palette
);
    }


    return matrix;
}