import type { PixelMatrix } from "../types/PixelMatrix";
import type { Color } from "../types/Color";

import type {
    Subgroup
} from "./subgroups/types";

import {
    findSubgroups
} from "./subgroups/findSubgroups";

import {
    classifySubgroup
} from "./subgroups/classifySubgroup";

export type ColorLayer = {
    color: Color;
    matrix: PixelMatrix;

    pixelCount: number;

    subgroups: Subgroup[];
    subgroupCount: number;

    pixelSubgroupCount: number;

    lineSubgroupCount: number;
    straightLineCount: number;
    curveLineCount: number;
    loopLineCount: number;

    strokeSubgroupCount: number;
    solidSubgroupCount: number;

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

        const rawSubgroups =
    findSubgroups(
        matrix,
        color
    );

const subgroups =
    rawSubgroups.map(
        classifySubgroup
    );

const subgroupCount =
    subgroups.length;

const pixelSubgroupCount =
    subgroups.filter(
        subgroup =>
            subgroup.kind === "pixel"
    ).length;

const lineSubgroupCount =
    subgroups.filter(
        subgroup =>
            subgroup.kind === "line"
    ).length;

const straightLineCount =
    subgroups.filter(
        subgroup =>
            subgroup.kind === "line" &&
            subgroup.lineKind === "straight"
    ).length;

const curveLineCount =
    subgroups.filter(
        subgroup =>
            subgroup.kind === "line" &&
            subgroup.lineKind === "curve"
    ).length;

const loopLineCount =
    subgroups.filter(
        subgroup =>
            subgroup.kind === "line" &&
            subgroup.lineKind === "loop"
    ).length;

const strokeSubgroupCount =
    subgroups.filter(
        subgroup =>
            subgroup.kind === "stroke"
    ).length;

const solidSubgroupCount =
    subgroups.filter(
        subgroup =>
            subgroup.kind === "solid"
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

    subgroups,
    subgroupCount,

    pixelSubgroupCount,

    lineSubgroupCount,
    straightLineCount,
    curveLineCount,
    loopLineCount,

    strokeSubgroupCount,
    solidSubgroupCount,

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