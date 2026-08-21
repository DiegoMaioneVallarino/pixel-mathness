import type { Color } from "../../pixelmathness/types/Color";
import type { Texture } from "../types/Texture";

export function inlineTexture(
    baseColor: Color,
    offsetX: number,
    offsetY: number,
    bands: {
        width: number;
        color: Color;
    }[]
): Texture {

    return {
        type: "inline",
        baseColor,
        offsetX,
        offsetY,
        bands
    };
}