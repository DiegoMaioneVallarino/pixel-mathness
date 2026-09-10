import type {
    Point2D
} from "./types";


export function fillPolygon(
    polygon: Point2D[]
): Point2D[] {

    if (polygon.length < 3) {
        return [];
    }


    const minX =
        Math.floor(
            Math.min(
                ...polygon.map(
                    point => point.x
                )
            )
        );

    const maxX =
        Math.ceil(
            Math.max(
                ...polygon.map(
                    point => point.x
                )
            )
        );

    const minY =
        Math.floor(
            Math.min(
                ...polygon.map(
                    point => point.y
                )
            )
        );

    const maxY =
        Math.ceil(
            Math.max(
                ...polygon.map(
                    point => point.y
                )
            )
        );


    const pixels: Point2D[] = [];


    for (
        let y = minY;
        y <= maxY;
        y++
    ) {

        for (
            let x = minX;
            x <= maxX;
            x++
        ) {

            /*
                IMPORTANTÍSIMO:

                Nuestros Point2D representan
                PIXELES de la cuadrícula.

                Por eso comprobamos exactamente
                (x, y), no (x + 0.5, y + 0.5).
            */

            const sampleX =
                x;

            const sampleY =
                y;


            let inside =
                false;


            for (
                let i = 0,
                    j = polygon.length - 1;
                i < polygon.length;
                j = i++
            ) {

                const a =
                    polygon[i];

                const b =
                    polygon[j];


                const crossesY =
                    (
                        a.y > sampleY
                    )
                    !==
                    (
                        b.y > sampleY
                    );


                if (!crossesY) {
                    continue;
                }


                const intersectionX =
                    (
                        (
                            b.x -
                            a.x
                        )
                        *
                        (
                            sampleY -
                            a.y
                        )
                        /
                        (
                            b.y -
                            a.y
                        )
                    )
                    +
                    a.x;


                if (
                    sampleX <
                    intersectionX
                ) {

                    inside =
                        !inside;
                }
            }


            if (inside) {

                pixels.push({
                    x,
                    y
                });
            }
        }
    }


    return pixels;
}