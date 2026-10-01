import type {
    Point2D
} from "./types";


export function sampleCubicBezier(
    start: Point2D,
    controlA: Point2D,
    controlB: Point2D,
    end: Point2D,
    samples = 32
): Point2D[] {

    const result: Point2D[] = [];


    for (
        let i = 0;
        i <= samples;
        i++
    ) {

        const t =
            i / samples;

        const inverse =
            1 - t;


        const x =
            inverse ** 3 *
            start.x
            +
            3 *
            inverse ** 2 *
            t *
            controlA.x
            +
            3 *
            inverse *
            t ** 2 *
            controlB.x
            +
            t ** 3 *
            end.x;


        const y =
            inverse ** 3 *
            start.y
            +
            3 *
            inverse ** 2 *
            t *
            controlA.y
            +
            3 *
            inverse *
            t ** 2 *
            controlB.y
            +
            t ** 3 *
            end.y;


        result.push({
            x,
            y
        });
    }


    return result;
}