import type { PixelMatrix } from "../../pixelmathness/types/PixelMatrix";
import type { TransformType } from "./types";

import { starWarp } from "./starWarp";
import { bulgeWarp } from "./bulgeWarp";
import { pinchWarp } from "./pinchWarp";
import { waveWarp } from "./waveWarp";
import { twistWarp } from "./twistWarp";
import { shearWarp } from "./shearWarp";

export function applyTransform(
    matrix: PixelMatrix,
    type: TransformType,
    amount: number
): PixelMatrix {

    const centerX =
        matrix[0].length / 2;

    const centerY =
        matrix.length / 2;

    switch (type) {

        case "none":
            return matrix;

        case "star":
            return starWarp(
                matrix,
                centerX,
                centerY,
                5,
                0.35 * amount
            );

        case "bulge":
            return bulgeWarp(
                matrix,
                centerX,
                centerY,
                amount
            );

        case "pinch":
            return pinchWarp(
                matrix,
                centerX,
                centerY,
                amount
            );

        case "wave":
            return waveWarp(
                matrix,
                amount
            );

        case "twist":
            return twistWarp(
                matrix,
                centerX,
                centerY,
                amount
            );

        case "shear":
            return shearWarp(
                matrix,
                amount
            );
    }
}