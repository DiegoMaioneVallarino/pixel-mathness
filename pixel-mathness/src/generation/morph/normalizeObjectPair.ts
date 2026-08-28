import type {
    PixelMatrix
} from "../../pixelmathness/types/PixelMatrix";


type Bounds = {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;

    width: number;
    height: number;
};


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


function getBounds(
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


    for (let y = 0; y < height; y++) {

        for (let x = 0; x < width; x++) {

            if (
                isBackground(
                    matrix[y][x]
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
        maxY,

        width:
            maxX -
            minX +
            1,

        height:
            maxY -
            minY +
            1
    };
}


function createCanvas(
    width: number,
    height: number
): PixelMatrix {

    return Array.from(
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
}


function placeObject(
    source: PixelMatrix,
    bounds: Bounds,
    targetWidth: number,
    targetHeight: number,
    scale: number
): PixelMatrix {

    const result =
        createCanvas(
            targetWidth,
            targetHeight
        );


    const scaledWidth =
        bounds.width *
        scale;

    const scaledHeight =
        bounds.height *
        scale;


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


    for (
        let y = 0;
        y < scaledHeight;
        y++
    ) {

        for (
            let x = 0;
            x < scaledWidth;
            x++
        ) {

            const sourceX =
                bounds.minX +
                Math.floor(
                    x / scale
                );

            const sourceY =
                bounds.minY +
                Math.floor(
                    y / scale
                );


            if (
                sourceX < bounds.minX ||
                sourceY < bounds.minY ||
                sourceX > bounds.maxX ||
                sourceY > bounds.maxY
            ) {
                continue;
            }


            const targetX =
                Math.floor(
                    offsetX + x
                );

            const targetY =
                Math.floor(
                    offsetY + y
                );


            if (
                targetX < 0 ||
                targetY < 0 ||
                targetX >= targetWidth ||
                targetY >= targetHeight
            ) {
                continue;
            }


            result[targetY][targetX] = {
                ...source[sourceY][sourceX]
            };
        }
    }


    return result;
}


export function normalizeObjectPair(
    objectA: PixelMatrix,
    objectB: PixelMatrix,
    targetWidth = 200,
    targetHeight = 200,
    padding = 20
) {

    const boundsA =
        getBounds(objectA);

    const boundsB =
        getBounds(objectB);


    if (
        !boundsA ||
        !boundsB
    ) {
        return null;
    }


    const maxObjectWidth =
        Math.max(
            boundsA.width,
            boundsB.width
        );

    const maxObjectHeight =
        Math.max(
            boundsA.height,
            boundsB.height
        );


    const availableWidth =
        targetWidth -
        padding * 2;

    const availableHeight =
        targetHeight -
        padding * 2;


    // Mismo factor para A y B.
    //
    // Si ambos ya caben:
    // scale = 1
    //
    // Solo reducimos si alguno
    // excede el espacio.
    const scale =
        Math.min(
            1,

            availableWidth /
                maxObjectWidth,

            availableHeight /
                maxObjectHeight
        );


    const normalizedA =
        placeObject(
            objectA,
            boundsA,

            targetWidth,
            targetHeight,

            scale
        );


    const normalizedB =
        placeObject(
            objectB,
            boundsB,

            targetWidth,
            targetHeight,

            scale
        );


    return {
        objectA: normalizedA,
        objectB: normalizedB,

        scale
    };
}