import type {
    PixelMatrix
} from "../../types/PixelMatrix";

import type {
    ColorLayer
} from "../separateColorLayers";

import type {
    AnalyzedFace
} from "../../faces/analyzeFaceContents";


function sameColor(
    a: {
        r: number;
        g: number;
        b: number;
        a: number;
    },
    b: {
        r: number;
        g: number;
        b: number;
        a: number;
    }
): boolean {

    return (
        a.r === b.r &&
        a.g === b.g &&
        a.b === b.b &&
        a.a === b.a
    );
}


export function faceCloudIntersectionToMatrix(
    face: AnalyzedFace,
    cloud: ColorLayer
): PixelMatrix {

    const height =
        cloud.matrix.length;

    const width =
        cloud.matrix[0].length;

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


    for (
        const point
        of face.face.pixels
    ) {

        const pixel =
            cloud.matrix[
                point.y
            ][
                point.x
            ];

        if (
            sameColor(
                pixel,
                cloud.color
            )
        ) {
            result[
                point.y
            ][
                point.x
            ] = {
                ...pixel
            };
        }
    }


    return result;
}