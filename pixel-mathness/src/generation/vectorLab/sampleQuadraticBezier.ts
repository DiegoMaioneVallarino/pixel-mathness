import type {
    Point2D
} from "./types";

export function sampleQuadraticBezier(
    start: Point2D,
    control: Point2D,
    end: Point2D,
    steps = 64
): Point2D[] {

    const unique =
        new Set<string>();

    const points: Point2D[] = [];

    for (
        let i = 0;
        i <= steps;
        i++
    ) {

        const t =
            i / steps;

        const oneMinusT =
            1 - t;

        const x =
            oneMinusT * oneMinusT * start.x
            +
            2 * oneMinusT * t * control.x
            +
            t * t * end.x;

        const y =
            oneMinusT * oneMinusT * start.y
            +
            2 * oneMinusT * t * control.y
            +
            t * t * end.y;

        const point = {
            x: Math.round(x),
            y: Math.round(y)
        };

        const key =
            `${point.x},${point.y}`;

        if (!unique.has(key)) {
            unique.add(key);
            points.push(point);
        }
    }

    return points;
}