import type {
    Point2D
} from "./types";

import {
    rasterizeLineBresenham
} from "./rasterizeLineBresenham";


export function rasterizeThickPath(
    path: Point2D[],
    thickness: number
): Point2D[] {

    if (path.length === 0) {
        return [];
    }


    /*
        1. Primero construimos una centerline
        CONTINUA.

        Esto es importante porque los samples
        de una Bézier pueden quedar separados
        cuando la shape se escala.
    */

    const centerLineMap =
        new Map<string, Point2D>();


    if (path.length === 1) {

        const point =
            path[0];

        centerLineMap.set(
            `${Math.round(point.x)}:${Math.round(point.y)}`,
            {
                x:
                    Math.round(point.x),

                y:
                    Math.round(point.y)
            }
        );

    } else {

        for (
            let i = 0;
            i < path.length - 1;
            i++
        ) {

            const current =
                path[i];

            const next =
                path[i + 1];


            const segment =
                rasterizeLineBresenham(
                    current,
                    next
                );


            for (
                const point
                of segment
            ) {

                const x =
                    Math.round(
                        point.x
                    );

                const y =
                    Math.round(
                        point.y
                    );


                centerLineMap.set(
                    `${x}:${y}`,
                    {
                        x,
                        y
                    }
                );
            }
        }
    }


    const centerLine =
        Array.from(
            centerLineMap.values()
        );


    /*
        Thickness = 1 significa:

        únicamente la centerline.

        Esto es muy importante para pixel art:
        no queremos dilatar una línea de 1 px.
    */

    if (thickness <= 1) {

        return centerLine;
    }


    /*
        2. Dilatamos la centerline.

        Usamos un radio continuo alrededor
        de cada pixel de la línea.
    */

    const result =
        new Map<string, Point2D>();


    const radius =
        (
            thickness -
            1
        )
        /
        2;


    const searchRadius =
        Math.ceil(
            radius
        );


    for (
        const point
        of centerLine
    ) {

        for (
            let dy =
                -searchRadius;
            dy <=
                searchRadius;
            dy++
        ) {

            for (
                let dx =
                    -searchRadius;
                dx <=
                    searchRadius;
                dx++
            ) {

                const distance =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );


                if (
                    distance >
                    radius +
                    0.35
                ) {
                    continue;
                }


                const x =
                    point.x +
                    dx;

                const y =
                    point.y +
                    dy;


                result.set(
                    `${x}:${y}`,
                    {
                        x,
                        y
                    }
                );
            }
        }
    }


    return Array.from(
        result.values()
    );
}