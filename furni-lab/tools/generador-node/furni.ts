// =====================================================================
// furni.ts — Renderer offline de furnis estilo Habbo
//
// Pipeline:
//   1. El mueble se describe como partes 3D (SDF) en unidades del mundo.
//   2. Cada píxel lanza un rayo en la dirección isométrica 2:1 fija.
//   3. Se llena un G-buffer: parte, profundidad, normal, nivel de luz.
//   4. La luz se CUANTIZA a un índice de rampa de paleta (nunca RGB libre).
//   5. Una pasada en espacio de pantalla deriva contornos, aristas
//      convexas (brillo) y cóncavas (sombra) de las discontinuidades.
//
// Unidades: 1 baldosa = 32 x 32 unidades -> rombo de 64 x 32 px.
//           1 unidad de altura (z) = 1 px.
// Proyección: sx = x - y ; sy = (x + y) / 2 - z   (líneas 2:1 exactas)
// =====================================================================

export type SDF = (x: number, y: number, z: number) => number;
export type RGB = [number, number, number];

// ---------------------------------------------------------------------
// PRIMITIVAS (distancias con signo; fórmulas de Inigo Quilez)
// ---------------------------------------------------------------------

/** Caja por esquinas mínimas/máximas, con radio de redondeo opcional. */
export function box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, r = 0): SDF {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
    const hx = (x1 - x0) / 2 - r, hy = (y1 - y0) / 2 - r, hz = (z1 - z0) / 2 - r;
    return (x, y, z) => {
        const qx = Math.abs(x - cx) - hx, qy = Math.abs(y - cy) - hy, qz = Math.abs(z - cz) - hz;
        const ox = Math.max(qx, 0), oy = Math.max(qy, 0), oz = Math.max(qz, 0);
        return Math.hypot(ox, oy, oz) + Math.min(Math.max(qx, qy, qz), 0) - r;
    };
}

/** Cilindro vertical (eje z). */
export function cylinder(cx: number, cy: number, radius: number, z0: number, z1: number, r = 0): SDF {
    const cz = (z0 + z1) / 2, hz = (z1 - z0) / 2 - r, rr = radius - r;
    return (x, y, z) => {
        const dx = Math.hypot(x - cx, y - cy) - rr, dz = Math.abs(z - cz) - hz;
        return Math.min(Math.max(dx, dz), 0) + Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) - r;
    };
}

/** Tronco de cono vertical: radio r0 en z0, r1 en z1. */
export function cone(cx: number, cy: number, r0: number, z0: number, r1: number, z1: number): SDF {
    const h = z1 - z0, slope = (r1 - r0) / h, k = 1 / Math.sqrt(1 + slope * slope);
    return (x, y, z) => {
        const rad = r0 + slope * Math.min(Math.max(z - z0, 0), h);
        const side = (Math.hypot(x - cx, y - cy) - rad) * k;
        const cap = Math.max(z0 - z, z - z1);
        return Math.max(side, cap);
    };
}

export function sphere(cx: number, cy: number, cz: number, r: number): SDF {
    return (x, y, z) => Math.hypot(x - cx, y - cy, z - cz) - r;
}

/** Elipsoide (distancia aproximada, suficiente para rasterizar). */
export function ellipsoid(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number): SDF {
    const m = Math.min(rx, ry, rz);
    return (x, y, z) => (Math.hypot((x - cx) / rx, (y - cy) / ry, (z - cz) / rz) - 1) * m;
}

/** Toro horizontal (aros, bordes de macetas, asas). */
export function torus(cx: number, cy: number, cz: number, R: number, r: number): SDF {
    return (x, y, z) => Math.hypot(Math.hypot(x - cx, y - cy) - R, z - cz) - r;
}

/** Cápsula entre dos puntos (tubos, tallos, patas inclinadas). */
export function capsule(a: [number, number, number], b: [number, number, number], r: number): SDF {
    const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
    const bb = bax * bax + bay * bay + baz * baz;
    return (x, y, z) => {
        const pax = x - a[0], pay = y - a[1], paz = z - a[2];
        const h = Math.min(Math.max((pax * bax + pay * bay + paz * baz) / bb, 0), 1);
        return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - r;
    };
}

