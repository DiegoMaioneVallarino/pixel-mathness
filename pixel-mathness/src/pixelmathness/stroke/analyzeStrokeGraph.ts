import type { ColorLayer } from "../analysis/separateColorLayers";

export type StrokePoint = {
    x: number;
    y: number;
};

export type StrokeNodeType =
    | "endpoint"
    | "path"
    | "junction"
    | "isolated";

export type StrokeNode = {
    x: number;
    y: number;
    degree: number;
    type: StrokeNodeType;
};

export type StrokeGraph = {
    pixels: StrokePoint[];
    nodes: StrokeNode[];

    endpoints: StrokeNode[];
    pathPoints: StrokeNode[];
    junctions: StrokeNode[];
    isolated: StrokeNode[];
};

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

function key(x: number, y: number) {
    return `${x},${y}`;
}

export function analyzeStrokeGraph(
    strokeLayer: ColorLayer
): StrokeGraph {

    const strokePixels: StrokePoint[] = [];

    const strokeSet = new Set<string>();

    // Sacamos únicamente las posiciones reales
    // de esta Color Cloud.
    for (
        let y = 0;
        y < strokeLayer.matrix.length;
        y++
    ) {
        for (
            let x = 0;
            x < strokeLayer.matrix[y].length;
            x++
        ) {
            const pixel =
                strokeLayer.matrix[y][x];

            const sameColor =
                pixel.r === strokeLayer.color.r &&
                pixel.g === strokeLayer.color.g &&
                pixel.b === strokeLayer.color.b &&
                pixel.a === strokeLayer.color.a;

            if (!sameColor) continue;

            const point = { x, y };

            strokePixels.push(point);
            strokeSet.add(key(x, y));
        }
    }

    const nodes: StrokeNode[] = [];

    for (const point of strokePixels) {

        let degree = 0;

        for (const [dx, dy] of NEIGHBORS_8) {

            const nx = point.x + dx;
            const ny = point.y + dy;

            if (
                strokeSet.has(
                    key(nx, ny)
                )
            ) {
                degree++;
            }
        }

        let type: StrokeNodeType;

        if (degree === 0) {
            type = "isolated";
        }
        else if (degree === 1) {
            type = "endpoint";
        }
        else if (degree === 2) {
            type = "path";
        }
        else {
            type = "junction";
        }

        nodes.push({
            x: point.x,
            y: point.y,
            degree,
            type
        });
    }

    return {
        pixels: strokePixels,
        nodes,

        endpoints:
            nodes.filter(
                node =>
                    node.type === "endpoint"
            ),

        pathPoints:
            nodes.filter(
                node =>
                    node.type === "path"
            ),

        junctions:
            nodes.filter(
                node =>
                    node.type === "junction"
            ),

        isolated:
            nodes.filter(
                node =>
                    node.type === "isolated"
            )
    };
}