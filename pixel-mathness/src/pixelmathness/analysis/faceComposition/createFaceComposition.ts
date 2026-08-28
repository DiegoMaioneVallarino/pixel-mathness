import type {
    ColorLayer
} from "../separateColorLayers";

import type {
    AnalyzedFace
} from "../../faces/analyzeFaceContents";

import type {
    FaceComposition
} from "./types";

import {
    getFaceCloudOverlap
} from "./getFaceCloudOverlap";


export function createFaceComposition(
    face: AnalyzedFace,
    clouds: ColorLayer[]
): FaceComposition {

    const contributions =
        clouds
            .map(
                cloud =>
                    getFaceCloudOverlap(
                        face,
                        cloud
                    )
            )

            .filter(
                contribution =>
                    contribution.pixelsInsideFace >
                    0
            )

            .sort(
                (a, b) =>
                    b.pixelsInsideFace -
                    a.pixelsInsideFace
            );


    const coveredPixels =
        contributions.reduce(
            (
                total,
                contribution
            ) =>
                total +
                contribution
                    .pixelsInsideFace,

            0
        );


    const faceArea =
        face.face.pixels.length;


    const completeness =
        faceArea === 0
            ? 0
            : coveredPixels /
                faceArea;


    return {
        face,

        contributions,

        coveredPixels,

        faceArea,

        completeness
    };
}