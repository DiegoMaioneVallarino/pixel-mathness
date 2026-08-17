import type { PixelMatrix } from "../types/PixelMatrix";
import type { StrokeGraph } from "./analyzeStrokeGraph";

export function strokeGraphToMatrix(
    graph: StrokeGraph,
    width: number,
    height: number
): PixelMatrix {

    const matrix: PixelMatrix =
        Array.from(
            { length: height },
            () =>
                Array.from(
                    { length: width },
                    () => ({
                        r: 255,
                        g: 255,
                        b: 255,
                        a: 255
                    })
                )
        );

    // Stroke normal: negro
    for (const point of graph.pathPoints) {
        matrix[point.y][point.x] = {
            r: 0,
            g: 0,
            b: 0,
            a: 255
        };
    }

    // Endpoints: rojo
    for (const point of graph.endpoints) {
        matrix[point.y][point.x] = {
            r: 255,
            g: 0,
            b: 0,
            a: 255
        };
    }

    // Junctions: azul
    for (const point of graph.junctions) {
        matrix[point.y][point.x] = {
            r: 0,
            g: 0,
            b: 255,
            a: 255
        };
    }

    // Puntos aislados: verde
    for (const point of graph.isolated) {
        matrix[point.y][point.x] = {
            r: 0,
            g: 180,
            b: 0,
            a: 255
        };
    }

    return matrix;
}