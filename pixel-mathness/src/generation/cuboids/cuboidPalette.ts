export type RGBColor = {
    r: number;
    g: number;
    b: number;
};

export type CuboidPalette = {
    top: RGBColor;
    left: RGBColor;
    right: RGBColor;

    outline: RGBColor;

    hiddenEdge: RGBColor;
};export const defaultCuboidPalette:
    CuboidPalette = {

    top: {
        r: 238,
        g: 86,
        b: 98
    },

    left: {
        r: 235,
        g: 39,
        b: 48
    },

    right: {
        r: 205,
        g: 20,
        b: 28
    },

    outline: {
        r: 0,
        g: 0,
        b: 0
    },

    hiddenEdge: {
        r: 255,
        g: 90,
        b: 100
    }
};

function rgbToHsl(
    color: RGBColor
): {
    h: number;
    s: number;
    l: number;
} {

    const r = color.r / 255;
    const g = color.g / 255;
    const b = color.b / 255;

    const max =
        Math.max(r, g, b);

    const min =
        Math.min(r, g, b);

    let h = 0;
    let s = 0;

    const l =
        (max + min) / 2;

    const delta =
        max - min;


    if (delta !== 0) {

        s =
            delta /
            (
                1 -
                Math.abs(
                    2 * l - 1
                )
            );


        if (max === r) {

            h =
                60 *
                (
                    (
                        (g - b) /
                        delta
                    ) % 6
                );

        } else if (max === g) {

            h =
                60 *
                (
                    (b - r) /
                    delta +
                    2
                );

        } else {

            h =
                60 *
                (
                    (r - g) /
                    delta +
                    4
                );
        }
    }


    if (h < 0) {
        h += 360;
    }


    return {
        h,
        s,
        l
    };
}

function hslToRgb(
    h: number,
    s: number,
    l: number
): RGBColor {

    const c =
        (1 - Math.abs(2 * l - 1)) *
        s;

    const x =
        c *
        (
            1 -
            Math.abs(
                (
                    h / 60
                ) % 2 - 1
            )
        );

    const m =
        l - c / 2;


    let r = 0;
    let g = 0;
    let b = 0;


    if (h < 60) {

        r = c;
        g = x;

    } else if (h < 120) {

        r = x;
        g = c;

    } else if (h < 180) {

        g = c;
        b = x;

    } else if (h < 240) {

        g = x;
        b = c;

    } else if (h < 300) {

        r = x;
        b = c;

    } else {

        r = c;
        b = x;
    }


    return {
        r: Math.round(
            (r + m) * 255
        ),

        g: Math.round(
            (g + m) * 255
        ),

        b: Math.round(
            (b + m) * 255
        )
    };
}

function shiftColorHue(
    color: RGBColor,
    degrees: number
): RGBColor {

    const hsl =
        rgbToHsl(color);

    const newHue =
        (
            hsl.h +
            degrees
        ) % 360;


    return hslToRgb(
        newHue < 0
            ? newHue + 360
            : newHue,

        hsl.s,
        hsl.l
    );
}

export function shiftPaletteHue(
    palette: CuboidPalette,
    degrees: number
): CuboidPalette {

    return {
        top:
            shiftColorHue(
                palette.top,
                degrees
            ),

        left:
            shiftColorHue(
                palette.left,
                degrees
            ),

        right:
            shiftColorHue(
                palette.right,
                degrees
            ),

        outline:
            palette.outline,

        hiddenEdge:
            shiftColorHue(
                palette.hiddenEdge,
                degrees
            )
    };
}