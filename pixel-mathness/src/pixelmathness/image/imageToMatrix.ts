import type { PixelMatrix } from "../types/PixelMatrix";

export function imageToMatrix(
    image: HTMLImageElement
): PixelMatrix {

    const canvas = document.createElement("canvas");

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Could not create Canvas 2D context");
    }

    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const matrix: PixelMatrix = [];

    for (let y = 0; y < canvas.height; y++) {
        const row = [];

        for (let x = 0; x < canvas.width; x++) {

            const index = (y * canvas.width + x) * 4;

            row.push({
                r: imageData.data[index],
                g: imageData.data[index + 1],
                b: imageData.data[index + 2],
                a: imageData.data[index + 3]
            });
        }

        matrix.push(row);
    }

    return matrix;
}