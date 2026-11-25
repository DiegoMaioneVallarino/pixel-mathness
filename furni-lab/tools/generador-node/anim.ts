import { ellipsoid, smoothUnion, translate, render, noise3, material, type Furni } from "./furni";
import { writePNG } from "./png";
// Animación = el mismo generador evaluado con un parámetro t.
// Aquí: el follaje se inclina (desplazamiento que crece con la altura).
const leaf = material("#3f9e3a", { hueShift: 0.09, pattern: (x, y, z) => { const n = noise3(x / 2.6, y / 2.6, z / 2.6, 11); return n > 0.68 ? 1 : n < 0.3 ? -1 : 0; } });
import("./demo-lib").then(({ plant }) => {
    const frames = 8;
    for (let f = 0; f < frames; f++) {
        const t = f / frames;
        const base = plant({ seed: 7 });
        const sway = Math.sin(t * Math.PI * 2) * 2.2;
        const leaves = base.parts.find(p => p.name === "leaves")!;
        const sdf = leaves.sdf;
        leaves.sdf = (x, y, z) => { const k = Math.max(0, z - 22) / 18; return sdf(x - sway * k, y + sway * k * 0.5, z); };
        leaves.mat = leaf;
        const s = render(base, { margin: 4 });
        writePNG(`out/anim_${f}.png`, s.width, s.height, s.rgba);
    }
});
