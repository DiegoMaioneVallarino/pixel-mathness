import type {
    Subgroup
} from "./types";

import {
    getEffectiveNeighbors
} from "./getEffectiveNeighbors";

import {
    analyzeLineGeometry
} from "./analyzeLineGeometry";

function key(
    x: number,
    y: number
): string {
    return `${x},${y}`;
}

function buildPixelSet(
    subgroup: Subgroup
): Set<string> {

    return new Set(
        subgroup.pixels.map(
            pixel =>
                key(
                    pixel.x,
                    pixel.y
                )
        )
    );
}

function getEndpointCount(
    subgroup: Subgroup
): number {

    const pixelSet =
        buildPixelSet(subgroup);

    let endpoints = 0;

    for (const pixel of subgroup.pixels) {

        const neighbors =
            getEffectiveNeighbors(
                pixel,
                pixelSet
            );

        if (neighbors.length === 1) {
            endpoints++;
        }
    }

    return endpoints;
}

function isOneDimensional(
    subgroup: Subgroup
): boolean {

    const pixelSet =
        buildPixelSet(subgroup);

    let endpoints = 0;

    for (const pixel of subgroup.pixels) {

        const neighbors =
            getEffectiveNeighbors(
                pixel,
                pixelSet
            );

        if (neighbors.length === 1) {
            endpoints++;
        }

        if (neighbors.length > 2) {
            return false;
        }
    }

    return (
        endpoints === 0 ||
        endpoints === 2
    );
}

function isLoop(
    subgroup: Subgroup
): boolean {

    const pixelSet =
        buildPixelSet(subgroup);

    return subgroup.pixels.every(
        pixel =>
            getEffectiveNeighbors(
                pixel,
                pixelSet
            ).length === 2
    );
}

export function classifySubgroup(
    subgroup: Subgroup
): Subgroup {

    // 1 píxel
    if (
        subgroup.pixelCount === 1
    ) {
        return {
            ...subgroup,
            kind: "pixel",
            lineKind: undefined
        };
    }

    // tiene interior real
    if (
        subgroup.borderRatio < 1
    ) {
        return {
            ...subgroup,
            kind: "solid",
            lineKind: undefined
        };
    }

    // sin interior:
    // comprobar si es una trayectoria 1D
 if (isOneDimensional(subgroup)) {

    const geometry =
        analyzeLineGeometry(
            subgroup.pixels
        );

    // -------------------------
    // LOOP
    // -------------------------

    if (isLoop(subgroup)) {

        return {
            ...subgroup,

            kind: "line",
            lineKind: "loop",

            angle: geometry.angle,
            straightness:
                geometry.straightness
        };
    }


    // -------------------------
    // STRAIGHT / CURVE
    // -------------------------

    const STRAIGHT_THRESHOLD =
        0.95;

    const lineKind =
        geometry.straightness >=
        STRAIGHT_THRESHOLD
            ? "straight"
            : "curve";


    return {
        ...subgroup,

        kind: "line",
        lineKind,

        angle:
            geometry.angle,

        straightness:
            geometry.straightness
    };
}

    // Tiene 100% border pero posee grosor /
    // estructura 2D sin interior real.
    return {
        ...subgroup,
        kind: "stroke",
        lineKind: undefined
    };
}