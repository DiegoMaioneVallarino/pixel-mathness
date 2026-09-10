import type {
    Point2D
} from "./types";


export function mirrorPointAcrossLine(
    point: Point2D,
    lineStart: Point2D,
    lineEnd: Point2D
): Point2D {

    const dx =
        lineEnd.x -
        lineStart.x;

    const dy =
        lineEnd.y -
        lineStart.y;


    const lengthSquared =
        dx * dx +
        dy * dy;


    if (lengthSquared === 0) {
        return {
            ...point
        };
    }


    const t =
        (
            (
                point.x -
                lineStart.x
            ) *
            dx
            +
            (
                point.y -
                lineStart.y
            ) *
            dy
        )
        /
        lengthSquared;


    const projectionX =
        lineStart.x +
        t * dx;

    const projectionY =
        lineStart.y +
        t * dy;


    return {
        x:
            2 * projectionX -
            point.x,

        y:
            2 * projectionY -
            point.y
    };
}