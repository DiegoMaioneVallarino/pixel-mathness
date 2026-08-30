import type {
    Cuboid
} from "../cuboids/types";

import {
    getCuboidWorldBounds
} from "../cuboids/getCuboidWorldBounds";

import type {
    CuboidFaceName,
    Vector3
} from "./types";


export type CuboidFace = {
    name: CuboidFaceName;
    center: Vector3;
    normal: Vector3;
};


export function getCuboidFaces(
    cuboid: Cuboid
): CuboidFace[] {

    const bounds =
        getCuboidWorldBounds(
            cuboid
        );


    const centerX =
        (
            bounds.minX +
            bounds.maxX
        ) / 2;

    const centerY =
        (
            bounds.minY +
            bounds.maxY
        ) / 2;

    const centerZ =
        (
            bounds.minZ +
            bounds.maxZ
        ) / 2;


    return [

        {
            name: "top",

            center: {
                x: centerX,
                y: centerY,
                z: bounds.maxZ
            },

            normal: {
                x: 0,
                y: 0,
                z: 1
            }
        },


        {
            name: "bottom",

            center: {
                x: centerX,
                y: centerY,
                z: bounds.minZ
            },

            normal: {
                x: 0,
                y: 0,
                z: -1
            }
        },


        {
            name: "right",

            center: {
                x: bounds.maxX,
                y: centerY,
                z: centerZ
            },

            normal: {
                x: 1,
                y: 0,
                z: 0
            }
        },


        {
            name: "left",

            center: {
                x: bounds.minX,
                y: centerY,
                z: centerZ
            },

            normal: {
                x: -1,
                y: 0,
                z: 0
            }
        },


        {
            name: "front",

            center: {
                x: centerX,
                y: bounds.maxY,
                z: centerZ
            },

            normal: {
                x: 0,
                y: 1,
                z: 0
            }
        },


        {
            name: "back",

            center: {
                x: centerX,
                y: bounds.minY,
                z: centerZ
            },

            normal: {
                x: 0,
                y: -1,
                z: 0
            }
        }

    ];
}