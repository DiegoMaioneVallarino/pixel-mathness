import type {
    PrimaryObject
} from "../cuboids/types";

import type {
    LightEmitter,
    LightImpact
} from "./types";

import {
    getCuboidFaces
} from "./getCuboidFaces";

import {
    dot,
    length,
    normalize,
    subtract
} from "./vector3";


export function calculateLightImpacts(
    light: LightEmitter,
    objects: PrimaryObject[]
): LightImpact[] {

    const impacts:
        LightImpact[] = [];


    const lightDirection =
        normalize(
            light.direction
        );


    const halfAngle =
        light.coneAngle / 2;


    const minimumConeDot =
        Math.cos(
            halfAngle *
            Math.PI /
            180
        );


    for (
        const object
        of objects
    ) {

        const faces =
            getCuboidFaces(
                object.cuboid
            );


        for (
            const face
            of faces
        ) {

            // vector:
            // luz -> cara

            const toFace =
                subtract(
                    face.center,
                    {
                        x: light.x,
                        y: light.y,
                        z: light.z
                    }
                );


            const distance =
                length(
                    toFace
                );


            // 1. FUERA DEL RANGO

            if (
                distance >
                light.range
            ) {
                continue;
            }


            const directionToFace =
                normalize(
                    toFace
                );


            // 2. FUERA DEL CONO

            const coneDot =
                dot(
                    lightDirection,
                    directionToFace
                );


            if (
                coneDot <
                minimumConeDot
            ) {
                continue;
            }


            // vector:
            // cara -> luz

            const directionToLight = {
                x:
                    -directionToFace.x,

                y:
                    -directionToFace.y,

                z:
                    -directionToFace.z
            };


            // 3. ¿LA CARA MIRA HACIA LA LUZ?

            const facing =
                dot(
                    face.normal,
                    directionToLight
                );


            if (
                facing <= 0
            ) {
                continue;
            }


            // caída por distancia

            const distanceFactor =
                Math.max(
                    0,
                    1 -
                    distance /
                    light.range
                );


            // intensidad según orientación

            const orientationFactor =
                facing;


            const intensity =
                distanceFactor *
                orientationFactor *
                light.intensity;


            impacts.push({
                objectId:
                    object.id,

                face:
                    face.name,

                intensity
            });
        }
    }


    return impacts;
}