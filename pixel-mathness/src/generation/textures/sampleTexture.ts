import type { Color } from "../../pixelmathness/types/Color";
import type { Shape } from "../types/Shape";
import type { Texture } from "../types/Texture";

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

        for (const band of texture.bands) {

            if (
                distance >= band.minDistance &&
                distance < band.maxDistance
            ) {
                return band.color;
            }
        }

        return texture.baseColor;
    }

    return {
        r: 255,
        g: 0,
        b: 255,
        a: 255
    };
}