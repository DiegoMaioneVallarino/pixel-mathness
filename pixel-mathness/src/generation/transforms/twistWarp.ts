import type { PixelMatrix } from "../../pixelmathness/types/PixelMatrix";

export function twistWarp(
    source: PixelMatrix,
    centerX: number,
    centerY: number,
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

    const maxRadius =
        Math.min(width, height) / 2;

    for (let y = 0; y < height; y++) {

        for (let x = 0; x < width; x++) {

            const dx =
                x - centerX;

            const dy =
                y - centerY;

            const radius =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            const normalized =
                radius / maxRadius;

            const angle =
                Math.atan2(dy, dx);

            const twist =
                amount *
                (1 - normalized) *
                Math.PI;

            const sourceAngle =
                angle - twist;

            const sourceX =
                centerX +
                Math.cos(sourceAngle) *
                radius;

            const sourceY =
                centerY +
                Math.sin(sourceAngle) *
                radius;

            const sx =
                Math.round(sourceX);

            const sy =
                Math.round(sourceY);

            if (
                sx >= 0 &&
                sy >= 0 &&
                sx < width &&
                sy < height
            ) {
                result[y][x] = {
                    ...source[sy][sx]
                };
            }
        }
    }

    return result;
}