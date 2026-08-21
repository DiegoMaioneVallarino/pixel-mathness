import type { Color } from "../../pixelmathness/types/Color";
import type { Shape } from "../types/Shape";
import type { Texture } from "../types/Texture";

import {
    sampleTextureField
} from "./sampleTextureField";

import {
    distanceToBoundary
} from "../shapes/distanceToBoundary";

export function sampleTexture(
    texture: Texture,
    shape: Shape,
    x: number,
    y: number
): Color {

    if (texture.type === "solid") {
        return texture.color;
    }

if (texture.type === "inline") {

    const shiftedX =
        x - texture.offsetX;

    const shiftedY =
        y - texture.offsetY;

    const distance =
        distanceToBoundary(
            shape,
            shiftedX,
            shiftedY
        );

    // Si el punto desplazado cae fuera
    // de la forma, usamos la última banda.
    if (distance < 0) {
        return texture.bands[
            texture.bands.length - 1
        ]?.color ?? texture.baseColor;
    }

    // Distancia máxima aproximada
    // desde el borde hasta el centro.
    const maxDistance =
        Math.min(
            shape.width / 2,
            shape.height / 2
        );

    // Convertimos:
    //
    // borde  -> valor grande
    // centro -> 0
    //
    const distanceFromCenter =
        maxDistance - distance;

    let accumulatedWidth = 0;

    for (const band of texture.bands) {

        const start =
            accumulatedWidth;

        const end =
            accumulatedWidth +
            band.width;

        if (
            distanceFromCenter >= start &&
            distanceFromCenter < end
        ) {
            return band.color;
        }

        accumulatedWidth = end;
    }

    // Todo lo que quede después
    // usa el color de la ÚLTIMA banda.
    const lastBand =
        texture.bands[
            texture.bands.length - 1
        ];

    return (
        lastBand?.color ??
        texture.baseColor
    );
}


    return {
        r: 255,
        g: 0,
        b: 255,
        a: 255
    };
}