import type { PixelMatrix } from "../types/PixelMatrix";
import type { StrokeFace } from "../stroke/detectStrokeFaces";

export function faceToMatrix(
    face: StrokeFace,
    original: PixelMatrix
): PixelMatrix {

    const height =
        original.length;

    const width =
        original[0].length;

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

    // Interior original
    for (const point of face.pixels) {

        result[point.y][point.x] = {
            ...original[point.y][point.x]
        };
    }

    // Su loop/boundary negro
    for (const point of face.boundary) {

        result[point.y][point.x] = {
            r: 0,
            g: 0,
            b: 0,
            a: 255
        };
    }

    return result;
}

