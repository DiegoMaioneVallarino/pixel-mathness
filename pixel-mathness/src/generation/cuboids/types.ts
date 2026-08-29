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

    appearance: {
        alpha: number;
        hue: number;
    };
};

export type CompositeObject = {
    id: string;
    name: string;
    children: string[];
};

export type CuboidPixelRole =
    | "top"
    | "left"
    | "right"
    | "outline"
    | "hidden-edge"
    | "diagonal-left"
    | "diagonal-right"
    | "vertical";

export type CuboidRasterCommand = {
    objectId: string;
    role: CuboidPixelRole;
    indices: number[];
};

export type CuboidRasterStructure = {
    width: number;
    height: number;
    commands: CuboidRasterCommand[];
};


export type CuboidRoleMatrix =
    CuboidPixelRole[][];