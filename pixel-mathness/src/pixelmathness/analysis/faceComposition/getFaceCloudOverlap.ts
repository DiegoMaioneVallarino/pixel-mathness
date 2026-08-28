import type { ColorLayer } from "../separateColorLayers";
import type { AnalyzedFace } from "../../faces/analyzeFaceContents";

import type {
    FaceCloudContribution
} from "./types";


function colorEquals(
    a: {
        r: number;
        g: number;
        b: number;
        a: number;
    },
    b: {
        r: number;
        g: number;
        b: number;
        a: number;
    }
): boolean {

    return (
        a.r === b.r &&
        a.g === b.g &&
        a.b === b.b &&
        a.a === b.a
    );
}


export function getFaceCloudOverlap(
    face: AnalyzedFace,
    cloud: ColorLayer
): FaceCloudContribution {

    let pixelsInsideFace = 0;

    for (const point of face.face.pixels) {

        const pixel =
            cloud.matrix[
                point.y
            ][
                point.x
            ];

        if (
            colorEquals(
                pixel,
                cloud.color
            )
        ) {
            pixelsInsideFace++;
        }
    }


    const faceArea =
        face.face.pixels.length;


    const faceCoverage =
        faceArea === 0
            ? 0
            : pixelsInsideFace /
                faceArea;


    const cloudContainment =
        cloud.pixelCount === 0
            ? 0
            : pixelsInsideFace /
                cloud.pixelCount;


    return {
        cloud,

        pixelsInsideFace,

        cloudPixelCount:
            cloud.pixelCount,

        faceArea,

        faceCoverage,

        cloudContainment
    };
}