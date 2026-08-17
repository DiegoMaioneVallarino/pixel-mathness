import type { PixelMatrix } from "../types/PixelMatrix";
import type { Color } from "../types/Color";

export type ColorLayer = {
    color: Color;
    matrix: PixelMatrix;

    pixelCount: number;
    subgroupCount: number;

    singlePixelSubgroupCount: number;
    strokeSubgroupCount: number;

    borderPixelCount: number;
    borderRatio: number;
};

type Point = {
    x: number;
    y: number;
};

type Subgroup = {
    pixels: Point[];
    pixelCount: number;
    borderPixelCount: number;
    borderRatio: number;
};

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

function colorKey(color: Color): string {
    return `${color.r},${color.g},${color.b},${color.a}`;
}

function sameColor(
    a: Color,
    b: Color
): boolean {
    return (
        a.r === b.r &&
        a.g === b.g &&
        a.b === b.b &&
        a.a === b.a
    );
}

function findSubgroups(
    matrix: PixelMatrix,
    targetColor: Color
): Subgroup[] {

    const height = matrix.length;
    const width = matrix[0].length;

    const visited = Array.from(
        { length: height },
        () => Array(width).fill(false)
    );

    function isTarget(
        x: number,
        y: number
    ): boolean {
        return sameColor(
            matrix[y][x],
            targetColor
        );
    }

    const subgroups: Subgroup[] = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {

            if (visited[y][x]) continue;
            if (!isTarget(x, y)) continue;

            const queue: Point[] = [
                { x, y }
            ];

            const pixels: Point[] = [];

            visited[y][x] = true;

            // Encontrar todos los píxeles
            // conectados a este subgrupo.
            while (queue.length > 0) {

                const current = queue.shift()!;

                pixels.push(current);

                for (const [dx, dy] of NEIGHBORS_8) {

                    const nx = current.x + dx;
                    const ny = current.y + dy;

                    if (
                        nx < 0 ||
                        ny < 0 ||
                        nx >= width ||
                        ny >= height
                    ) {
                        continue;
                    }

                    if (visited[ny][nx]) continue;
                    if (!isTarget(nx, ny)) continue;

                    visited[ny][nx] = true;

                    queue.push({
                        x: nx,
                        y: ny
                    });
                }
            }

            // Ahora analizamos el borde
            // de este subgrupo.
            let borderPixelCount = 0;

            for (const pixel of pixels) {

                let isBorderPixel = false;

                for (const [dx, dy] of NEIGHBORS_8) {

                    const nx = pixel.x + dx;
                    const ny = pixel.y + dy;

                    // Fuera de la imagen no lo contamos.
                    if (
                        nx < 0 ||
                        ny < 0 ||
                        nx >= width ||
                        ny >= height
                    ) {
                        continue;
                    }

                    // Si tiene algún vecino que NO pertenece
                    // al mismo color, este pixel es borde.
                    if (!isTarget(nx, ny)) {
                        isBorderPixel = true;
                        break;
                    }
                }

                if (isBorderPixel) {
                    borderPixelCount++;
                }
            }

            const borderRatio =
                pixels.length === 0
                    ? 0
                    : borderPixelCount / pixels.length;

            subgroups.push({
                pixels,
                pixelCount: pixels.length,
                borderPixelCount,
                borderRatio
            });
        }
    }

    return subgroups;
}

function getBorderStats(
    matrix: PixelMatrix,
    targetColor: Color
) {
    const height = matrix.length;
    const width = matrix[0].length;

    let pixelCount = 0;
    let borderPixelCount = 0;

    function isTarget(
        x: number,
        y: number
    ): boolean {
        return sameColor(
            matrix[y][x],
            targetColor
        );
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {

            if (!isTarget(x, y)) continue;

            pixelCount++;

            let isBorderPixel = false;

            for (const [dx, dy] of NEIGHBORS_8) {

                const nx = x + dx;
                const ny = y + dy;

                if (
                    nx < 0 ||
                    ny < 0 ||
                    nx >= width ||
                    ny >= height
                ) {
                    continue;
                }

                if (!isTarget(nx, ny)) {
                    isBorderPixel = true;
                    break;
                }
            }

            if (isBorderPixel) {
                borderPixelCount++;
            }
        }
    }

    return {
        borderPixelCount,

        borderRatio:
            pixelCount === 0
                ? 0
                : borderPixelCount / pixelCount
    };
}

export function separateColorLayers(
    matrix: PixelMatrix
): ColorLayer[] {

    const colorData = new Map<
        string,
        {
            color: Color;
            pixelCount: number;
        }
    >();

    // 1. Encontrar colores únicos
    // y contar sus píxeles.
    for (const row of matrix) {
        for (const pixel of row) {

            if (pixel.a === 0) continue;

            const key = colorKey(pixel);

            const existing =
                colorData.get(key);

            if (existing) {
                existing.pixelCount++;
            } else {
                colorData.set(key, {
                    color: pixel,
                    pixelCount: 1
                });
            }
        }
    }

    const layers: ColorLayer[] = [];

    // 2. Crear una capa por color.
    for (
        const {
            color,
            pixelCount
        } of colorData.values()
    ) {

        const layerMatrix: PixelMatrix =
            matrix.map(row =>
                row.map(pixel => {

                    if (
                        sameColor(
                            pixel,
                            color
                        )
                    ) {
                        return { ...color };
                    }

                    return {
                        r: 255,
                        g: 255,
                        b: 255,
                        a: 255
                    };
                })
            );

        // 3. Encontrar subgrupos reales.
        const subgroups =
            findSubgroups(
                matrix,
                color
            );

        const subgroupCount =
            subgroups.length;

        // Grupos formados por exactamente
        // un solo pixel.
        const singlePixelSubgroupCount =
            subgroups.filter(
                subgroup =>
                    subgroup.pixelCount === 1
            ).length;

        // Líneas:
        // más de un pixel y todos los
        // pixeles son borde.
        const strokeSubgroupCount =
            subgroups.filter(
                subgroup =>
                    subgroup.pixelCount > 1 &&
                    subgroup.borderRatio === 1
            ).length;

        const borderStats =
            getBorderStats(
                matrix,
                color
            );

        layers.push({
            color,
            matrix: layerMatrix,

            pixelCount,

            subgroupCount,

            singlePixelSubgroupCount,
            strokeSubgroupCount,

            borderPixelCount:
                borderStats.borderPixelCount,

            borderRatio:
                borderStats.borderRatio
        });
    }

    // 4. Ordenar mayor → menor
    // según número de píxeles.
    layers.sort(
        (a, b) =>
            b.pixelCount -
            a.pixelCount
    );

    return layers;
}