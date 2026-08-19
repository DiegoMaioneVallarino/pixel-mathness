import type { PixelMatrix } from "../types/PixelMatrix";
import type { Color } from "../types/Color";
import type { ColorLayer } from "../analysis/separateColorLayers";

const NEIGHBORS_8 = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
] as const;


// =========================
// TYPES
// =========================

export type AssemblyNode = {
    id: string;

    // Color Clouds originales que contiene
    clouds: ColorLayer[];

    // Matriz combinada
    matrix: PixelMatrix;

    // Cantidad total de píxeles reales
    pixelCount: number;
};


export type AssemblyPair = {
    nodeA: AssemblyNode;
    nodeB: AssemblyNode;

    contactPixels: number;

    result: AssemblyNode;
};


export type AssemblyLevel = {
    level: number;

    inputCount: number;

    pairs: AssemblyPair[];

    // Si el número era impar,
    // este nodo pasa directamente
    // al siguiente nivel.
    carry?: AssemblyNode;

    output: AssemblyNode[];
};


export type AssemblyHierarchy = {
    levels: AssemblyLevel[];

    root: AssemblyNode | null;
};


// =========================
// HELPERS
// =========================

function sameColor(
    a: Color,
    b: Color
): boolean {
    return (
        a.r === b.r &&
        a.g === b.g &&
        a.b === b.b &&
        a.a === b.a
    );
}


function key(
    x: number,
    y: number
): string {
    return `${x},${y}`;
}


// =========================
// NODE PIXELS
// =========================

function getNodePixelSet(
    node: AssemblyNode
): Set<string> {

    const result =
        new Set<string>();

    for (
        let y = 0;
        y < node.matrix.length;
        y++
    ) {
        for (
            let x = 0;
            x < node.matrix[y].length;
            x++
        ) {

            const pixel =
                node.matrix[y][x];

            // Blanco = vacío visual
            const isWhite =
                pixel.r === 255 &&
                pixel.g === 255 &&
                pixel.b === 255 &&
                pixel.a === 255;

            if (!isWhite) {
                result.add(
                    key(x, y)
                );
            }
        }
    }

    return result;
}


// =========================
// OUTER OUTLINE
// =========================

function getOuterOutline(
    node: AssemblyNode
): Set<string> {

    const height =
        node.matrix.length;

    const width =
        node.matrix[0].length;

    const pixels =
        getNodePixelSet(node);

    const outline =
        new Set<string>();

    for (const position of pixels) {

        const [xs, ys] =
            position.split(",");

        const x = Number(xs);
        const y = Number(ys);

        for (
            const [dx, dy]
            of NEIGHBORS_8
        ) {

            const nx = x + dx;
            const ny = y + dy;

            if (
                nx < 0 ||
                ny < 0 ||
                nx >= width ||
                ny >= height
            ) {
                continue;
            }

            const neighborKey =
                key(nx, ny);

            // El outline está afuera
            // del conjunto.
            if (
                !pixels.has(
                    neighborKey
                )
            ) {
                outline.add(
                    neighborKey
                );
            }
        }
    }

    return outline;
}


// =========================
// CONTACT
// =========================

function getContactPixels(
    nodeA: AssemblyNode,
    nodeB: AssemblyNode
): number {

    const outlineA =
        getOuterOutline(nodeA);

    const pixelsB =
        getNodePixelSet(nodeB);

    let contact = 0;

    for (
        const position
        of outlineA
    ) {

        if (
            pixelsB.has(position)
        ) {
            contact++;
        }
    }

    return contact;
}


// =========================
// MERGE MATRICES
// =========================

function mergeMatrices(
    matrixA: PixelMatrix,
    matrixB: PixelMatrix
): PixelMatrix {

    const height =
        matrixA.length;

    const width =
        matrixA[0].length;

    const result: PixelMatrix =
        [];

    for (
        let y = 0;
        y < height;
        y++
    ) {

        const row = [];

        for (
            let x = 0;
            x < width;
            x++
        ) {

            const a =
                matrixA[y][x];

            const b =
                matrixB[y][x];

            const aIsWhite =
                a.r === 255 &&
                a.g === 255 &&
                a.b === 255 &&
                a.a === 255;

            const bIsWhite =
                b.r === 255 &&
                b.g === 255 &&
                b.b === 255 &&
                b.a === 255;


            if (!aIsWhite) {
                row.push({
                    ...a
                });
            }
            else if (!bIsWhite) {
                row.push({
                    ...b
                });
            }
            else {
                row.push({
                    r: 255,
                    g: 255,
                    b: 255,
                    a: 255
                });
            }
        }

        result.push(row);
    }

    return result;
}


// =========================
// INITIAL NODES
// =========================

function createInitialNodes(
    layers: ColorLayer[]
): AssemblyNode[] {

    return layers.map(
        (layer, index) => ({
            id: `C${index + 1}`,

            clouds: [
                layer
            ],

            matrix:
                layer.matrix,

            pixelCount:
                layer.pixelCount
        })
    );
}


// =========================
// MERGE NODES
// =========================

function mergeNodes(
    a: AssemblyNode,
    b: AssemblyNode,
    level: number,
    pairIndex: number
): AssemblyNode {

    return {
        id:
            `L${level}-P${pairIndex}`,

        clouds: [
            ...a.clouds,
            ...b.clouds
        ],

        matrix:
            mergeMatrices(
                a.matrix,
                b.matrix
            ),

        pixelCount:
            a.pixelCount +
            b.pixelCount
    };
}


// =========================
// COMPLETE HIERARCHY
// =========================

export function createAssemblyHierarchy(
    layers: ColorLayer[]
): AssemblyHierarchy {

    let candidates =
        createInitialNodes(
            layers
        );

    const levels:
        AssemblyLevel[] = [];

    let levelIndex = 1;


    while (
        candidates.length > 1
    ) {

        const available =
            [...candidates];

        const pairs:
            AssemblyPair[] = [];

        const output:
            AssemblyNode[] = [];

        let pairIndex = 1;


        // =====================
        // GREEDY MATCHING
        // =====================

        while (
            available.length >= 2
        ) {

            const nodeA =
                available[0];

            let bestIndex = 1;

            let bestContact =
                -1;


            for (
                let i = 1;
                i < available.length;
                i++
            ) {

                const nodeB =
                    available[i];

                const contact =
                    getContactPixels(
                        nodeA,
                        nodeB
                    );


                if (
                    contact >
                    bestContact
                ) {
                    bestContact =
                        contact;

                    bestIndex = i;
                }
            }


            const nodeB =
                available[
                    bestIndex
                ];


            const merged =
                mergeNodes(
                    nodeA,
                    nodeB,
                    levelIndex,
                    pairIndex
                );


            pairs.push({
                nodeA,
                nodeB,

                contactPixels:
                    bestContact,

                result:
                    merged
            });


            output.push(
                merged
            );


            // eliminar B
            available.splice(
                bestIndex,
                1
            );

            // eliminar A
            available.splice(
                0,
                1
            );

            pairIndex++;
        }


        // =====================
        // IMPAR → CARRY
        // =====================

        let carry:
            AssemblyNode |
            undefined;


        if (
            available.length === 1
        ) {

            carry =
                available[0];

            output.push(
                carry
            );
        }


        levels.push({
            level:
                levelIndex,

            inputCount:
                candidates.length,

            pairs,

            carry,

            output
        });


        candidates =
            output;

        levelIndex++;
    }


    return {
        levels,

        root:
            candidates[0] ??
            null
    };
}