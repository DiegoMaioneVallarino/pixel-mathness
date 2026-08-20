import type { PixelMatrix } from "../../pixelmathness/types/PixelMatrix";
import type { Shape } from "../types/Shape";
import type { Texture } from "../types/Texture";
import type { Color } from "../../pixelmathness/types/Color";

import {
    containsPoint
} from "../shapes/containsPoint";

import {
    sampleTexture
} from "../textures/sampleTexture";


const NEIGHBORS_8 = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
] as const;


function isBoundaryPixel(
    shape: Shape,
    x: number,
    y: number
): boolean {

    // El centro de este pixel.
    const px = x + 0.5;
    const py = y + 0.5;

    if (!containsPoint(shape, px, py)) {
        return false;
    }

    // Si alguno de los pixels vecinos
    // ya cae fuera de la forma,
    // este pixel pertenece al outline.
    for (const [dx, dy] of NEIGHBORS_8) {

        const nx =
            px + dx;

        const ny =
            py + dy;

        if (
            !containsPoint(
                shape,
                nx,
                ny
            )
        ) {
            return true;
        }
    }

    return false;
}


export function rasterizeShape(
    shape: Shape,
    texture: Texture,
    canvasWidth: number,
    canvasHeight: number,
    outlineColor: Color = {
        r: 0,
        g: 0,
        b: 0,
        a: 255
    }
): PixelMatrix {

    const matrix: PixelMatrix =
        Array.from(
            { length: canvasHeight },
            () =>
                Array.from(
                    { length: canvasWidth },
                    () => ({
                        r: 255,
                        g: 255,
                        b: 255,
                        a: 255
                    })
                )
        );


    for (
        let y = 0;
        y < canvasHeight;
        y++
    ) {

        for (
            let x = 0;
            x < canvasWidth;
            x++
        ) {

            const px =
                x + 0.5;

            const py =
                y + 0.5;


            // Fuera de la forma.
            if (
                !containsPoint(
                    shape,
                    px,
                    py
                )
            ) {
                continue;
            }


            // =========================
            // OUTLINE EXACTAMENTE 1 PX
            // =========================

            if (
                isBoundaryPixel(
                    shape,
                    x,
                    y
                )
            ) {

                matrix[y][x] = {
                    ...outlineColor
                };

                continue;
            }


            // =========================
            // TEXTURA INTERIOR
            // =========================

            matrix[y][x] =
                sampleTexture(
                    texture,
                    shape,
                    px,
                    py
                );
        }
    }


    return matrix;
}