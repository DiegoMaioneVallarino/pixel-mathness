import type {
    BinaryMask
} from "./matrixToMask";

import {
    createSignedDistanceField
} from "./createSignedDistanceField";


export function morphSilhouettes(
    maskA: BinaryMask,
    maskB: BinaryMask,
    amount: number
): BinaryMask {

    const sdfA =
        createSignedDistanceField(
            maskA
        );

    const sdfB =
        createSignedDistanceField(
            maskB
        );

    const height =
        maskA.length;

    const width =
        maskA[0].length;

    const result: BinaryMask =
        Array.from(
            { length: height },
            () =>
                Array(width).fill(false)
        );


    for (
        let y = 0;
        y < height;
        y++
    ) {

        for (
            let x = 0;
            x < width;
            x++
        ) {

            const value =
                sdfA[y][x] *
                    (1 - amount)
                +
                sdfB[y][x] *
                    amount;

            result[y][x] =
                value <= 0;
        }
    }

    return result;
}