// ---------------------------------------------------------------------
// OPERACIONES
// ---------------------------------------------------------------------

export const union = (...s: SDF[]): SDF => (x, y, z) => {
    let d = Infinity;
    for (const f of s) d = Math.min(d, f(x, y, z));
    return d;
};
export const subtract = (a: SDF, ...b: SDF[]): SDF => (x, y, z) => {
    let d = a(x, y, z);
    for (const f of b) d = Math.max(d, -f(x, y, z));
    return d;
};
export const intersect = (a: SDF, b: SDF): SDF => (x, y, z) => Math.max(a(x, y, z), b(x, y, z));
export const smoothUnion = (k: number, ...s: SDF[]): SDF => (x, y, z) => {
    let d = s[0](x, y, z);
    for (let i = 1; i < s.length; i++) {
        const e = s[i](x, y, z);
        const h = Math.max(k - Math.abs(d - e), 0) / k;
        d = Math.min(d, e) - h * h * k * 0.25;
    }
    return d;
};
export const translate = (s: SDF, dx: number, dy: number, dz: number): SDF => (x, y, z) => s(x - dx, y - dy, z - dz);
/** Repite una forma n veces a lo largo de un eje (listones, barrotes, cajones). */
export const repeat = (make: (i: number) => SDF, n: number): SDF => union(...Array.from({ length: n }, (_, i) => make(i)));

// ---------------------------------------------------------------------
// MATERIALES = RAMPAS DE PALETA
// ---------------------------------------------------------------------
// Niveles: 0 hueco/cóncavo · 1 sombra · 2 cara derecha · 3 cara izquierda
//          4 cara superior · 5 brillo de arista.  + color de contorno.

/** pattern: desplaza el nivel de rampa según la posición en el OBJETO (gira con él). */
export type Pattern = (x: number, y: number, z: number) => number;
export type Material = { ramp: RGB[]; outline: RGB; emissive?: boolean; pattern?: Pattern };

function rgbToHsl([r, g, b]: RGB): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
}
function hslToRgb(h: number, s: number, l: number): RGB {
    h = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function hueToward(h: number, target: number, amount: number) {
    let d = ((target - h + 540) % 360) - 180;
    return h + d * amount;
}
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Crea una rampa con "hue shifting" de pixel artist:
 * las sombras giran hacia violeta/azul, las luces hacia amarillo.
 * `base` es el color de la cara izquierda (nivel 3).
 */
export function material(hex: string, opts: { step?: number; hueShift?: number; emissive?: boolean; pattern?: Pattern } = {}): Material {
    const step = opts.step ?? 0.085, shift = opts.hueShift ?? 0.07;
    const n = parseInt(hex.replace("#", ""), 16);
    const [h, s, l] = rgbToHsl([(n >> 16) & 255, (n >> 8) & 255, n & 255]);
    const ramp: RGB[] = [];
    for (let i = 0; i < 6; i++) {
        const k = i - 3; // -3..+2
        const hh = k < 0 ? hueToward(h, 255, -k * shift) : hueToward(h, 55, k * shift * 0.8);
        const ss = clamp01(s + (k < 0 ? -k * 0.04 : -k * 0.05));
        const ll = clamp01(l + k * step + (k === 2 ? step * 0.4 : 0));
        ramp.push(hslToRgb(hh, ss, ll));
    }
    const outline = hslToRgb(hueToward(h, 260, 0.35), clamp01(s * 0.7), Math.max(0.07, l * 0.28));
    return { ramp, outline, emissive: opts.emissive, pattern: opts.pattern };
}

// ---------------------------------------------------------------------
// RUIDO (para patrones: vetas, motas, tramas)
// ---------------------------------------------------------------------

function hash3(x: number, y: number, z: number, seed: number) {
    let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 144665) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
/** Ruido de valor 3D suave en [0,1]. */
export function noise3(x: number, y: number, z: number, seed = 1) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const fx = x - xi, fy = y - yi, fz = z - zi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
    const L = (a: number, b: number, t: number) => a + (b - a) * t;
    const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz, seed);
    return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v),
             L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w);
}

