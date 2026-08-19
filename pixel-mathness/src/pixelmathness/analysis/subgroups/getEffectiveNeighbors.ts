import type { Point } from "./types";

const ORTHOGONAL = [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
] as const;

const DIAGONAL = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
] as const;

function key(
    x: number,
    y: number
): string {
    return `${x},${y}`;
}

export function getEffectiveNeighbors(
    point: Point,
    pixelSet: Set<string>
): Point[] {

    const result: Point[] = [];

    // vecinos ortogonales
    for (const [dx, dy] of ORTHOGONAL) {

        const x = point.x + dx;
        const y = point.y + dy;

        if (
            pixelSet.has(
                key(x, y)
            )
        ) {
            result.push({
                x,
                y
            });
        }
    }

    // diagonales no redundantes
    for (const [dx, dy] of DIAGONAL) {

        const x = point.x + dx;
        const y = point.y + dy;

        if (
            !pixelSet.has(
                key(x, y)
            )
        ) {
            continue;
        }

        const horizontalExists =
            pixelSet.has(
                key(
                    point.x + dx,
                    point.y
                )
            );

        const verticalExists =
            pixelSet.has(
                key(
                    point.x,
                    point.y + dy
                )
            );

        // si la diagonal ya está explicada
        // por una conexión ortogonal,
        // no cuenta como una nueva rama
        if (
            horizontalExists ||
            verticalExists
        ) {
            continue;
        }

        result.push({
            x,
            y
        });
    }

    return result;
}