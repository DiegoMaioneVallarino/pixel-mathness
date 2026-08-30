export type Vector3 = {
    x: number;
    y: number;
    z: number;
};


export type LightEmitter = {
    id: string;

    x: number;
    y: number;
    z: number;

    direction: Vector3;

    range: number;

    // grados
    coneAngle: number;

    intensity: number;
};


export type CuboidFaceName =
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "front"
    | "back";


export type LightImpact = {
    objectId: string;
    face: CuboidFaceName;

    intensity: number;
};