import type {
    PixelMatrix
} from "../../pixelmathness/types/PixelMatrix";

import type {
    Cuboid,
    Point2D,
    Point3D
} from "./types";

import {
    projectIsometric
} from "./projectIsometric";


function createMatrix(
    width: number,
    height: number
): PixelMatrix {

    return Array.from(
        { length: height },
        () =>
            Array.from(
                { length: width },
                () => ({
                    r: 255,
                    g: 255,
                    b: 255,
                    a: 255
                })
            )
    );
}

function pointInsidePolygon(
    x: number,
    y: number,
    polygon: Point2D[]
): boolean {

    let inside = false;

    for (
        let i = 0,
        j = polygon.length - 1;

        i < polygon.length;

        j = i++
    ) {

        const xi = polygon[i].x;
        const yi = polygon[i].y;

        const xj = polygon[j].x;
        const yj = polygon[j].y;


        const intersects =
            (
                yi > y
            ) !== (
                yj > y
            ) &&
            x <
                (
                    (xj - xi) *
                    (y - yi)
                ) /
                    (yj - yi) +
                xi;


        if (intersects) {
            inside = !inside;
        }
    }

    return inside;
}

function fillPolygon(
    matrix: PixelMatrix,
    polygon: Point2D[],
    color: {
        r: number;
        g: number;
        b: number;
        a: number;
    }
) {

const minX =
    Math.floor(
        Math.min(
            ...polygon.map(p => p.x)
        )
    ) - 1;

const maxX =
    Math.ceil(
        Math.max(
            ...polygon.map(p => p.x)
        )
    ) + 1;

const minY =
    Math.floor(
        Math.min(
            ...polygon.map(p => p.y)
        )
    ) - 1;

const maxY =
    Math.ceil(
        Math.max(
            ...polygon.map(p => p.y)
        )
    ) + 1;


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

            if (
                y < 0 ||
                x < 0 ||
                y >= matrix.length ||
                x >= matrix[0].length
            ) {
                continue;
            }


            const samples = [
    [x + 0.5, y + 0.5],

    [x + 0.25, y + 0.25],
    [x + 0.75, y + 0.25],
    [x + 0.25, y + 0.75],
    [x + 0.75, y + 0.75]
];

const inside =
    samples.some(
        ([sampleX, sampleY]) =>
            pointInsidePolygon(
                sampleX,
                sampleY,
                polygon
            )
    );

if (inside) {
    matrix[y][x] = {
        ...color
    };
}
        }
    }
}

function drawLine(
    matrix: PixelMatrix,
    a: Point2D,
    b: Point2D
) {

    let x0 =
        Math.round(a.x);

    let y0 =
        Math.round(a.y);

    const x1 =
        Math.round(b.x);

    const y1 =
        Math.round(b.y);


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

        if (
            y0 >= 0 &&
            x0 >= 0 &&
            y0 < matrix.length &&
            x0 < matrix[0].length
        ) {

            matrix[y0][x0] = {
                r: 0,
                g: 0,
                b: 0,
                a: 255
            };
        }


        if (
            x0 === x1 &&
            y0 === y1
        ) {
            break;
        }


        const e2 =
            2 * error;


        if (e2 >= dy) {

            error += dy;
            x0 += sx;
        }


        if (e2 <= dx) {

            error += dx;
            y0 += sy;
        }
    }
}

function drawPolygonOutline(
    matrix: PixelMatrix,
    polygon: Point2D[]
) {

    for (
        let i = 0;
        i < polygon.length;
        i++
    ) {

        const current =
            polygon[i];

        const next =
            polygon[
                (i + 1) %
                polygon.length
            ];

        drawLine(
            matrix,
            current,
            next
        );
    }
}

export function rasterizeCuboid(
    cuboid: Cuboid,
    canvasWidth = 200,
    canvasHeight = 200
): PixelMatrix {

    const matrix =
        createMatrix(
            canvasWidth,
            canvasHeight
        );


    const {
        x,
        y,
        z,

        width,
        depth,
        height
    } = cuboid;


    const points3D: Point3D[] = [

        // abajo

        {
            x,
            y,
            z
        },

        {
            x: x + width,
            y,
            z
        },

        {
            x: x + width,
            y: y + depth,
            z
        },

        {
            x,
            y: y + depth,
            z
        },


        // arriba

        {
            x,
            y,
            z: z + height
        },

        {
            x: x + width,
            y,
            z: z + height
        },

        {
            x: x + width,
            y: y + depth,
            z: z + height
        },

        {
            x,
            y: y + depth,
            z: z + height
        }
    ];


    const centerX =
        canvasWidth / 2;

    const centerY =
        canvasHeight / 2 + 30;


    const p =
        points3D.map(
            point =>
                projectIsometric(
                    point,
                    centerX,
                    centerY
                )
        );


    // índices:
    //
    // bottom:
    // 0 1 2 3
    //
    // top:
    // 4 5 6 7


    const top = [
        p[4],
        p[5],
        p[6],
        p[7]
    ];


    const left = [
        p[7],
        p[6],
        p[2],
        p[3]
    ];


    const right = [
        p[5],
        p[6],
        p[2],
        p[1]
    ];


    // Caras oscuras primero.
    fillPolygon(
        matrix,
        left,
        {
            r: 85,
            g: 65,
            b: 125,
            a: 255
        }
    );


    fillPolygon(
        matrix,
        right,
        {
            r: 55,
            g: 45,
            b: 95,
            a: 255
        }
    );


    // Cara superior más iluminada.
    fillPolygon(
        matrix,
        top,
        {
            r: 135,
            g: 85,
            b: 165,
            a: 255
        }
    );


    drawPolygonOutline(
        matrix,
        left
    );

    drawPolygonOutline(
        matrix,
        right
    );

    drawPolygonOutline(
        matrix,
        top
    );


    return matrix;
}