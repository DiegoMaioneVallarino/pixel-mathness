import type { ColorLayer } from "../analysis/separateColorLayers";

export type StrokePoint = {
    x: number;
    y: number;
};

export type StrokeFace = {
    id: number;

    pixels: StrokePoint[];
    boundary: StrokePoint[];

    area: number;

    centroid: {
        x: number;
        y: number;
    };
};

const NEIGHBORS_4 = [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
] as const;

const NEIGHBORS_8 = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
] as const;

function key(
    x: number,
    y: number
): string {
    return `${x},${y}`;
}

export function detectStrokeFaces(
    strokeLayer: ColorLayer
): StrokeFace[] {

    const height =
        strokeLayer.matrix.length;

    const width =
        strokeLayer.matrix[0].length;

    const strokeSet =
        new Set<string>();

    // ===================================
    // 1. Extraer posiciones del stroke
    // ===================================

    for (let y = 0; y < height; y++) {

        for (let x = 0; x < width; x++) {

            const pixel =
                strokeLayer.matrix[y][x];

            const isStroke =
                pixel.r === strokeLayer.color.r &&
                pixel.g === strokeLayer.color.g &&
                pixel.b === strokeLayer.color.b &&
                pixel.a === strokeLayer.color.a;

            if (isStroke) {
                strokeSet.add(
                    key(x, y)
                );
            }
        }
    }


    // ===================================
    // 2. Encontrar EXTERIOR
    // ===================================

    const exterior =
        new Set<string>();

    const queue: StrokePoint[] = [];


    function addExteriorCandidate(
        x: number,
        y: number
    ) {

        const k = key(x, y);

        if (strokeSet.has(k)) {
            return;
        }

        if (exterior.has(k)) {
            return;
        }

        exterior.add(k);

        queue.push({
            x,
            y
        });
    }


    // Bordes superior / inferior
    for (let x = 0; x < width; x++) {

        addExteriorCandidate(
            x,
            0
        );

        addExteriorCandidate(
            x,
            height - 1
        );
    }


    // Bordes izquierdo / derecho
    for (let y = 0; y < height; y++) {

        addExteriorCandidate(
            0,
            y
        );

        addExteriorCandidate(
            width - 1,
            y
        );
    }


    // Flood fill exterior
    while (queue.length > 0) {

        const current =
            queue.shift()!;

        for (const [dx, dy] of NEIGHBORS_4) {

            const nx =
                current.x + dx;

            const ny =
                current.y + dy;

            if (
                nx < 0 ||
                ny < 0 ||
                nx >= width ||
                ny >= height
            ) {
                continue;
            }

            const k =
                key(nx, ny);

            if (strokeSet.has(k)) {
                continue;
            }

            if (exterior.has(k)) {
                continue;
            }

            exterior.add(k);

            queue.push({
                x: nx,
                y: ny
            });
        }
    }


    // ===================================
    // 3. Buscar regiones NO exteriores
    // ===================================

    const visited =
        new Set<string>();

    const faces: StrokeFace[] = [];

    let faceId = 0;


    for (let y = 0; y < height; y++) {

        for (let x = 0; x < width; x++) {

            const startKey =
                key(x, y);

            // Stroke
            if (
                strokeSet.has(
                    startKey
                )
            ) {
                continue;
            }

            // Exterior
            if (
                exterior.has(
                    startKey
                )
            ) {
                continue;
            }

            // Ya pertenece a otra cara
            if (
                visited.has(
                    startKey
                )
            ) {
                continue;
            }


            // Nueva cara cerrada
            const facePixels: StrokePoint[] = [];

            const faceQueue: StrokePoint[] = [
                { x, y }
            ];

            visited.add(
                startKey
            );


            while (
                faceQueue.length > 0
            ) {

                const current =
                    faceQueue.shift()!;

                facePixels.push(
                    current
                );

                for (
                    const [dx, dy]
                    of NEIGHBORS_4
                ) {

                    const nx =
                        current.x + dx;

                    const ny =
                        current.y + dy;

                    if (
                        nx < 0 ||
                        ny < 0 ||
                        nx >= width ||
                        ny >= height
                    ) {
                        continue;
                    }

                    const k =
                        key(nx, ny);

                    if (
                        strokeSet.has(k)
                    ) {
                        continue;
                    }

                    if (
                        exterior.has(k)
                    ) {
                        continue;
                    }

                    if (
                        visited.has(k)
                    ) {
                        continue;
                    }

                    visited.add(k);

                    faceQueue.push({
                        x: nx,
                        y: ny
                    });
                }
            }


            // ===================================
            // 4. Obtener boundary del face
            // ===================================

            const boundarySet =
                new Set<string>();


            for (
                const pixel
                of facePixels
            ) {

                for (
                    const [dx, dy]
                    of NEIGHBORS_8
                ) {

                    const nx =
                        pixel.x + dx;

                    const ny =
                        pixel.y + dy;

                    if (
                        nx < 0 ||
                        ny < 0 ||
                        nx >= width ||
                        ny >= height
                    ) {
                        continue;
                    }

                    const k =
                        key(nx, ny);

                    if (
                        strokeSet.has(k)
                    ) {
                        boundarySet.add(k);
                    }
                }
            }


            const boundary:
                StrokePoint[] =
                [...boundarySet]
                    .map(position => {

                        const [xs, ys] =
                            position.split(",");

                        return {
                            x: Number(xs),
                            y: Number(ys)
                        };
                    });


            // ===================================
            // 5. Centroide
            // ===================================

            let sumX = 0;
            let sumY = 0;

            for (
                const pixel
                of facePixels
            ) {
                sumX += pixel.x;
                sumY += pixel.y;
            }


            const centroid = {
                x:
                    sumX /
                    facePixels.length,

                y:
                    sumY /
                    facePixels.length
            };


            faces.push({
                id: faceId++,

                pixels:
                    facePixels,

                boundary,

                area:
                    facePixels.length,

                centroid
            });
        }
    }


    return faces;
}