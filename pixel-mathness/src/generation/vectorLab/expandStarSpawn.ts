import type {
    SpawnInstance,
    StarSpawnGenerator
} from "./types";


export function expandStarSpawn(
    generator: StarSpawnGenerator
): SpawnInstance[] {

    const instances: SpawnInstance[] =
        [];


    const count =
        Math.max(
            1,
            Math.round(
                generator.count
            )
        );


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const normalizedAngle =
            (
                Math.PI *
                2 *
                i
            )
            /
            count;


        const angle =
            normalizedAngle +
            generator.angleOffset;


        const x =
            generator.center.x +
            Math.cos(angle) *
            generator.radius;


        const y =
            generator.center.y +
            Math.sin(angle) *
            generator.radius;


        let rotation =
            0;


        if (
            generator.rotationMode ===
            "outward"
        ) {

            rotation =
                angle *
                180 /
                Math.PI;
        }


        if (
            generator.rotationMode ===
            "inward"
        ) {

            rotation =
                angle *
                180 /
                Math.PI
                +
                180;
        }


        if (
            generator.rotationMode ===
            "tangent"
        ) {

            rotation =
                angle *
                180 /
                Math.PI
                +
                90;
        }


        instances.push({

            id:
                `${generator.id}-${i}`,

            target:
                generator.target,

            position: {
                x,
                y
            },

            rotation,

            scale:
                generator.scale
        });
    }


    return instances;
}