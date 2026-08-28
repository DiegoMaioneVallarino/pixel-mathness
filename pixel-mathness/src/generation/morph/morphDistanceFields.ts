import type {
    DistanceField
} from "./createSignedDistanceField";

import type {
    BinaryMask
} from "./matrixToMask";


export function morphDistanceFields(
    sdfA: DistanceField,
    sdfB: DistanceField,
    amount: number
): BinaryMask {

    if (
        sdfA.length === 0 ||
        sdfB.length === 0 ||
        !sdfA[0] ||
        !sdfB[0]
    ) {
        return [];
    }

    const height =
        Math.min(
            sdfA.length,
            sdfB.length
        );

    const width =
        Math.min(
            sdfA[0].length,
            sdfB[0].length
        );


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

        // Seguridad adicional
        if (
            !sdfA[y] ||
            !sdfB[y]
        ) {
            continue;
        }

        for (
            let x = 0;
            x < width;
            x++
        ) {

            const valueA =
                sdfA[y][x];

            const valueB =
                sdfB[y][x];

            if (
                valueA === undefined ||
                valueB === undefined
            ) {
                continue;
            }


            const value =
                valueA *
                    (1 - amount)
                +
                valueB *
                    amount;


            result[y][x] =
                value <= 0;
        }
    }

    return result;
}