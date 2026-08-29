export type Point2D = {
    x: number;
    y: number;
};

export type Point3D = {
    x: number;
    y: number;
    z: number;
};


export type Cuboid = {
    x: number;
    y: number;
    z: number;

    width: number;
    depth: number;
    height: number;
};


export type CuboidPartType =
    | "surface"
    | "pillar"
    | "cuboid";


export type CuboidPart = {
    id: string;
    name: string;

    type: CuboidPartType;

    x: number;
    y: number;
    z: number;

    width: number;
    depth: number;
    height: number;
};

export type PrimaryObject = {
    id: string;
    name: string;
    cuboid: Cuboid;
};

export type CompositeObject = {
    id: string;
    name: string;
    children: string[];
};

export type CuboidPixelRole =
    | "background"
    | "top"
    | "left"
    | "right"
    | "outline"
    | "hidden-edge"
    | "diagonal-left"
    | "diagonal-right"
    | "vertical";


export type CuboidRoleMatrix =
    CuboidPixelRole[][];