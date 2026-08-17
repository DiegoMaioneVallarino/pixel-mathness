import type { PixelMatrix } from "../types/PixelMatrix";

export function matrixToCanvas(
    matrix: PixelMatrix,
    canvas: HTMLCanvasElement
): void {

    const height = matrix.length;

    if (height === 0) {
        console.warn("Empty matrix");
        return;
    }

    const width = matrix[0].length;

    console.log("Drawing canvas:", width, height);

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Could not create Canvas 2D context");
    }

    const imageData = ctx.createImageData(width, height);

    for (let y = 0; y < height; y++) {

        for (let x = 0; x < width; x++) {

            const pixel = matrix[y][x];

            const index = (y * width + x) * 4;

            imageData.data[index] = pixel.r;
            imageData.data[index + 1] = pixel.g;
            imageData.data[index + 2] = pixel.b;
            imageData.data[index + 3] = pixel.a;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}