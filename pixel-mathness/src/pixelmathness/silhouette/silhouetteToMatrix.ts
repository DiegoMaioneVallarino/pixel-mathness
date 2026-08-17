import type { Silhouette } from "../types/Silhouette";
import type { PixelMatrix } from "../types/PixelMatrix";

export function silhouetteToMatrix(
    silhouette: Silhouette
): PixelMatrix {

    return silhouette.map(row =>
        row.map(active => {

            // Parte interna del objeto
            if (active) {
                return {
                    r: 0,
                    g: 0,
                    b: 0,
                    a: 255
                };
            }

            // Parte descartada / fondo
            return {
                r: 255,
                g: 255,
                b: 255,
                a: 255
            };
        })
    );
}