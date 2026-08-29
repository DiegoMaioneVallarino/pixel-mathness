import type {
    PixelMatrix
} from "../../pixelmathness/types/PixelMatrix";

import type {
    CuboidPixelRole,
    CuboidRasterStructure,
    PrimaryObject
} from "./types";

import type {
    CuboidPalette,
    RGBColor
} from "./cuboidPalette";

import {
    defaultCuboidPalette,
    shiftPaletteHue
} from "./cuboidPalette";
type RGBA = {
    r: number;
    g: number;
    b: number;
    a: number;
};


function createBlankMatrix(
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


function averageColor(
    a: RGBColor,
    b: RGBColor
): RGBColor {

    return {
        r: Math.round(
            (a.r + b.r) / 2
        ),

        g: Math.round(
            (a.g + b.g) / 2
        ),

        b: Math.round(
            (a.b + b.b) / 2
        )
    };
}


function lightenColor(
    base: RGBColor,
    amount: number
): RGBColor {

    const t =
        Math.max(
            0,
            Math.min(
                1,
                amount
            )
        );


    return {
        r: Math.round(
            base.r +
            (255 - base.r) * t
        ),

        g: Math.round(
            base.g +
            (255 - base.g) * t
        ),

        b: Math.round(
            base.b +
            (255 - base.b) * t
        )
    };
}


function blendPixel(
    matrix: PixelMatrix,
    x: number,
    y: number,
    source: RGBA
) {

    if (
        x < 0 ||
        y < 0 ||
        y >= matrix.length ||
        x >= matrix[0].length
    ) {
        return;
    }


    const destination =
        matrix[y][x];


    const srcAlpha =
        source.a / 255;

    const dstAlpha =
        destination.a / 255;


    const outAlpha =
        srcAlpha +
        dstAlpha *
        (1 - srcAlpha);


    if (outAlpha === 0) {
        return;
    }


    matrix[y][x] = {

        r: Math.round(
            (
                source.r *
                srcAlpha
                +
                destination.r *
                dstAlpha *
                (1 - srcAlpha)
            )
            /
            outAlpha
        ),

        g: Math.round(
            (
                source.g *
                srcAlpha
                +
                destination.g *
                dstAlpha *
                (1 - srcAlpha)
            )
            /
            outAlpha
        ),

        b: Math.round(
            (
                source.b *
                srcAlpha
                +
                destination.b *
                dstAlpha *
                (1 - srcAlpha)
            )
            /
            outAlpha
        ),

        a: Math.round(
            outAlpha * 255
        )
    };
}


function colorForRole(
    role: CuboidPixelRole,
    palette: CuboidPalette,
    surfaceAlpha: number,
    interiorDiagonalAlpha: number,
    interiorVerticalAlpha: number
): RGBA {

    const surfaceA =
        Math.round(
            Math.max(
                0,
                Math.min(
                    1,
                    surfaceAlpha
                )
            ) * 255
        );


    if (role === "top") {
        return {
            ...palette.top,
            a: surfaceA
        };
    }


    if (role === "left") {
        return {
            ...palette.left,
            a: surfaceA
        };
    }


    if (role === "right") {
        return {
            ...palette.right,
            a: surfaceA
        };
    }


    if (role === "outline") {
        return {
            ...palette.outline,
            a: 255
        };
    }


    if (role === "hidden-edge") {
        return {
            ...palette.hiddenEdge,
            a: 255
        };
    }


    if (role === "diagonal-left") {

        const base =
            averageColor(
                palette.top,
                palette.left
            );

        return {
            ...lightenColor(
                base,
                interiorDiagonalAlpha
            ),
            a: 255
        };
    }


    if (role === "diagonal-right") {

        const base =
            averageColor(
                palette.top,
                palette.right
            );

        return {
            ...lightenColor(
                base,
                interiorDiagonalAlpha
            ),
            a: 255
        };
    }


    const base =
        averageColor(
            palette.left,
            palette.right
        );


    return {
        ...lightenColor(
            base,
            interiorVerticalAlpha
        ),
        a: 255
    };
}


export function colorizeCuboidStructure(
    structure: CuboidRasterStructure,
    objects: PrimaryObject[],
    interiorDiagonalAlpha = 0.45,
    interiorVerticalAlpha = 0.25
): PixelMatrix {

    const matrix =
        createBlankMatrix(
            structure.width,
            structure.height
        );


    const appearanceById =
        new Map(
            objects.map(
                object => [

                    object.id,

                    {
                        alpha:
                            object
                                .appearance
                                .alpha,

                        palette:
                            shiftPaletteHue(
                                defaultCuboidPalette,
                                object
                                    .appearance
                                    .hue
                            )
                    }

                ]
            )
        );


    for (
        const command
        of structure.commands
    ) {

        const appearance =
            appearanceById.get(
                command.objectId
            );


        if (!appearance) {
            continue;
        }


        const color =
            colorForRole(
                command.role,
                appearance.palette,
                appearance.alpha,
                interiorDiagonalAlpha,
                interiorVerticalAlpha
            );


        for (
            const index
            of command.indices
        ) {

            const x =
                index %
                structure.width;

            const y =
                Math.floor(
                    index /
                    structure.width
                );


            blendPixel(
                matrix,
                x,
                y,
                color
            );
        }
    }


    return matrix;
}