import type { Point } from "./types";

export type LineGeometry = {
    angle: number;
    straightness: number;
};

export function analyzeLineGeometry(
    pixels: Point[]
): LineGeometry {

    if (pixels.length <= 1) {
        return {
            angle: 0,
            straightness: 1
        };
    }

    // -------------------------
    // 1. Centroide
    // -------------------------

    let meanX = 0;
    let meanY = 0;

    for (const pixel of pixels) {
        meanX += pixel.x;
        meanY += pixel.y;
    }

    meanX /= pixels.length;
    meanY /= pixels.length;


    // -------------------------
    // 2. Matriz de covarianza
    // -------------------------

    let xx = 0;
    let yy = 0;
    let xy = 0;

    for (const pixel of pixels) {

        const dx =
            pixel.x - meanX;

        const dy =
            pixel.y - meanY;

        xx += dx * dx;
        yy += dy * dy;
        xy += dx * dy;
    }

    xx /= pixels.length;
    yy /= pixels.length;
    xy /= pixels.length;


    // -------------------------
    // 3. Eigenvalues
    // -------------------------

    const trace =
        xx + yy;

    const discriminant =
        Math.sqrt(
            (xx - yy) * (xx - yy) +
            4 * xy * xy
        );

    const lambda1 =
        (trace + discriminant) / 2;

    const lambda2 =
        (trace - discriminant) / 2;


    // -------------------------
    // 4. Orientación principal
    // -------------------------

    const angleRadians =
        0.5 *
        Math.atan2(
            2 * xy,
            xx - yy
        );

    let angle =
        angleRadians *
        180 /
        Math.PI;

    // Como una línea a 0° y 180°
    // representa el mismo eje:
    if (angle < 0) {
        angle += 180;
    }


    // -------------------------
    // 5. Straightness
    // -------------------------

    const straightness =
        lambda1 <= 0
            ? 1
            : 1 - (
                lambda2 /
                lambda1
            );

    return {
        angle,
        straightness
    };
}