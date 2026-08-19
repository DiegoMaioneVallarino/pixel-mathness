export type Point = {
    x: number;
    y: number;
};

export type SubgroupKind =
    | "pixel"
    | "line"
    | "stroke"
    | "solid";

export type LineKind =
    | "straight"
    | "curve"
    | "loop";

export type Subgroup = {
    pixels: Point[];

    pixelCount: number;

    borderPixelCount: number;
    borderRatio: number;

    kind: SubgroupKind;

    lineKind?: LineKind;

    angle?: number;
    straightness?: number;
};