// ---------------------------------------------------------------------
// ESCENA Y RENDER
// ---------------------------------------------------------------------

export type Part = { name: string; sdf: SDF; mat: Material };
export type Furni = {
    /** Tamaño en baldosas (ancho en x, fondo en y). */
    footprint: [number, number];
    height: number;
    parts: Part[];
};

export type RenderOptions = {
    /** 0 = dirección "2" de Habbo, 1 = rotado 90° (dirección "4"). */
    rotation?: 0 | 1 | 2 | 3;
    light?: [number, number, number];
    castShadows?: boolean;
    floorShadow?: boolean;
    margin?: number;
};

export type Sprite = {
    width: number;
    height: number;
    rgba: Uint8ClampedArray;
    /** Píxel del sprite donde cae la esquina trasera de la baldosa (0,0,0). */
    originX: number;
    originY: number;
};

const TILE = 32;

function norm3(v: [number, number, number]): [number, number, number] {
    const l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
}

export function render(furni: Furni, opts: RenderOptions = {}): Sprite {
    const rot = opts.rotation ?? 0;
    const L = norm3(opts.light ?? [0.35, 0.75, 1.0]);
    const castShadows = opts.castShadows ?? true;
    const floorShadow = opts.floorShadow ?? true;
    const margin = opts.margin ?? 1;

    // Rotación de la escena alrededor de la huella (las 4 direcciones Habbo).
    const W0 = furni.footprint[0] * TILE, D0 = furni.footprint[1] * TILE;
    const swap = rot % 2 === 1;
    const W = swap ? D0 : W0, D = swap ? W0 : D0;
    const toObject = (x: number, y: number): [number, number] => {
        switch (rot) {
            case 1: return [y, W - x];
            case 2: return [W0 - x, D0 - y];
            case 3: return [D - y, x];
            default: return [x, y];
        }
    };
    const parts = furni.parts;
    const sceneDist = (x: number, y: number, z: number): number => {
        const [ox, oy] = toObject(x, y);
        let d = Infinity;
        for (const p of parts) d = Math.min(d, p.sdf(ox, oy, z));
        return d;
    };
    const partAt = (x: number, y: number, z: number): number => {
        const [ox, oy] = toObject(x, y);
        let best = -1, bd = Infinity;
        for (let i = 0; i < parts.length; i++) {
            const d = parts[i].sdf(ox, oy, z);
            if (d < bd) { bd = d; best = i; }
        }
        return best;
    };

    // Lienzo de trabajo
    const H = furni.height;
    const slack = 10;
    const ox = D + slack, oy = H + slack;
    const width = W + D + slack * 2, height = H + (W + D) / 2 + slack * 2;
    const N = width * height;

    const hit = new Int16Array(N).fill(-1);
    const depth = new Float32Array(N);
    const nrm = new Float32Array(N * 3);
    const pos = new Float32Array(N * 3);
    const level = new Int8Array(N);
    const floorShade = new Uint8Array(N);

    const EPS = 0.12;
    const marchToLight = (x: number, y: number, z: number): boolean => {
        let t = 0.6;
        for (let i = 0; i < 160 && t < 140; i++) {
            const d = sceneDist(x + L[0] * t, y + L[1] * t, z + L[2] * t);
            if (d < 0.02) return true;
            t += Math.max(d * 0.9, 0.05);
        }
        return false;
    };

    // 1–3. Raymarch + G-buffer + luz cuantizada
    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            const sx = i + 0.5 - ox, sy = j + 0.5 - oy;
            const x0 = sy + sx / 2, y0 = sy - sx / 2;
            // rango de t que mantiene el rayo dentro de la caja del mueble
            const tHi = Math.min(H + 2, W + slack - x0, D + slack - y0);
            const tLo = Math.max(-0.5, -slack - x0, -slack - y0);
            const idx = j * width + i;
            let t = tHi, found = false;
            while (t >= tLo) {
                const d = sceneDist(x0 + t, y0 + t, t);
                if (d < 0.01) { found = true; break; }
                t -= Math.max(d * 0.55, 0.03);
            }
            if (!found) {
                // sombra proyectada sobre el piso (z = 0)
                if (floorShadow && x0 > -slack && y0 > -slack && x0 < W + slack && y0 < D + slack) {
                    if (marchToLight(x0, y0, 0.01)) floorShade[idx] = 1;
                }
                continue;
            }
            const px = x0 + t, py = y0 + t, pz = t;
            let nx = sceneDist(px + EPS, py, pz) - sceneDist(px - EPS, py, pz);
            let ny = sceneDist(px, py + EPS, pz) - sceneDist(px, py - EPS, pz);
            let nz = sceneDist(px, py, pz + EPS) - sceneDist(px, py, pz - EPS);
            const nl = Math.hypot(nx, ny, nz) || 1;
            nx /= nl; ny /= nl; nz /= nl;

            const part = partAt(px, py, pz);
            hit[idx] = part;
            depth[idx] = px + py + pz;
            nrm.set([nx, ny, nz], idx * 3);
            pos.set([px, py, pz], idx * 3);

            // Luz -> índice de rampa (bandas duras, sin degradados)
            const s = nx * L[0] + ny * L[1] + nz * L[2];
            let lv = s > 0.74 ? 4 : s > 0.5 ? 3 : s > 0.2 ? 2 : 1;
            if (castShadows && s > 0.2 && marchToLight(px + nx * 0.5, py + ny * 0.5, pz + nz * 0.5)) lv = Math.max(1, lv - 2);
            const mat = parts[part].mat;
            if (mat.pattern) {
                const [qx, qy] = toObject(px, py);
                lv = Math.max(1, Math.min(4, lv + Math.round(mat.pattern(qx, qy, pz))));
            }
            if (mat.emissive) lv = Math.min(5, lv + 1);
            level[idx] = lv;
        }
    }

    // 4. Pasada de bordes en espacio de pantalla
    const DEPTH_JUMP = 4;
    const outlineOwner = new Int16Array(N).fill(-1); // material del contorno
    const outlineDepth = new Float32Array(N).fill(-Infinity);
    const creaseLevel = new Int8Array(N).fill(-1);
    const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            const p = j * width + i;
            if (hit[p] < 0) continue;
            for (const [dx, dy] of NB) {
                const qi = i + dx, qj = j + dy;
                if (qi < 0 || qj < 0 || qi >= width || qj >= height) continue;
                const q = qj * width + qi;
                // a) q está vacío o mucho más atrás -> contorno dibujado SOBRE q
                if (hit[q] < 0 || depth[p] - depth[q] > DEPTH_JUMP) {
                    if (depth[p] > outlineDepth[q]) { outlineDepth[q] = depth[p]; outlineOwner[q] = hit[p]; }
                    continue;
                }
                if (Math.abs(depth[p] - depth[q]) > DEPTH_JUMP) continue;
                // b) superficie continua: ¿hay pliegue?
                const dn = nrm[p * 3] * nrm[q * 3] + nrm[p * 3 + 1] * nrm[q * 3 + 1] + nrm[p * 3 + 2] * nrm[q * 3 + 2];
                const seam = hit[p] !== hit[q] && parts[hit[p]].mat !== parts[hit[q]].mat;
                if (dn > 0.7 && !seam) continue;
                // marcamos solo el lado más oscuro (línea de 1 px)
                if (level[p] > level[q] || (level[p] === level[q] && depth[p] > depth[q])) continue;
                // convexo si las normales "se abren": (n_p - n_q) · (pos_p - pos_q) > 0
                const conv =
                    (nrm[p * 3] - nrm[q * 3]) * (pos[p * 3] - pos[q * 3]) +
                    (nrm[p * 3 + 1] - nrm[q * 3 + 1]) * (pos[p * 3 + 1] - pos[q * 3 + 1]) +
                    (nrm[p * 3 + 2] - nrm[q * 3 + 2]) * (pos[p * 3 + 2] - pos[q * 3 + 2]);
                let lv: number;
                if (seam) lv = 1;
                else if (conv > 0) lv = Math.min(5, Math.max(level[p], level[q]) + 1);
                else lv = Math.max(0, Math.min(level[p], level[q]) - 1);
                if (lv > creaseLevel[p]) creaseLevel[p] = lv;
            }
        }
    }

    // 5. Composición final con la paleta
    const rgba = new Uint8ClampedArray(N * 4);
    const put = (k: number, c: RGB, a = 255) => { rgba[k * 4] = c[0]; rgba[k * 4 + 1] = c[1]; rgba[k * 4 + 2] = c[2]; rgba[k * 4 + 3] = a; };
    for (let k = 0; k < N; k++) {
        if (outlineOwner[k] >= 0) { put(k, parts[outlineOwner[k]].mat.outline); continue; }
        if (hit[k] >= 0) {
            const m = parts[hit[k]].mat;
            put(k, m.ramp[creaseLevel[k] >= 0 ? creaseLevel[k] : level[k]]);
            continue;
        }
        if (floorShade[k]) put(k, [0, 0, 0], 70);
    }

    // recorte al contenido
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
        if (rgba[(j * width + i) * 4 + 3] === 0) continue;
        minX = Math.min(minX, i); maxX = Math.max(maxX, i); minY = Math.min(minY, j); maxY = Math.max(maxY, j);
    }
    if (maxX < 0) return { width: 1, height: 1, rgba: new Uint8ClampedArray(4), originX: 0, originY: 0 };
    minX -= margin; minY -= margin; maxX += margin; maxY += margin;
    const cw = maxX - minX + 1, ch = maxY - minY + 1;
    const out = new Uint8ClampedArray(cw * ch * 4);
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
        const si = j + minY, sj = i + minX;
        if (si < 0 || sj < 0 || si >= height || sj >= width) continue;
        const s = (si * width + sj) * 4, d = (j * cw + i) * 4;
        out[d] = rgba[s]; out[d + 1] = rgba[s + 1]; out[d + 2] = rgba[s + 2]; out[d + 3] = rgba[s + 3];
    }
    return { width: cw, height: ch, rgba: out, originX: Math.round(ox - minX), originY: Math.round(oy - minY) };
}

