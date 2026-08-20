import type { Shape } from "../types/Shape";

export function createEllipse(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    rotation = 0
): Shape {

    return {
        type: "ellipse",

        centerX,
        centerY,

        width,
        height,

        rotation
    };
}