import type {
    ColorLayer
} from "../separateColorLayers";

import type {
    IlluminationFamily,
    IlluminationMember
} from "./types";

import {
    getIlluminationDescriptor
} from "./getIlluminationDescriptor";

import {
    getMaterialSimilarity
} from "./getMaterialSimilarity";


export function createIlluminationFamilies(
    layers: ColorLayer[],
    similarityThreshold = 0.08
): IlluminationFamily[] {

    const members:
        IlluminationMember[] =
        layers.map(
            cloud => {

                const descriptor =
                    getIlluminationDescriptor(
                        cloud.color
                    );

                return {
                    cloud,

                    luminance:
                        descriptor.luminance,

                    normalizedColor:
                        descriptor.normalizedColor
                };
            }
        );


    const available =
        [...members];

    const families:
        IlluminationFamily[] =
        [];


    while (
        available.length > 0
    ) {

        const seed =
            available.shift()!;

        const familyMembers:
            IlluminationMember[] =
            [seed];


        for (
            let i =
                available.length - 1;

            i >= 0;

            i--
        ) {

            const candidate =
                available[i];

            const similarity =
                getMaterialSimilarity(
                    seed.normalizedColor,
                    candidate.normalizedColor
                );


            if (
                similarity <=
                similarityThreshold
            ) {

                familyMembers.push(
                    candidate
                );

                available.splice(
                    i,
                    1
                );
            }
        }


        // claro -> oscuro
        familyMembers.sort(
            (a, b) =>
                b.luminance -
                a.luminance
        );


        families.push({
            members:
                familyMembers,

            minLuminance:
                Math.min(
                    ...familyMembers.map(
                        member =>
                            member.luminance
                    )
                ),

            maxLuminance:
                Math.max(
                    ...familyMembers.map(
                        member =>
                            member.luminance
                    )
                )
        });
    }


    return families;
}