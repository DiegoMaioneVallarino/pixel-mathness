import type { Color } from "../types/Color";
import type { PixelMatrix } from "../types/PixelMatrix";

// =========================
// LABEL MAP
// =========================
// Una sola pasada convierte la PixelMatrix en:
//
//   labels[y * width + x] = índice de paleta   (o -1 si a === 0)
//
// La paleta está ordenada de MAYOR a MENOR cantidad de píxeles
// (empates: orden de primera aparición), exactamente igual que el
// orden de separateColorLayers. Por eso:
//
//   layers[i].index === i === índice en labelMap.palette

export type LabelMap = {
    width: number;
    height: number;

    labels: Int32Array;

    palette: Color[];
    counts: Int32Array;

    // píxeles con a > 0
    opaqueCount: number;
};

export function buildLabelMap(
    matrix: PixelMatrix
): LabelMap {

    const height = matrix.length;
    const width = height === 0 ? 0 : matrix[0].length;

    const labels = new Int32Array(width * height);

    const provisionalId = new Map<number, number>();
    const provisionalColors: Color[] = [];
    const provisionalCounts: number[] = [];

    let opaqueCount = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {

            const pixel = matrix[y][x];
            const p = y * width + x;

            if (pixel.a === 0) {
                labels[p] = -1;
                continue;
            }

            // r,g,b,a caben en 32 bits
            const packed = (
                (pixel.r << 24) |
                (pixel.g << 16) |
                (pixel.b << 8) |
                pixel.a
            ) >>> 0;

            let id = provisionalId.get(packed);

            if (id === undefined) {
                id = provisionalColors.length;

                provisionalId.set(packed, id);

                provisionalColors.push({
                    r: pixel.r,
                    g: pixel.g,
                    b: pixel.b,
                    a: pixel.a
                });

                provisionalCounts.push(0);
            }

            provisionalCounts[id]++;
            labels[p] = id;
            opaqueCount++;
        }
    }

    // Ordenar por cantidad (sort estable => empates por aparición)
    const order = provisionalColors.map((_, i) => i);

    order.sort(
        (a, b) =>
            provisionalCounts[b] -
            provisionalCounts[a]
    );

    const remap = new Int32Array(order.length);

    order.forEach((oldId, newId) => {
        remap[oldId] = newId;
    });

    for (let p = 0; p < labels.length; p++) {
        if (labels[p] >= 0) {
            labels[p] = remap[labels[p]];
        }
    }

    return {
        width,
        height,
        labels,
        palette: order.map(i => provisionalColors[i]),
        counts: Int32Array.from(
            order.map(i => provisionalCounts[i])
        ),
        opaqueCount
    };
}
