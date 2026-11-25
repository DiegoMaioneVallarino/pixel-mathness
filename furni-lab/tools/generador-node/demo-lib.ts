import {
    noise3,
    box, cylinder, cone, ellipsoid, torus, capsule, sphere,
    union, subtract, smoothUnion, repeat,
    material, render, sheet, type Furni, type Sprite,
} from "./furni";

// --------------------------------------------------- materiales
// veta: bandas a lo largo de x, deformadas con ruido -> nivel -1 en algunas franjas
const grain = (x: number, y: number, z: number) =>
    Math.sin((y + z * 0.3) * 0.9 + noise3(x * 0.08, y * 0.3, z * 0.3, 3) * 6) > 0.82 ? -1 : 0;
const wood = material("#b0703c", { pattern: grain });
const darkWood = material("#7a4a2a", { pattern: grain });
const fabric = material("#c8383f");
const teal = material("#2f9e9a");
const clay = material("#c9643b");
const soil = material("#5a3b28", { step: 0.06 });
// hojas: motas claras/oscuras a escala de hoja (~3 u)
const leaf = material("#3f9e3a", {
    hueShift: 0.09,
    pattern: (x, y, z) => { const n = noise3(x / 2.6, y / 2.6, z / 2.6, 11); return n > 0.68 ? 1 : n < 0.3 ? -1 : 0; },
});
const metal = material("#9aa3ad", { step: 0.1, hueShift: 0.03 });
const glow = material("#f3c64a", { emissive: true });

// --------------------------------------------------- generadores paramétricos

/** Mesa: cualquier tamaño de huella, grosor y estilo de pata. */
export function table(p: { w?: number; d?: number; h?: number; top?: number; leg?: number; mat?: typeof wood; legMat?: typeof wood } = {}): Furni {
    const w = p.w ?? 1, d = p.d ?? 1, h = p.h ?? 24, top = p.top ?? 3, leg = p.leg ?? 3;
    const W = w * 32, D = d * 32, m = 3, mat = p.mat ?? wood, legMat = p.legMat ?? darkWood;
    const legs = [[m, m], [W - m - leg, m], [m, D - m - leg], [W - m - leg, D - m - leg]]
        .map(([x, y]) => box(x, y, 0, x + leg, y + leg, h - top));
    return {
        footprint: [w, d], height: h + 2,
        parts: [
            { name: "top", sdf: box(1, 1, h - top, W - 1, D - 1, h), mat },
            { name: "legs", sdf: union(...legs), mat: legMat },
        ],
    };
}

/** Silla con respaldo de listones y cojín. */
export function chair(p: { slats?: number; cushion?: typeof fabric } = {}): Furni {
    const slats = p.slats ?? 3, seatZ = 13;
    const legs = [[6, 6], [24, 6], [6, 24], [24, 24]].map(([x, y]) => box(x, y, 0, x + 3, y + 3, seatZ));
    const posts = [[6, 6], [6, 24]].map(([x, y]) => box(x, y, seatZ, x + 3, y + 3, 40));
    const slatSdf = repeat(i => {
        const z = seatZ + 9 + i * ((40 - seatZ - 12) / Math.max(1, slats - 1));
        return box(6.5, 8, z, 8.5, 25, z + 3);
    }, slats);
    return {
        footprint: [1, 1], height: 44,
        parts: [
            { name: "frame", sdf: union(...legs, ...posts, slatSdf, box(5, 5, seatZ, 28, 28, seatZ + 2.5)), mat: wood },
            { name: "cushion", sdf: box(9, 7, seatZ + 2, 27, 26, seatZ + 6, 1.8), mat: p.cushion ?? fabric },
        ],
    };
}

/** Planta: maceta hueca con aro + follaje procedural (semilla). */
export function plant(p: { seed?: number; blobs?: number; size?: number; potMat?: typeof clay } = {}): Furni {
    let s = p.seed ?? 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const size = p.size ?? 1, n = p.blobs ?? 14;
    const blobs = Array.from({ length: n }, () => {
        const a = rnd() * Math.PI * 2, r = rnd() * 7 * size, z = 26 + rnd() * 14 * size;
        const rr = (4 + rnd() * 3.5) * size;
        return ellipsoid(16 + Math.cos(a) * r, 16 + Math.sin(a) * r, z, rr, rr, rr * 0.8);
    });
    const pot = subtract(
        union(cone(16, 16, 7.5, 0, 10, 15), torus(16, 16, 15, 10, 1.4)),
        cone(16, 16, 6, 3, 8.8, 20),
    );
    return {
        footprint: [1, 1], height: 26 + 22 * size,
        parts: [
            { name: "pot", sdf: pot, mat: p.potMat ?? clay },
            { name: "soil", sdf: cone(16, 16, 6.2, 2, 8.4, 12.5), mat: soil },
            { name: "stem", sdf: capsule([16, 16, 10], [16, 16, 26], 1.3), mat: darkWood },
            { name: "leaves", sdf: smoothUnion(2.5, ...blobs), mat: leaf },
        ],
    };
}

/** Lámpara de pie con pantalla emisiva. */
export function lamp(p: { h?: number; shade?: typeof glow } = {}): Furni {
    const h = p.h ?? 46;
    return {
        footprint: [1, 1], height: h + 14,
        parts: [
            { name: "base", sdf: cylinder(16, 16, 6.5, 0, 2.5, 0.8), mat: metal },
            { name: "pole", sdf: cylinder(16, 16, 1.2, 2, h), mat: metal },
            { name: "shade", sdf: subtract(cone(16, 16, 10, h - 4, 5.5, h + 9), cylinder(16, 16, 4, h - 5, h - 2)), mat: p.shade ?? glow },
        ],
    };
}

/** Sofá de N baldosas a lo largo de y; respaldo en x bajo (mira hacia +x, como la silla). */
export function sofa(p: { seats?: number; mat?: typeof teal } = {}): Furni {
    const seats = p.seats ?? 2, D = seats * 32, mat = p.mat ?? teal;
    const cushionD = (D - 14) / seats;
    return {
        footprint: [1, seats], height: 30,
        parts: [
            { name: "base", sdf: box(4, 2, 3, 29, D - 2, 11, 1.2), mat },
            { name: "back", sdf: box(3, 2, 9, 10, D - 2, 27, 2.2), mat },
            { name: "arms", sdf: union(box(4, 2, 9, 29, 8, 19, 2.4), box(4, D - 8, 9, 29, D - 2, 19, 2.4)), mat },
            { name: "cushions", sdf: repeat(i => box(10, 7.5 + i * cushionD, 10, 28.5, 7 + (i + 1) * cushionD, 15, 2), seats), mat },
            { name: "feet", sdf: union(...[[6, 4], [6, D - 7], [25, 4], [25, D - 7]].map(([x, y]) => box(x, y, 0, x + 3, y + 3, 4))), mat: darkWood },
        ],
    };
}

