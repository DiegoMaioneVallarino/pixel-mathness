import type { Color } from "../types/Color";
import type { PixelMatrix } from "../types/PixelMatrix";

import type {
    AssemblyFace,
    ClosureResult
} from "./types";

// =========================
// VISUALIZACIÓN DE DEBUG
// =========================

const WHITE: Color = { r: 255, g: 255, b: 255, a: 255 };
const BLACK: Color = { r: 0, g: 0, b: 0, a: 255 };
const MAGENTA: Color = { r: 255, g: 0, b: 220, a: 255 };
const OPEN_GRAY: Color = { r: 215, g: 215, b: 215, a: 255 };
const VOID_BLUE: Color = { r: 225, g: 235, b: 255, a: 255 };
const HIGHLIGHT: Color = { r: 255, g: 235, b: 59, a: 255 };

// pastel: caras que ya cerraba el contorno
const BASELINE_COLORS: Color[] = [
    { r: 255, g: 205, b: 205, a: 255 },
    { r: 205, g: 225, b: 255, a: 255 },
    { r: 205, g: 240, b: 215, a: 255 },
    { r: 255, g: 235, b: 190, a: 255 },
    { r: 225, g: 205, b: 255, a: 255 },
];

// saturado: caras ganadas por el cierre
const CLOSURE_COLORS: Color[] = [
    { r: 230, g: 60, b: 60, a: 255 },
    { r: 40, g: 130, b: 240, a: 255 },
    { r: 30, g: 170, b: 80, a: 255 },
    { r: 240, g: 150, b: 20, a: 255 },
    { r: 140, g: 60, b: 220, a: 255 },
    { r: 0, g: 170, b: 170, a: 255 },
];

export type ClosureViewMode =
    | "before"
    | "after";

export type ClosureViewOptions = {
    mode: ClosureViewMode;

    // cara resaltada (id en result.faces)
    highlightFaceId?: number | null;
};

function blank(
    width: number,
    height: number,
    color: Color
): PixelMatrix {

    return Array.from(
        { length: height },
        () =>
            Array.from(
                { length: width },
                () => ({ ...color })
            )
    );
}

export function closureToMatrix(
    result: ClosureResult,
    original: PixelMatrix,
    view: ClosureViewOptions
): PixelMatrix {

    const { width, height } = result;

    const matrix = blank(width, height, WHITE);

    const highlight = view.highlightFaceId ?? null;

    const highlightFace =
        highlight === null
            ? null
            : result.faces[highlight] ?? null;

    for (let p = 0; p < width * height; p++) {

        const x = p % width;
        const y = (p - x) / width;

        const faceId = result.faceOf[p];

        const face =
            faceId >= 0
                ? result.faces[faceId]
                : null;

        const showFace =
            face !== null &&
            (
                view.mode === "after" ||
                face.source === "outline"
            );

        let color: Color;

        if (result.outlineMask[p]) {
            color = BLACK;
        }
        else if (
            result.closerMask[p] &&
            view.mode === "after"
        ) {
            color = MAGENTA;
        }
        else if (face && showFace) {

            if (face.kind === "void") {
                color = VOID_BLUE;
            }
            else if (face.source === "outline") {
                color =
                    BASELINE_COLORS[
                        face.id % BASELINE_COLORS.length
                    ];
            }
            else {
                color =
                    CLOSURE_COLORS[
                        face.id % CLOSURE_COLORS.length
                    ];
            }
        }
        else if (original[y][x].a > 0) {
            color = OPEN_GRAY;
        }
        else {
            color = WHITE;
        }

        matrix[y][x] = { ...color };
    }

    // cara seleccionada: encima, con su tapón
    if (highlightFace && view.mode === "after") {

        for (const p of highlightFace.pixels) {

            const x = p % width;

            matrix[(p - x) / width][x] = { ...HIGHLIGHT };
        }
    }

    return matrix;
}

// Recorte de UNA cara con su contexto real:
// contenido original + contorno negro + tapón magenta.
export function closureFaceToMatrix(
    result: ClosureResult,
    face: AssemblyFace,
    original: PixelMatrix,
    margin = 2
): PixelMatrix {

    const { width, height } = result;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const p of face.pixels) {

        const x = p % width;
        const y = (p - x) / width;

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    minX = Math.max(0, minX - margin);
    minY = Math.max(0, minY - margin);
    maxX = Math.min(width - 1, maxX + margin);
    maxY = Math.min(height - 1, maxY + margin);

    const crop = blank(
        maxX - minX + 1,
        maxY - minY + 1,
        WHITE
    );

    const own = new Set<number>(face.pixels);

    const myClosers = new Set<number>();

    for (const id of face.closerIds) {
        for (const p of result.closers[id].pixels) {
            myClosers.add(p);
        }
    }

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {

            const p = y * width + x;

            let color: Color = WHITE;

            if (myClosers.has(p)) {
                color = MAGENTA;
            }
            else if (own.has(p)) {
                color = original[y][x];
            }
            else if (result.outlineMask[p]) {
                color = BLACK;
            }

            crop[y - minY][x - minX] = { ...color };
        }
    }

    return crop;
}
