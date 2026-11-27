import type { PixelMatrix } from "../types/PixelMatrix";

import { ramita } from "./ramita";

export type Sample = {
    id: string;
    title: string;
    style: string;
    split: "development" | "holdout";
    matrix: PixelMatrix;
    reference: string[];
};

const palette = {
    ".": { r: 0, g: 0, b: 0, a: 0 },
    "#": { r: 21, g: 30, b: 20, a: 255 },
    "g": { r: 98, g: 182, b: 96, a: 255 },
    "w": { r: 255, g: 255, b: 255, a: 255 },
};

function fixture(id: string, title: string, art: string[], style = "aislado", split: Sample["split"] = "development"): Sample {
    // Digits are hand-placed instance labels. Letters are visible, unlabelled texture.
    return {
        id, title, style, split,
        matrix: art.map(row => Array.from(row, c => palette[c === "W" ? "w" : /[1-9]/.test(c) ? "g" : c as keyof typeof palette])),
        reference: art.map(row => row.replace(/W/g, "1").replace(/[^1-9]/g, ".")),
    };
}

export const corpus: Sample[] = [
    fixture("sealed", "Contorno cerrado", [".....", ".###.", ".#1#.", ".###.", "....."]),
    fixture("gap", "Brecha de un píxel", [".....", ".#.#.", ".#1#.", ".###.", "....."]),
    fixture("diagonal", "Cierre diagonal", [".....", "..#..", ".#1#.", "..#..", "....."]),
    fixture("white", "Interior blanco opaco", ["###..", "#W#..", "###..", "....."]),
    fixture("void", "Vacío entre raíces", [".....", ".###.", ".#.#.", ".###.", "....."], "espacio negativo"),
    fixture("inkless", "Hoja sin tinta", [".....", "..1..", ".11..", "....."], "follaje"),
    fixture("shared", "Dos caras con borde común", [".......", ".#####.", ".#1#2#.", ".#####.", "......."], "partes contiguas"),
    fixture("merged", "Dos interiores comunicados", [".......", ".#####.", ".#1g2#.", ".#####.", "......."], "partes contiguas"),
    fixture("dither", "Trama sin piezas", [".......", ".#g#g#.", ".g#g#g.", ".#g#g#.", "......."], "textura", "holdout"),
    fixture("canopy", "Follaje mixto", ["..........", "..#...##..", ".#1#.#22#.", "..#...#.#.", ".......#..", "...33.....", "....3....."], "follaje", "holdout"),
    ramita,
];
