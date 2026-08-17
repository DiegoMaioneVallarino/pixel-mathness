import type { Color } from "../types/Color";
import type { PixelMatrix } from "../types/PixelMatrix";
import type { StrokeFace } from "../stroke/detectStrokeFaces";

export type FaceColorContent = {
    color: Color;

    pixelCount: number;
    ratio: number;
};

export type AnalyzedFace = {
    face: StrokeFace;

    pixelCount: number;

    colors: FaceColorContent[];
};

function colorKey(color: Color): string {
    return `${color.r},${color.g},${color.b},${color.a}`;
}

export function analyzeFaceContents(
    face: StrokeFace,
    matrix: PixelMatrix
): AnalyzedFace {

    const colorCounts = new Map<
        string,
        {
            color: Color;
            count: number;
        }
    >();

    for (const point of face.pixels) {

        const pixel =
            matrix[point.y][point.x];

        const key =
            colorKey(pixel);

        const existing =
            colorCounts.get(key);

        if (existing) {
            existing.count++;
        }
        else {
            colorCounts.set(key, {
                color: { ...pixel },
                count: 1
            });
        }
    }

    const pixelCount =
        face.pixels.length;

    const colors: FaceColorContent[] =
        [...colorCounts.values()]
            .map(item => ({
                color: item.color,

                pixelCount:
                    item.count,

                ratio:
                    pixelCount === 0
                        ? 0
                        : item.count / pixelCount
            }))
            .sort(
                (a, b) =>
                    b.pixelCount -
                    a.pixelCount
            );

    return {
        face,
        pixelCount,
        colors
    };
}

export function analyzeAllFaceContents(
    faces: StrokeFace[],
    matrix: PixelMatrix
): AnalyzedFace[] {

    return faces.map(
        face =>
            analyzeFaceContents(
                face,
                matrix
            )
    );
}