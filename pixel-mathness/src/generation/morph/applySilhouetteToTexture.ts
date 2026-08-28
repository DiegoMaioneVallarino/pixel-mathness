import type {
    PixelMatrix
} from "../../pixelmathness/types/PixelMatrix";

import type {
    BinaryMask
} from "./matrixToMask";


function isBackground(
    pixel: {
        r: number;
        g: number;
        b: number;
        a: number;
    }
): boolean {

    return (
        pixel.a === 0 ||
        (
            pixel.r === 255 &&
            pixel.g === 255 &&
            pixel.b === 255
        )
    );
}


function findNearestTexturePixel(
    texture: PixelMatrix,
    x: number,
    y: number
) {

    const height =
        texture.length;

    const width =
        texture[0].length;

    const maxRadius =
        Math.max(
            width,
            height
        );


    for (
        let radius = 1;
        radius <= maxRadius;
        radius++
    ) {

        for (
            let dy = -radius;
            dy <= radius;
            dy++
        ) {

            for (
                let dx = -radius;
                dx <= radius;
                dx++
            ) {

                if (
                    Math.abs(dx) !== radius &&
                    Math.abs(dy) !== radius
                ) {
                    continue;
                }

                const nx =
                    x + dx;

                const ny =
                    y + dy;

                if (
                    nx < 0 ||
                    ny < 0 ||
                    nx >= width ||
                    ny >= height
                ) {
                    continue;
                }

                const pixel =
                    texture[ny][nx];

                if (
                    !isBackground(
                        pixel
                    )
                ) {
                    return pixel;
                }
            }
        }
    }

    return {
        r: 0,
        g: 0,
        b: 0,
        a: 255
    };
}


export function applySilhouetteToTexture(
    texture: PixelMatrix,
    mask: BinaryMask
): PixelMatrix {

    const height =
        mask.length;

    const width =
        mask[0].length;

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
        let y = 0;
        y < height;
        y++
    ) {

        for (
            let x = 0;
            x < width;
            x++
        ) {

            if (!mask[y][x]) {
                continue;
            }

            const sourcePixel =
                texture[y][x];

            if (
                !isBackground(
                    sourcePixel
                )
            ) {

                result[y][x] = {
                    ...sourcePixel
                };

                continue;
            }

            result[y][x] = {
                ...findNearestTexturePixel(
                    texture,
                    x,
                    y
                )
            };
        }
    }


    return result;
}