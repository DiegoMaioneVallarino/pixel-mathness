import type { Color } from "../../pixelmathness/types/Color";

export type Texture =
    | {
        type: "solid";
        color: Color;
    }

    | {
        type: "inline";

        baseColor: Color;

        offsetX: number;
        offsetY: number;

        bands: {
            minDistance: number;
            maxDistance: number;
            color: Color;
        }[];
    };