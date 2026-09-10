import type {
    Point2D
} from "./types";

import {
    cleanDigitalPath
} from "./cleanDigitalPath";

export function rasterizeLineBresenham(
    start: Point2D,
    end: Point2D
): Point2D[] {

    const points: Point2D[] = [];


    let x0 =
        Math.round(start.x);

    let y0 =
        Math.round(start.y);

    const x1 =
        Math.round(end.x);

    const y1 =
        Math.round(end.y);


    const dx =
        Math.abs(
            x1 - x0
        );

    const sx =
        x0 < x1
            ? 1
            : -1;


    const dy =
        -Math.abs(
            y1 - y0
        );

    const sy =
        y0 < y1
            ? 1
            : -1;


    let error =
        dx + dy;


    while (true) {

        points.push({
            x: x0,
            y: y0
        });


        if (
            x0 === x1 &&
            y0 === y1
        ) {
            break;
        }


        const error2 =
            2 * error;


        if (error2 >= dy) {

            error += dy;

            x0 += sx;
        }


        if (error2 <= dx) {

            error += dx;

            y0 += sy;
        }
    }


    return cleanDigitalPath(
    points,
    false
);
}