// ---------------------------------------------------------------------
// HOJA DE SPRITES (para previsualizar)
// ---------------------------------------------------------------------

export function sheet(rows: Sprite[][], gap = 6, bg: RGB = [222, 226, 230]) {
    const rowH = rows.map(r => Math.max(...r.map(s => s.height)));
    const width = Math.max(...rows.map(r => r.reduce((a, s) => a + s.width + gap, gap)));
    const height = rowH.reduce((a, h) => a + h + gap, gap);
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let k = 0; k < width * height; k++) { rgba[k * 4] = bg[0]; rgba[k * 4 + 1] = bg[1]; rgba[k * 4 + 2] = bg[2]; rgba[k * 4 + 3] = 255; }
    let y = gap;
    rows.forEach((row, r) => {
        let x = gap;
        for (const s of row) {
            const oyy = y + rowH[r] - s.height; // alinear por la base
            for (let j = 0; j < s.height; j++) for (let i = 0; i < s.width; i++) {
                const si = (j * s.width + i) * 4, a = s.rgba[si + 3] / 255;
                if (a === 0) continue;
                const di = ((oyy + j) * width + x + i) * 4;
                for (let c = 0; c < 3; c++) rgba[di + c] = Math.round(s.rgba[si + c] * a + rgba[di + c] * (1 - a));
            }
            x += s.width + gap;
        }
        y += rowH[r] + gap;
    });
    return { width, height, rgba };
}
