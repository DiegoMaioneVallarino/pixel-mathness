import type { PixelMatrix } from "../types/PixelMatrix";
import type { ColorLayer } from "./separateColorLayers";

export function createOutlineLayer(
    matrix: PixelMatrix,
    outlineLayers: ColorLayer[]
): ColorLayer | null {

    if (outlineLayers.length === 0) {
        return null;
    }

    const outlineColors = new Set(
        outlineLayers.map(layer =>
            `${layer.color.r},${layer.color.g},${layer.color.b},${layer.color.a}`
        )
    );

    let pixelCount = 0;

    const outlineMatrix: PixelMatrix =
        matrix.map(row =>
            row.map(pixel => {

                const key =
                    `${pixel.r},${pixel.g},${pixel.b},${pixel.a}`;

                if (outlineColors.has(key)) {

                    pixelCount++;

                    return {
                        r: 0,
                        g: 0,
                        b: 0,
                        a: 255
                    };
                }

                return {
                    r: 255,
                    g: 255,
                    b: 255,
                    a: 255
                };
            })
        );

    return {
        color: {
            r: 0,
            g: 0,
            b: 0,
            a: 255
        },

        matrix: outlineMatrix,

        pixelCount,

        subgroups: [],
        subgroupCount: 0,

        pixelSubgroupCount: 0,

        lineSubgroupCount: 0,
        straightLineCount: 0,
        curveLineCount: 0,
        loopLineCount: 0,

        strokeSubgroupCount: 0,
        solidSubgroupCount: 0,

        borderPixelCount: 0,
        borderRatio: 0
    };
}