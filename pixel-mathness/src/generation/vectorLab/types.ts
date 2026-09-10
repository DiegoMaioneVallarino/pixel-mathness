export type Point2D = {
    x: number;
    y: number;
};

export type QuadraticBezierShape = {
    id: string;
    name: string;

    kind: "quadratic-bezier";

    start: Point2D;
    control: Point2D;
    end: Point2D;

    strokeColor: string;
    fillColor: string;

    strokeEnabled: boolean;
    fillEnabled: boolean;
};



export type VectorShape =
    | QuadraticBezierShape
    | LineShape
    | EllipseShape
    | RectangleShape
    | ButterflyShape;

 export type LineShape = {
    id: string;
    name: string;

    kind: "line";

    start: Point2D;
    end: Point2D;

    strokeColor: string;
    fillColor: string;

    strokeEnabled: boolean;
    fillEnabled: boolean;
};   


export type EllipseShape = {
    id: string;
    name: string;

    kind: "ellipse";

    center: Point2D;

    radiusX: number;
    radiusY: number;

    strokeColor: string;
    fillColor: string;

    strokeEnabled: boolean;
    fillEnabled: boolean;
};

export type RectangleShape = {
    id: string;
    name: string;

    kind: "rectangle";

    start: Point2D;
    end: Point2D;

    strokeColor: string;
    fillColor: string;

    strokeEnabled: boolean;
    fillEnabled: boolean;
};


export type ButterflyShape = {
    id: string;
    name: string;

    kind: "butterfly";

    start: Point2D;
    end: Point2D;

    control: Point2D;

    rotation: number;
    scale: number;

    strokeColor: string;
    fillColor: string;

    strokeEnabled: boolean;
    fillEnabled: boolean;
};


export type VectorGroup = {
    id: string;
    name: string;

    shapeIds: string[];

    rotation: number;
    scale: number;
};

export type SpawnTarget =
    | {
        kind: "shape";
        id: string;
    }
    | {
        kind: "group";
        id: string;
    };


export type SpawnRotationMode =
    | "keep"
    | "outward"
    | "inward"
    | "tangent";


export type StarSpawnGenerator = {
    id: string;

    name: string;

    kind: "star-spawn";

    target: SpawnTarget;

    center: Point2D;

    count: number;

    radius: number;

    angleOffset: number;

    scale: number;

    rotationMode:
        SpawnRotationMode;
};


export type ExplosionSpawnGenerator = {
    id: string;

    name: string;

    kind: "explosion-spawn";

    target: SpawnTarget;

    center: Point2D;

    count: number;

    radius: number;

    radiusVariation: number;

    angleOffset: number;

    scale: number;

    smoothness: number;
};


export type SpawnGenerator =
    | StarSpawnGenerator
    | ExplosionSpawnGenerator;


export type SpawnInstance = {
    id: string;

    target: SpawnTarget;

    position: Point2D;

    rotation: number;

    scale: number;
};