import type { ColorLayer } from "../separateColorLayers";

export type NormalizedColor = {
    r: number;
    g: number;
    b: number;
};

export type IlluminationMember = {
    cloud: ColorLayer;

    luminance: number;

    normalizedColor: NormalizedColor;
};

export type IlluminationFamily = {
    members: IlluminationMember[];

    minLuminance: number;
    maxLuminance: number;
};