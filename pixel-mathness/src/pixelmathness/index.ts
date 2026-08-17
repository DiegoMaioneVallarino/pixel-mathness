// =========================
// TYPES
// =========================

export type { Color } from "./types/Color";
export type { PixelMatrix } from "./types/PixelMatrix";
export type { Silhouette } from "./types/Silhouette";


// =========================
// IMAGE
// =========================

export { loadImage } from "./image/loadImage";
export { imageToMatrix } from "./image/imageToMatrix";
export { matrixToCanvas } from "./image/matrixToCanvas";


// =========================
// SILHOUETTE
// =========================

export {
    extractSilhouette
} from "./silhouette/extractSilhouette";

export {
    silhouetteToMatrix
} from "./silhouette/silhouetteToMatrix";


// =========================
// COLOR CLOUDS
// =========================

export {
    separateColorLayers
} from "./analysis/separateColorLayers";

export type {
    ColorLayer
} from "./analysis/separateColorLayers";


// =========================
// ASSEMBLY FAMILIES
// =========================

export {
    createAssemblyFamilies
} from "./families/createAssemblyFamilies";

export type {
    AssemblyFamily
} from "./families/createAssemblyFamilies";


export {
    analyzeStrokeGraph
} from "./stroke/analyzeStrokeGraph";

export type {
    StrokeGraph,
    StrokeNode,
    StrokePoint,
    StrokeNodeType
} from "./stroke/analyzeStrokeGraph";

export {
    strokeGraphToMatrix
} from "./stroke/strokeGraphToMatrix";

export {
    detectStrokeFaces
} from "./stroke/detectStrokeFaces";

export type {
    StrokeFace
} from "./stroke/detectStrokeFaces";

export {
    strokeFacesToMatrix
} from "./stroke/strokeFacesToMatrix";

export {
    analyzeFaceContents,
    analyzeAllFaceContents
} from "./faces/analyzeFaceContents";

export type {
    FaceColorContent,
    AnalyzedFace
} from "./faces/analyzeFaceContents";

export {
    faceToMatrix
} from "./faces/faceToMatrix";