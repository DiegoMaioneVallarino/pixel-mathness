import type { PixelMatrix } from "../types/PixelMatrix";
import type { Silhouette } from "../types/Silhouette";
import type { Color } from "../types/Color";

function sameColor(
    a: Color,
    b: Color,
    tolerance = 0
): boolean {
    return (
        Math.abs(a.r - b.r) <= tolerance &&
        Math.abs(a.g - b.g) <= tolerance &&
        Math.abs(a.b - b.b) <= tolerance &&
        Math.abs(a.a - b.a) <= tolerance
    );
}

export function extractSilhouette(
    matrix: PixelMatrix,
    backgroundColor?: Color,
    tolerance = 0
): Silhouette {

    return matrix.map(row =>
        row.map(pixel => {

            // Si realmente hay transparencia
            if (pixel.a === 0) {
                return false;
            }

            // Si definimos un color de fondo
            if (
                backgroundColor &&
                sameColor(pixel, backgroundColor, tolerance)
            ) {
                return false;
            }

            return true;
        })
    );
}