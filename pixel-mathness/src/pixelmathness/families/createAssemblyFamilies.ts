import type { PixelMatrix } from "../types/PixelMatrix";
import type { Color } from "../types/Color";
import type { ColorLayer } from "../analysis/separateColorLayers";

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


export type AssemblyFamily = {
    cloudA: ColorLayer;
    cloudB: ColorLayer;

    contactPixels: number;

    matrix: PixelMatrix;
};

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

function getOuterOutline(
    matrix: PixelMatrix,
    color: Color
): Set<string> {

    const height = matrix.length;
    const width = matrix[0].length;

    const outline = new Set<string>();

    function isTarget(
        x: number,
        y: number
    ): boolean {
        return sameColor(
            matrix[y][x],
            color
        );
    }

    for (let y = 0; y < height; y++) {

        for (let x = 0; x < width; x++) {

            if (!isTarget(x, y)) {
                continue;
            }

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

                // El vecino NO pertenece a A.
                // Por tanto forma parte del outline externo.
                if (!isTarget(nx, ny)) {
                    outline.add(`${nx},${ny}`);
                }
            }
        }
    }

    return outline;
}

function getContactPixels(
    matrix: PixelMatrix,
    colorA: Color,
    colorB: Color
): number {

    const outlineA =
        getOuterOutline(
            matrix,
            colorA
        );

    let matches = 0;

    for (const position of outlineA) {

        const [xString, yString] =
            position.split(",");

        const x = Number(xString);
        const y = Number(yString);

        const pixel =
            matrix[y][x];

        if (
            sameColor(
                pixel,
                colorB
            )
        ) {
            matches++;
        }
    }

    return matches;
}
export function createAssemblyFamilies(
    matrix: PixelMatrix,
    layers: ColorLayer[]
): AssemblyFamily[] {

    const candidates = [...layers];

    const families: AssemblyFamily[] = [];

    while (candidates.length >= 2) {

        const cloudA = candidates[0];

        let bestIndex = 1;
        let bestContact = -1;

        for (
            let i = 1;
            i < candidates.length;
            i++
        ) {

            const cloudB = candidates[i];

            const contact =
                getContactPixels(
                    matrix,
                    cloudA.color,
                    cloudB.color
                );

            if (contact > bestContact) {
                bestContact = contact;
                bestIndex = i;
            }
        }

        const cloudB =
            candidates[bestIndex];

        const pairMatrix =
            createPairMatrix(
                matrix,
                cloudA.color,
                cloudB.color
            );

        families.push({
            cloudA,
            cloudB,
            contactPixels: bestContact,
            matrix: pairMatrix
        });

        // Quitar B
        candidates.splice(bestIndex, 1);

        // Quitar A
        candidates.splice(0, 1);
    }

    return families;
}
function createPairMatrix(
    matrix: PixelMatrix,
    colorA: Color,
    colorB: Color
): PixelMatrix {

    return matrix.map(row =>
        row.map(pixel => {

            if (
                sameColor(pixel, colorA) ||
                sameColor(pixel, colorB)
            ) {
                return { ...pixel };
            }

            return {
                r: 255,
                g: 255,
                b: 255,
                a: 255
            };
        })
    );
}