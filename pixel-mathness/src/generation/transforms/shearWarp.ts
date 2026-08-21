import type { PixelMatrix } from "../../pixelmathness/types/PixelMatrix";

export function shearWarp(
    source: PixelMatrix,
    amount: number
): PixelMatrix {

    const height =
        source.length;

    const width =
        source[0].length;

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

    const centerY =
        height / 2;

    for (let y = 0; y < height; y++) {

        for (let x = 0; x < width; x++) {

            const offset =
                (y - centerY) *
                amount *
                0.5;

            const sourceX =
                Math.round(
                    x - offset
                );

            if (
                sourceX >= 0 &&
                sourceX < width
            ) {
                result[y][x] = {
                    ...source[y][sourceX]
                };
            }
        }
    }

    return result;
}