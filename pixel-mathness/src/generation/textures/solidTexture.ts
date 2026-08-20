import type { Color } from "../../pixelmathness/types/Color";
import type { Texture } from "../types/Texture";

export function solidTexture(
    color: Color
): Texture {

    return {
        type: "solid",
        color
    };
}