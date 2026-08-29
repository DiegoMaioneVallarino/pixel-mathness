import type {
    Point2D,
    Point3D
} from "./types";


export function projectIsometric(
    point: Point3D,
    centerX: number,
    centerY: number
): Point2D {

    const screenX =
        centerX +
        point.x -
        point.y;

    const screenY =
        centerY +
        (
            point.x +
            point.y
        ) / 2 -
        point.z;


    return {
        x: screenX,
        y: screenY
    };
}