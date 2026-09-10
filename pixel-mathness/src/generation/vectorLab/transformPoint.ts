import type {
    Point2D
} from "./types";


export function transformPoint(
    point: Point2D,
    pivot: Point2D,
    scale: number,
    rotationDegrees: number
): Point2D {

    const angle =
        rotationDegrees *
        Math.PI /
        180;


    const localX =
        (
            point.x -
            pivot.x
        ) *
        scale;

    const localY =
        (
            point.y -
            pivot.y
        ) *
        scale;


    const rotatedX =
        localX *
        Math.cos(angle)
        -
        localY *
        Math.sin(angle);

    const rotatedY =
        localX *
        Math.sin(angle)
        +
        localY *
        Math.cos(angle);


    return {
        x:
            pivot.x +
            rotatedX,

        y:
            pivot.y +
            rotatedY
    };
}