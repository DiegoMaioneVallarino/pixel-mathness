import type { Color } from "../../types/Color";

import type {
    NormalizedColor
} from "./types";


export type IlluminationDescriptor = {
    luminance: number;
    normalizedColor: NormalizedColor;
};


export function getIlluminationDescriptor(
    color: Color
): IlluminationDescriptor {

    const {
        r,
        g,
        b
    } = color;


    const luminance =
        0.2126 * r +
        0.7152 * g +
        0.0722 * b;


    const sum =
        r + g + b;


    const normalizedColor =
        sum === 0
            ? {
                r: 0,
                g: 0,
                b: 0
            }
            : {
                r: r / sum,
                g: g / sum,
                b: b / sum
            };


    return {
        luminance,
        normalizedColor
    };
}