import type { PixelMatrix } from "../../pixelmathness/types/PixelMatrix";

export function starWarp(
    source: PixelMatrix,
    centerX: number,
    centerY: number,
    points: number,
    amplitude: number
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

            const angle =
                Math.atan2(
                    dy,
                    dx
                );

            const scale =
                1 +
                amplitude *
                Math.cos(
                    points *
                    angle
                );

            if (Math.abs(scale) < 0.0001) {
                continue;
            }

            const sourceRadius =
                radius / scale;

            const sourceX =
                centerX +
                Math.cos(angle) *
                sourceRadius;

            const sourceY =
                centerY +
                Math.sin(angle) *
                sourceRadius;

            const sx =
                Math.round(sourceX);

            const sy =
                Math.round(sourceY);

            if (
                sx < 0 ||
                sy < 0 ||
                sx >= width ||
                sy >= height
            ) {
                continue;
            }

            result[y][x] = {
                ...source[sy][sx]
            };
        }
    }

    return result;
}