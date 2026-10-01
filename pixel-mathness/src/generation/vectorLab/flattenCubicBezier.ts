import type {
    Point2D
} from "./types";


function distancePointToLine(
    point: Point2D,
    start: Point2D,
    end: Point2D
): number {

    const dx =
        end.x - start.x;

    const dy =
        end.y - start.y;


    const lengthSquared =
        dx * dx +
        dy * dy;


    if (
        lengthSquared === 0
    ) {

        const px =
            point.x - start.x;

        const py =
            point.y - start.y;


        return Math.sqrt(
            px * px +
            py * py
        );
    }


    const t =
        (
            (
                point.x - start.x
            )
            *
            dx
            +
            (
                point.y - start.y
            )
            *
            dy
        )
        /
        lengthSquared;


    const projectedX =
        start.x +
        t * dx;

    const projectedY =
        start.y +
        t * dy;


    const px =
        point.x -
        projectedX;

    const py =
        point.y -
        projectedY;


    return Math.sqrt(
        px * px +
        py * py
    );
}


function midpoint(
    a: Point2D,
    b: Point2D
): Point2D {

    return {
        x:
            (
                a.x +
                b.x
            )
            /
            2,

        y:
            (
                a.y +
                b.y
            )
            /
            2
    };
}


function subdivide(
    p0: Point2D,
    p1: Point2D,
    p2: Point2D,
    p3: Point2D,
    tolerance: number,
    depth: number,
    output: Point2D[]
) {

    /*
        Qué tan lejos están los controles
        de la recta entre los extremos.

        Si están suficientemente cerca,
        este trozo de Bézier ya parece
        prácticamente una línea.
    */

    const flatness =
        Math.max(
            distancePointToLine(
                p1,
                p0,
                p3
            ),

            distancePointToLine(
                p2,
                p0,
                p3
            )
        );


    if (
        flatness <= tolerance ||
        depth >= 14
    ) {

        output.push(
            p3
        );

        return;
    }


    /*
        De Casteljau en t = 0.5
    */

    const p01 =
        midpoint(
            p0,
            p1
        );

    const p12 =
        midpoint(
            p1,
            p2
        );

    const p23 =
        midpoint(
            p2,
            p3
        );


    const p012 =
        midpoint(
            p01,
            p12
        );

    const p123 =
        midpoint(
            p12,
            p23
        );


    const center =
        midpoint(
            p012,
            p123
        );


    subdivide(
        p0,
        p01,
        p012,
        center,
        tolerance,
        depth + 1,
        output
    );


    subdivide(
        center,
        p123,
        p23,
        p3,
        tolerance,
        depth + 1,
        output
    );
}


export function flattenCubicBezier(
    p0: Point2D,
    p1: Point2D,
    p2: Point2D,
    p3: Point2D,
    tolerance = 0.35
): Point2D[] {

    const output: Point2D[] = [
        p0
    ];


    subdivide(
        p0,
        p1,
        p2,
        p3,
        tolerance,
        0,
        output
    );


    return output;
}