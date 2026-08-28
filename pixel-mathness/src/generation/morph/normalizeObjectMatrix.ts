import type {
    PixelMatrix
} from "../../pixelmathness/types/PixelMatrix";


type Bounds = {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
};


function isBackgroundPixel(
    pixel: {
        r: number;
        g: number;
        b: number;
        a: number;
    }
): boolean {

    // Transparente
    if (pixel.a === 0) {
        return true;
    }

    // Blanco puro
    if (
        pixel.r === 255 &&
        pixel.g === 255 &&
        pixel.b === 255
    ) {
        return true;
    }

    return false;
}


function findBounds(
    matrix: PixelMatrix
): Bounds | null {

    const height =
        matrix.length;

    const width =
        matrix[0].length;

    let minX = width;
    let minY = height;

    let maxX = -1;
    let maxY = -1;


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

            const pixel =
                matrix[y][x];

            if (
                isBackgroundPixel(
                    pixel
                )
            ) {
                continue;
            }

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


    if (
        maxX < minX ||
        maxY < minY
    ) {
        return null;
    }


    return {
        minX,
        minY,
        maxX,
        maxY
    };
}


export function normalizeObjectMatrix(
    source: PixelMatrix,
    targetWidth = 100,
    targetHeight = 100,
    padding = 10
): PixelMatrix {

    const bounds =
        findBounds(
            source
        );


    // Si no encontramos objeto,
    // devolvemos canvas blanco.
    if (!bounds) {

        return Array.from(
            { length: targetHeight },
            () =>
                Array.from(
                    { length: targetWidth },
                    () => ({
                        r: 255,
                        g: 255,
                        b: 255,
                        a: 255
                    })
                )
        );
    }


    const objectWidth =
        bounds.maxX -
        bounds.minX +
        1;

    const objectHeight =
        bounds.maxY -
        bounds.minY +
        1;


    const availableWidth =
        targetWidth -
        padding * 2;

    const availableHeight =
        targetHeight -
        padding * 2;


    // Escala uniforme:
    // conserva proporciones.
    const scale =
        Math.min(
            availableWidth /
                objectWidth,

            availableHeight /
                objectHeight
        );


    const scaledWidth =
        objectWidth *
        scale;

    const scaledHeight =
        objectHeight *
        scale;


    // Centrado final
    const offsetX =
        (
            targetWidth -
            scaledWidth
        ) / 2;

    const offsetY =
        (
            targetHeight -
            scaledHeight
        ) / 2;


    const result: PixelMatrix =
        Array.from(
            { length: targetHeight },
            () =>
                Array.from(
                    { length: targetWidth },
                    () => ({
                        r: 255,
                        g: 255,
                        b: 255,
                        a: 255
                    })
                )
        );


    // Inverse mapping:
    // cada pixel destino busca
    // su pixel correspondiente
    // en el objeto original.
    for (
        let y = 0;
        y < targetHeight;
        y++
    ) {

        for (
            let x = 0;
            x < targetWidth;
            x++
        ) {

            const localX =
                (
                    x -
                    offsetX
                ) /
                scale;

            const localY =
                (
                    y -
                    offsetY
                ) /
                scale;


            if (
                localX < 0 ||
                localY < 0 ||
                localX >= objectWidth ||
                localY >= objectHeight
            ) {
                continue;
            }


            const sourceX =
                Math.round(
                    bounds.minX +
                    localX
                );

            const sourceY =
                Math.round(
                    bounds.minY +
                    localY
                );


            if (
                sourceX < 0 ||
                sourceY < 0 ||
                sourceY >= source.length ||
                sourceX >= source[0].length
            ) {
                continue;
            }


            result[y][x] = {
                ...source[
                    sourceY
                ][
                    sourceX
                ]
            };
        }
    }


    return result;
}