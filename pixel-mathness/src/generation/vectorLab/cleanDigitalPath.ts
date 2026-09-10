import type {
    Point2D
} from "./types";


function samePoint(
    a: Point2D,
    b: Point2D
): boolean {

    return (
        a.x === b.x &&
        a.y === b.y
    );
}


function areEightNeighbors(
    a: Point2D,
    b: Point2D
): boolean {

    const dx =
        Math.abs(
            a.x - b.x
        );

    const dy =
        Math.abs(
            a.y - b.y
        );


    return (
        dx <= 1 &&
        dy <= 1 &&
        (
            dx !== 0 ||
            dy !== 0
        )
    );
}


function removeConsecutiveDuplicates(
    input: Point2D[]
): Point2D[] {

    const result: Point2D[] = [];


    for (const point of input) {

        const previous =
            result[
                result.length - 1
            ];


        if (
            previous &&
            samePoint(
                previous,
                point
            )
        ) {
            continue;
        }


        result.push(
            point
        );
    }


    return result;
}


export function cleanDigitalPath(
    input: Point2D[],
    closed = false
): Point2D[] {

    const points =
        removeConsecutiveDuplicates(
            input
        );


    if (points.length <= 2) {
        return points;
    }


    let changed =
        true;


    while (changed) {

        changed =
            false;


        const startIndex =
            closed
                ? 0
                : 1;

        const endIndex =
            closed
                ? points.length
                : points.length - 1;


        for (
            let i = startIndex;
            i < endIndex;
            i++
        ) {

            const previousIndex =
                (
                    i -
                    1 +
                    points.length
                )
                %
                points.length;

            const nextIndex =
                (
                    i +
                    1
                )
                %
                points.length;


            const previous =
                points[
                    previousIndex
                ];

            const next =
                points[
                    nextIndex
                ];


            /*
                SOLO quitamos este pixel
                si sus dos vecinos pueden
                conectarse directamente.
            */

            if (
                areEightNeighbors(
                    previous,
                    next
                )
            ) {

                const minimumSize =
                    closed
                        ? 3
                        : 2;


                if (
                    points.length - 1 <
                    minimumSize
                ) {
                    break;
                }


                /*
                    IMPORTANTÍSIMO:

                    eliminamos UN SOLO pixel.
                */

                points.splice(
                    i,
                    1
                );


                changed =
                    true;


                /*
                    Reiniciamos todo el análisis.

                    No dejamos que otro pixel
                    sea eliminado usando la
                    geometría anterior.
                */

                break;
            }
        }
    }


    return points;
}