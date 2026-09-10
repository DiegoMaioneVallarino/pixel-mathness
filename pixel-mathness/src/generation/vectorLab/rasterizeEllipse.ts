import type {
    Point2D
} from "./types";


export function rasterizeEllipse(
    center: Point2D,
    radiusX: number,
    radiusY: number
): Point2D[] {

    const points: Point2D[] = [];

    const unique =
        new Set<string>();


    const steps =
        Math.max(
            32,
            Math.ceil(
                Math.PI *
                Math.max(
                    radiusX,
                    radiusY
                ) *
                4
            )
        );


    for (
        let i = 0;
        i < steps;
        i++
    ) {

        const angle =
            (
                i /
                steps
            ) *
            Math.PI *
            2;


        const x =
            Math.round(
                center.x +
                Math.cos(angle) *
                radiusX
            );

        const y =
            Math.round(
                center.y +
                Math.sin(angle) *
                radiusY
            );


        const key =
            `${x},${y}`;


        if (!unique.has(key)) {

            unique.add(key);

            points.push({
                x,
                y
            });
        }
    }


    return points;
}