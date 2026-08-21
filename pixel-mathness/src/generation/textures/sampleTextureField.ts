import type {
    TextureField
} from "../types/TextureField";

export function sampleTextureField(
    field: TextureField,
    u: number,
    v: number
): number {

    const clampedU =
        Math.max(
            0,
            Math.min(1, u)
        );

    const clampedV =
        Math.max(
            0,
            Math.min(1, v)
        );

    const x =
        clampedU *
        (field.width - 1);

    const y =
        clampedV *
        (field.height - 1);

    const x0 =
        Math.floor(x);

    const y0 =
        Math.floor(y);

    const x1 =
        Math.min(
            x0 + 1,
            field.width - 1
        );

    const y1 =
        Math.min(
            y0 + 1,
            field.height - 1
        );

    const tx =
        x - x0;

    const ty =
        y - y0;

    const a =
        field.values[y0][x0];

    const b =
        field.values[y0][x1];

    const c =
        field.values[y1][x0];

    const d =
        field.values[y1][x1];

    const top =
        a * (1 - tx) +
        b * tx;

    const bottom =
        c * (1 - tx) +
        d * tx;

    return (
        top * (1 - ty) +
        bottom * ty
    );
}