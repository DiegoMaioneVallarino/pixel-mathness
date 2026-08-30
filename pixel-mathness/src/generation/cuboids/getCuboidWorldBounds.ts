import type {
    Cuboid
} from "./types";


export type CuboidWorldBounds = {
    minX: number;
    maxX: number;

    minY: number;
    maxY: number;

    minZ: number;
    maxZ: number;
};


export function getCuboidWorldBounds(
    cuboid: Cuboid
): CuboidWorldBounds {

    const sizeX =
        cuboid.width;

    const sizeY =
        cuboid.depth;

    const sizeZ =
        cuboid.height;


    const positionX =
        cuboid.x * 2;

    const positionY =
        cuboid.y * 2;


    return {

        minX:
            positionX -
            sizeX / 2,

        maxX:
            positionX +
            sizeX / 2,


        minY:
            positionY -
            sizeY / 2,

        maxY:
            positionY +
            sizeY / 2,


        minZ:
    cuboid.z,

maxZ:
    cuboid.z +
    sizeZ
    };
}