import type { PixelMatrix } from "../types/PixelMatrix";
import type { StrokeFace } from "./detectStrokeFaces";

const FACE_COLORS = [
    { r: 255, g: 120, b: 120, a: 255 },
    { r: 120, g: 180, b: 255, a: 255 },
    { r: 120, g: 220, b: 150, a: 255 },
    { r: 255, g: 210, b: 100, a: 255 },
    { r: 200, g: 140, b: 255, a: 255 },
    { r: 255, g: 150, b: 220, a: 255 },
    { r: 100, g: 220, b: 220, a: 255 },
    { r: 220, g: 180, b: 120, a: 255 },
];

export function strokeFacesToMatrix(
    faces: StrokeFace[],
    width: number,
    height: number
): PixelMatrix {

    // Fondo blanco
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

    // Cada face recibe un color diferente
    faces.forEach((face, index) => {

        const color =
            FACE_COLORS[
                index % FACE_COLORS.length
            ];

        for (const point of face.pixels) {
            matrix[point.y][point.x] = {
                ...color
            };
        }
    });

    // Al final dibujamos todos los boundaries
    // encima de las regiones.
    for (const face of faces) {

        for (const point of face.boundary) {
            matrix[point.y][point.x] = {
                r: 0,
                g: 0,
                b: 0,
                a: 255
            };
        }
    }

    return matrix;
}