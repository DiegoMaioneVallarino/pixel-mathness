import type { Shape } from "../types/Shape";

export function containsPoint(
    shape: Shape,
    x: number,
    y: number
): boolean {

    const dx =
        x - shape.centerX;

    const dy =
        y - shape.centerY;

    const angle =
        -shape.rotation *
        Math.PI /
        180;

    const cos =
        Math.cos(angle);

    const sin =
        Math.sin(angle);

    const localX =
        dx * cos -
        dy * sin;

    const localY =
        dx * sin +
        dy * cos;

    const radiusX =
        shape.width / 2;

    const radiusY =
        shape.height / 2;

    const normalized =
        (
            localX * localX /
            (radiusX * radiusX)
        ) +
        (
            localY * localY /
            (radiusY * radiusY)
        );

    return normalized <= 1;
}