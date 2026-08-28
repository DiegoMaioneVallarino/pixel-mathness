import type { ColorLayer } from "../separateColorLayers";
import type { AnalyzedFace } from "../../faces/analyzeFaceContents";

export type FaceCloudContribution = {
    cloud: ColorLayer;

    pixelsInsideFace: number;

    cloudPixelCount: number;

    faceArea: number;

    faceCoverage: number;

    cloudContainment: number;
};

export type FaceComposition = {
    face: AnalyzedFace;

    contributions: FaceCloudContribution[];

    coveredPixels: number;

    faceArea: number;

    completeness: number;
};