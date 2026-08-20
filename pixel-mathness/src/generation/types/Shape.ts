export type ShapeType =
    | "ellipse";

export type Shape = {
    type: ShapeType;

    centerX: number;
    centerY: number;

    width: number;
    height: number;

    rotation: number;
};