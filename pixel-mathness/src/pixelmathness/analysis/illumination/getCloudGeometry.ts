import type {
    ColorLayer
} from "../separateColorLayers";

export type Point = {
    x: number;
    y: number;
};

export type CloudGeometry = {
    centroid: Point;

    minX: number;
    minY: number;
    maxX: number;
    maxY: number;

    width: number;
    height: number;

    area: number;
};


export function getCloudGeometry(
    cloud: ColorLayer
): CloudGeometry {

    const matrix =
        cloud.matrix;

    const color =
        cloud.color;

    let sumX = 0;
    let sumY = 0;

    let count = 0;

    let minX = Infinity;
    let minY = Infinity;

    let maxX = -Infinity;
    let maxY = -Infinity;


    for (
        let y = 0;
        y < matrix.length;
        y++
    ) {

        for (
            let x = 0;
            x < matrix[0].length;
            x++
        ) {

            const pixel =
                matrix[y][x];

            const sameColor =
                pixel.r === color.r &&
                pixel.g === color.g &&
                pixel.b === color.b &&
                pixel.a === color.a;

            if (!sameColor) {
                continue;
            }


            sumX += x;
            sumY += y;

            count++;


            minX =
                Math.min(
                    minX,
                    x
                );

            minY =
                Math.min(
                    minY,
                    y
                );

            maxX =
                Math.max(
                    maxX,
                    x
                );

            maxY =
                Math.max(
                    maxY,
                    y
                );
        }
    }


    return {
        centroid: {
            x:
                count === 0
                    ? 0
                    : sumX / count,

            y:
                count === 0
                    ? 0
                    : sumY / count
        },

        minX,
        minY,
        maxX,
        maxY,

        width:
            maxX - minX + 1,

        height:
            maxY - minY + 1,

        area:
            count
    };
}