import type {
    Point2D
} from "./types";

import {
    rasterizeLineBresenham
} from "./rasterizeLineBresenham";


export function rasterizeVariableThickPath(
    path: Point2D[],
    startThickness: number,
    endThickness: number
): Point2D[] {

    if (
        path.length === 0
    ) {
        return [];
    }


    /*
        Primero construimos una centerline
        digital completamente continua.
    */

    const centerLine: Point2D[] = [];


    if (
        path.length === 1
    ) {

        centerLine.push({
            x:
                Math.round(
                    path[0].x
                ),

            y:
                Math.round(
                    path[0].y
                )
        });

    } else {

        for (
            let i = 0;
            i < path.length - 1;
            i++
        ) {

            const segment =
                rasterizeLineBresenham(
                    path[i],
                    path[i + 1]
                );


            if (
                centerLine.length > 0
            ) {
                segment.shift();
            }


            centerLine.push(
                ...segment
            );
        }
    }


    if (
        centerLine.length === 0
    ) {
        return [];
    }


    const result =
        new Map<string, Point2D>();


    const lastIndex =
        Math.max(
            1,
            centerLine.length - 1
        );


    for (
        let i = 0;
        i < centerLine.length;
        i++
    ) {

        const point =
            centerLine[i];


        /*
            t = 0 al comienzo
            t = 1 al final
        */

        const t =
            i /
            lastIndex;


        /*
            Interpolación lineal:

            w(t) =
            (1 - t) start +
            t end
        */

        const thickness =
            (
                1 - t
            )
            *
            startThickness
            +
            t
            *
            endThickness;


        /*
            thickness 1 => radius 0
            thickness 5 => radius 2
        */

        const radius =
            Math.max(
                0,
                (
                    thickness -
                    1
                )
                /
                2
            );


        const searchRadius =
            Math.ceil(
                radius
            );


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