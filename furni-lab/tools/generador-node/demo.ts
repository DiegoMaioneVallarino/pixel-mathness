import { table, chair, plant, lamp, sofa } from "./demo-lib";
import { material, render, sheet, type Furni, type Sprite } from "./furni";
import { writePNG } from "./png";
import { mkdirSync } from "node:fs";
const metal = material("#9aa3ad", { step: 0.1, hueShift: 0.03 });
const teal = material("#2f9e9a");

// --------------------------------------------------- render
mkdirSync("out", { recursive: true });
const both = (f: Furni): Sprite[] => [render(f, { rotation: 0 }), render(f, { rotation: 1 })];

const t0 = Date.now();
const row1 = [...both(table()), ...both(chair()), ...both(lamp())];
const row2 = [...both(plant()), ...both(sofa())];
// Variaciones paramétricas: el mismo generador, otros números
const row3 = [
    render(table({ w: 2, h: 18, top: 2, leg: 2, mat: material("#d9d2c4"), legMat: metal })),
    render(chair({ slats: 5, cushion: material("#3d6fd1") })),
    render(plant({ seed: 99, blobs: 22, size: 1.25, potMat: material("#e0e0e8") })),
    render(plant({ seed: 3, blobs: 8, size: 0.8, potMat: teal })),
    render(lamp({ h: 30, shade: material("#7fd6ff", { emissive: true }) })),
    render(sofa({ seats: 3, mat: material("#8a4fc4") })),
];
console.log("render ms:", Date.now() - t0);

const all = sheet([row1, row2, row3]);
writePNG("out/preview_x4.png", all.width, all.height, all.rgba, 4);
writePNG("out/preview_x1.png", all.width, all.height, all.rgba, 1);
row1.concat(row2, row3).forEach((s, i) => writePNG(`out/sprite_${i}.png`, s.width, s.height, s.rgba));
