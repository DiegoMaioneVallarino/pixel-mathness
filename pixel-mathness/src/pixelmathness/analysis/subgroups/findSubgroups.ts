import type { PixelMatrix } from "../../types/PixelMatrix";
import type { Color } from "../../types/Color";

import type {
    Point,
    Subgroup
} from "./types";

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

export function findSubgroups(
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

            let borderPixelCount = 0;

            for (const pixel of pixels) {

                let isBorderPixel = false;

                for (const [dx, dy] of NEIGHBORS_8) {

                    const nx = pixel.x + dx;
                    const ny = pixel.y + dy;

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

            const borderRatio =
                pixels.length === 0
                    ? 0
                    : borderPixelCount / pixels.length;

            subgroups.push({
                pixels,
                pixelCount: pixels.length,
                borderPixelCount,
                borderRatio,

                // clasificación temporal
                kind: "stroke"
            });
        }
    }

    return subgroups;
}