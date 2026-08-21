import type { PixelMatrix } from "../../pixelmathness/types/PixelMatrix";

export function waveWarp(
    source: PixelMatrix,
    amount: number
): PixelMatrix {

    const height = source.length;
    const width = source[0].length;

    const result: PixelMatrix =
        Array.from(
            { length: height },
            () =>
                Array.from(
                    { length: width },
                    () => ({
                        r: 255,
                        g: 255,
                        b: 255,
                        a: 255
                    })
                )
        );

    const amplitude =
        10 * amount;

    const frequency =
        0.15;

    for (let y = 0; y < height; y++) {

        for (let x = 0; x < width; x++) {

            const offset =
                Math.sin(
                    y * frequency
                ) *
                amplitude;

            const sourceX =
                Math.round(
                    x - offset
                );

            const sourceY = y;

            if (
                sourceX >= 0 &&
                sourceX < width
            ) {
                result[y][x] = {
                    ...source[sourceY][sourceX]
                };
            }
        }
    }

    return result;
}