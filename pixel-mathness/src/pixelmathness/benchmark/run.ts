import { createOutlineLayer } from "../analysis/createOutlineLayer";
import { isOutlineColor } from "../analysis/isOutlineColor";
import { separateColorLayers } from "../analysis/separateColorLayers";
import { detectStrokeFaces } from "../stroke/detectStrokeFaces";
import type { Sample } from "./corpus";
import { score, validateReference } from "./score";

export function runSample(sample: Sample) {
    const { matrix, reference } = sample;
    const width = matrix[0].length;
    validateReference(reference, width, matrix.length);
    const start = performance.now();
    const layers = separateColorLayers(matrix);
    const outline = createOutlineLayer(matrix, layers.filter(layer => isOutlineColor(layer.color)));
    const faces = outline ? detectStrokeFaces(outline) : [];
    const predictions = faces.map(face => face.pixels.map(({x,y}) => y * width + x));
    const elapsedMs = performance.now() - start;
    return { id: sample.id, title: sample.title, style: sample.style, split: sample.split,
        width, height: matrix.length, elapsedMs, predictions, ...score(reference, predictions) };
}

export const reportInfo = { schema: 1, detector: "public-stroke-faces-v1", reference: "visible-interiors-v1", minIoU: 0.5 };
