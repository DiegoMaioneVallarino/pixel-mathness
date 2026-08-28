import type {
    PixelMatrix
} from "../../pixelmathness/types/PixelMatrix";

export type BinaryMask =
    boolean[][];

export function matrixToMask(
    matrix: PixelMatrix
): BinaryMask {

    return matrix.map(
        row =>
            row.map(
                pixel => {

                    const isTransparent =
                        pixel.a === 0;

                    const isWhite =
                        pixel.r === 255 &&
                        pixel.g === 255 &&
                        pixel.b === 255;

                    return (
                        !isTransparent &&
                        !isWhite
                    );
                }
            )
    );
}