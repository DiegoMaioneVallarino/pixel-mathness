import type {
    NormalizedColor
} from "./types";


export function getMaterialSimilarity(
    a: NormalizedColor,
    b: NormalizedColor
): number {

    const dr =
        a.r - b.r;

    const dg =
        a.g - b.g;

    const db =
        a.b - b.b;


    return Math.sqrt(
        dr * dr +
        dg * dg +
        db * db
    );
}