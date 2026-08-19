import type { Color } from "../types/Color";

export function isOutlineColor(
    color: Color,
    threshold = 40
): boolean {

    // Luminancia perceptual
    const luminance =
        0.2126 * color.r +
        0.7152 * color.g +
        0.0722 * color.b;

    return luminance <= threshold;
}