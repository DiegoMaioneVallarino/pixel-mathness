import type { TextureField } from "../types/TextureField";

export function createTextureField(
    width = 32,
    height = 32
): TextureField {

    const values =
        Array.from(
            { length: height },
            (_, y) =>
                Array.from(
                    { length: width },
                    (_, x) => {

                        const u =
                            x /
                            (width - 1);

                        const v =
                            y /
                            (height - 1);

                        const dx =
                            u - 0.5;

                        const dy =
                            v - 0.5;

                        const distance =
                            Math.sqrt(
                                dx * dx +
                                dy * dy
                            );

                        const value =
                            1 -
                            Math.min(
                                distance * 2,
                                1
                            );

                        return value;
                    }
                )
        );

    return {
        width,
        height,
        values
    };
}