import type { LabelMap } from "../core/labelMap";
import type { ColorLayer } from "../analysis/separateColorLayers";
import type { IlluminationFamily } from "../analysis/illumination/types";

import {
    getInternalHoles
} from "../analysis/faceComposition/getInternalHoles";

import {
    GainWorkspace,
    getCompletionGain
} from "../analysis/faceComposition/getCompletionGain";

import type {
    GainContext
} from "../analysis/faceComposition/getCompletionGain";

import type {
    AppliedCloser,
    AssemblyFace,
    ClosureOptions,
    ClosureResult,
    FamilyGroup,
    ResolvedClosureOptions
} from "./types";

// =========================
// CLOSURE ASSEMBLY
// =========================
//
// Idea:
//
//   1. El contorno solo cierra algunas caras. Donde el artista dejó un
//      hueco (o lo tapó con un tono), la región "se fuga" al exterior.
//
//   2. Cada trozo de nube de tono (subgrupo 8-conexo) es un posible
//      TAPÓN. Si al convertirlo en pared aparecen huecos cerrados,
//      esa nube "completa" una forma: completionGain = píxeles nuevos
//      encerrados.
//
//   3. Se aplican de forma voraz (lazy greedy) los tapones con mejor
//      score:
//
//          score = (gain / cost)
//                × afinidad de familia de iluminación
//                × (0.5 + 0.5 · contacto con contorno)
//
//      La afinidad premia que el tapón sea del mismo material (misma
//      familia) que lo que cierra: sombra y luz de una misma hoja.
//
//   4. Si ningún tapón suelto cierra, se prueban PARES de subgrupos
//      vecinos (maxCombo = 2). Es el "sumar nubes de tono".
//
// Todo el estado es mutable y local a esta función.

const NEIGHBORS_8 = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
] as const;

type Candidate = {
    pixels: Int32Array;
    clouds: number[];
};

type Evaluation = {
    open: Int32Array;
    gain: number;
    cost: number;
    score: number;
    holes: ReturnType<typeof getCompletionGain>["holes"];
    outlineContact: number;
};

function clamp(
    value: number,
    min: number,
    max: number
): number {
    return Math.max(min, Math.min(max, value));
}

function median(values: number[]): number {

    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);

    return sorted[Math.floor(sorted.length / 2)];
}


export function resolveClosureOptions(
    options: ClosureOptions,
    medianBaselineArea: number
): ResolvedClosureOptions {

    const reference =
        medianBaselineArea > 0
            ? medianBaselineArea
            : 40;

    return {
        outlineIndices: options.outlineIndices,

        maxHoleArea:
            options.maxHoleArea ??
            clamp(Math.round(reference * 6), 32, 1500),

        maxCloserArea:
            options.maxCloserArea ??
            clamp(Math.round(reference * 0.6), 6, 120),

        minGain: options.minGain ?? 4,
        minRatio: options.minRatio ?? 1.5,
        minOutlineContact: options.minOutlineContact ?? 0.3,

        familyBonus: options.familyBonus ?? 1.5,
        familyPenalty: options.familyPenalty ?? 0.6,

        maxCombo: options.maxCombo ?? 2
    };
}


export function createClosureAssembly(
    labelMap: LabelMap,
    layers: ColorLayer[],
    families: IlluminationFamily[],
    options: ClosureOptions
): ClosureResult {

    const {
        width,
        height,
        labels,
        palette
    } = labelMap;

    const size = width * height;

    const outlineSet = new Set(options.outlineIndices);

    // -------------------------
    // Familia por nube
    // -------------------------

    const familyOf = new Int32Array(palette.length).fill(-1);

    families.forEach((family, familyIndex) => {
        for (const member of family.members) {
            familyOf[member.cloud.index] = familyIndex;
        }
    });

    // -------------------------
    // Paredes base = contorno
    // -------------------------

    const outlineMask = new Uint8Array(size);

    for (let p = 0; p < size; p++) {
        if (labels[p] >= 0 && outlineSet.has(labels[p])) {
            outlineMask[p] = 1;
        }
    }

    const wall = outlineMask.slice();
    const closerMask = new Uint8Array(size);
    const faceOf = new Int32Array(size).fill(-1);

    const faces: AssemblyFace[] = [];
    const closers: AppliedCloser[] = [];

    // -------------------------
    // Composición de una región
    // -------------------------

    function describeRegion(pixels: Int32Array) {

        const counts = new Map<number, number>();

        let transparent = 0;

        for (let i = 0; i < pixels.length; i++) {

            const label = labels[pixels[i]];

            if (label < 0) {
                transparent++;
                continue;
            }

            counts.set(label, (counts.get(label) ?? 0) + 1);
        }

        const composition =
            [...counts.entries()]
                .map(([cloud, count]) => ({ cloud, count }))
                .sort((a, b) => b.count - a.count);

        const transparentRatio =
            pixels.length === 0
                ? 0
                : transparent / pixels.length;

        const dominantCloud =
            composition.length > 0
                ? composition[0].cloud
                : -1;

        return {
            composition,
            dominantCloud,
            familyIndex:
                dominantCloud >= 0
                    ? familyOf[dominantCloud]
                    : -1,
            transparentRatio,
            kind:
                transparentRatio >= 0.5
                    ? "void" as const
                    : "filled" as const
        };
    }

    function addFace(
        pixels: Int32Array,
        source: "outline" | "closure",
        closerIds: number[],
        outlineContact: number,
        score: number,
        round: number
    ): AssemblyFace {

        const face: AssemblyFace = {
            id: faces.length,
            source,
            pixels,
            area: pixels.length,
            closerIds,
            outlineContact,
            score,
            round,
            ...describeRegion(pixels)
        };

        faces.push(face);

        for (let i = 0; i < pixels.length; i++) {
            faceOf[pixels[i]] = face.id;
        }

        return face;
    }

    // -------------------------
    // 1. Caras base
    // -------------------------

    const baseline = getInternalHoles(wall, width, height);

    for (const hole of baseline.holes) {
        addFace(hole.pixels, "outline", [], 1, 0, 0);
    }

    const baselineCount = faces.length;

    const resolved = resolveClosureOptions(
        options,
        median(
            faces
                .filter(face => face.kind === "filled")
                .map(face => face.area)
        )
    );

    // -------------------------
    // 2. Candidatos
    // -------------------------

    const singles: Candidate[] = [];

    for (const layer of layers) {

        if (outlineSet.has(layer.index)) continue;

        for (const subgroup of layer.subgroups) {

            if (subgroup.pixelCount > resolved.maxCloserArea) {
                continue;
            }

            const pixels = new Int32Array(subgroup.pixelCount);

            subgroup.pixels.forEach((point, i) => {
                pixels[i] = point.y * width + point.x;
            });

            singles.push({
                pixels,
                clouds: [layer.index]
            });
        }
    }

    // -------------------------
    // 3. Evaluación
    // -------------------------

    const workspace = new GainWorkspace(size);

    const context: GainContext = {
        width,
        height,
        wall,
        outlineMask,
        faceOf,
        labels,
        maxHoleArea: resolved.maxHoleArea
    };

    function touchesWall(pixels: Int32Array): boolean {

        for (let i = 0; i < pixels.length; i++) {

            const p = pixels[i];
            const x = p % width;
            const y = (p - x) / width;

            for (const [dx, dy] of NEIGHBORS_8) {

                const nx = x + dx;
                const ny = y + dy;

                if (
                    nx < 0 ||
                    ny < 0 ||
                    nx >= width ||
                    ny >= height
                ) {
                    continue;
                }

                if (wall[ny * width + nx]) return true;
            }
        }

        return false;
    }

    function evaluate(
        candidate: Candidate
    ): Evaluation | null {

        // solo píxeles todavía abiertos
        let openCount = 0;

        for (let i = 0; i < candidate.pixels.length; i++) {

            const p = candidate.pixels[i];

            if (wall[p] === 0 && faceOf[p] < 0) openCount++;
        }

        if (openCount === 0) return null;

        const open = new Int32Array(openCount);

        let k = 0;

        for (let i = 0; i < candidate.pixels.length; i++) {

            const p = candidate.pixels[i];

            if (wall[p] === 0 && faceOf[p] < 0) open[k++] = p;
        }

        if (!touchesWall(open)) return null;

        const result = getCompletionGain(
            workspace,
            context,
            open
        );

        if (result.gain < resolved.minGain) return null;

        const ratio = result.gain / result.cost;

        if (ratio < resolved.minRatio) return null;

        if (result.outlineContact < resolved.minOutlineContact) {
            return null;
        }

        // ---- afinidad de familia ----

        const tally = new Map<number, number>();

        for (const hole of result.holes) {
            for (let i = 0; i < hole.pixels.length; i++) {

                const label = labels[hole.pixels[i]];

                if (label >= 0) {
                    tally.set(label, (tally.get(label) ?? 0) + 1);
                }
            }
        }

        let dominant = -1;
        let best = 0;

        for (const [cloud, count] of tally) {
            if (count > best) {
                best = count;
                dominant = cloud;
            }
        }

        let affinity = 1;

        if (dominant >= 0 && familyOf[dominant] >= 0) {

            const same = candidate.clouds.filter(
                cloud => familyOf[cloud] === familyOf[dominant]
            ).length;

            const fraction = same / candidate.clouds.length;

            affinity =
                resolved.familyPenalty +
                (resolved.familyBonus - resolved.familyPenalty) *
                fraction;
        }

        const score =
            ratio *
            affinity *
            (0.5 + 0.5 * result.outlineContact);

        return {
            open,
            gain: result.gain,
            cost: result.cost,
            score,
            holes: result.holes,
            outlineContact: result.outlineContact
        };
    }

    // -------------------------
    // 4. Aplicar un tapón
    // -------------------------

    let commits = 0;

    function commit(
        candidate: Candidate,
        evaluation: Evaluation,
        round: number
    ) {

        for (let i = 0; i < evaluation.open.length; i++) {
            wall[evaluation.open[i]] = 1;
            closerMask[evaluation.open[i]] = 1;
        }

        const closerId = closers.length;

        const faceIds: number[] = [];

        for (const hole of evaluation.holes) {

            const face = addFace(
                hole.pixels,
                "closure",
                [closerId],
                hole.outlineContact,
                evaluation.score,
                round
            );

            faceIds.push(face.id);
        }

        closers.push({
            id: closerId,
            pixels: evaluation.open,
            clouds: candidate.clouds,
            cost: evaluation.cost,
            gain: evaluation.gain,
            score: evaluation.score,
            faceIds,
            round
        });

        commits++;
    }

    // -------------------------
    // 5. Lazy greedy
    // -------------------------

    type Entry = {
        candidate: Candidate;
        score: number;
        version: number;
    };

    function insertSorted(entries: Entry[], entry: Entry) {

        let lo = 0;
        let hi = entries.length;

        while (lo < hi) {

            const mid = (lo + hi) >> 1;

            if (entries[mid].score >= entry.score) {
                lo = mid + 1;
            }
            else {
                hi = mid;
            }
        }

        entries.splice(lo, 0, entry);
    }

    function runGreedy(
        candidates: Candidate[],
        round: number
    ): number {

        const entries: Entry[] = [];

        for (const candidate of candidates) {

            const evaluation = evaluate(candidate);

            if (evaluation) {
                entries.push({
                    candidate,
                    score: evaluation.score,
                    version: commits
                });
            }
        }

        entries.sort((a, b) => b.score - a.score);

        let committed = 0;
        let guard = entries.length * 20 + 100;

        while (entries.length > 0 && guard-- > 0) {

            const top = entries.shift()!;

            const evaluation = evaluate(top.candidate);

            if (!evaluation) continue;

            const nextScore =
                entries.length > 0
                    ? entries[0].score
                    : -Infinity;

            // si nada cambió desde que se puntuó, o sigue siendo
            // la mejor tras re-evaluar, se aplica
            if (
                top.version === commits ||
                evaluation.score + 1e-9 >= nextScore
            ) {
                commit(top.candidate, evaluation, round);
                committed++;
            }
            else {
                insertSorted(entries, {
                    candidate: top.candidate,
                    score: evaluation.score,
                    version: commits
                });
            }
        }

        return committed;
    }

    // -------------------------
    // 6. Pares de subgrupos vecinos
    // -------------------------

    function buildPairs(): Candidate[] {

        const owner = new Int32Array(size).fill(-1);

        singles.forEach((candidate, id) => {
            for (let i = 0; i < candidate.pixels.length; i++) {

                const p = candidate.pixels[i];

                if (wall[p] === 0 && faceOf[p] < 0) {
                    owner[p] = id;
                }
            }
        });

        const seen = new Set<number>();
        const pairs: Candidate[] = [];

        const MAX_PAIRS = 40000;

        for (let a = 0; a < singles.length; a++) {

            const candidateA = singles[a];

            for (let i = 0; i < candidateA.pixels.length; i++) {

                const p = candidateA.pixels[i];

                if (owner[p] !== a) continue;

                const x = p % width;
                const y = (p - x) / width;

                for (const [dx, dy] of NEIGHBORS_8) {

                    const nx = x + dx;
                    const ny = y + dy;

                    if (
                        nx < 0 ||
                        ny < 0 ||
                        nx >= width ||
                        ny >= height
                    ) {
                        continue;
                    }

                    const b = owner[ny * width + nx];

                    if (b < 0 || b <= a) continue;

                    const key = a * singles.length + b;

                    if (seen.has(key)) continue;

                    seen.add(key);

                    const candidateB = singles[b];

                    const pixels = new Int32Array(
                        candidateA.pixels.length +
                        candidateB.pixels.length
                    );

                    pixels.set(candidateA.pixels, 0);

                    pixels.set(
                        candidateB.pixels,
                        candidateA.pixels.length
                    );

                    pairs.push({
                        pixels,
                        clouds: [
                            ...new Set([
                                ...candidateA.clouds,
                                ...candidateB.clouds
                            ])
                        ]
                    });

                    if (pairs.length >= MAX_PAIRS) return pairs;
                }
            }
        }

        return pairs;
    }

    // -------------------------
    // 7. Rondas
    // -------------------------

    let rounds = 0;

    for (let round = 1; round <= 3; round++) {

        let committed = runGreedy(singles, round);

        if (resolved.maxCombo >= 2) {
            committed += runGreedy(buildPairs(), round);
        }

        if (committed === 0) break;

        rounds = round;
    }

    // -------------------------
    // 8. Familias + stats
    // -------------------------

    const groups = new Map<number, FamilyGroup>();

    for (const face of faces) {

        if (face.kind === "void") continue;

        let group = groups.get(face.familyIndex);

        if (!group) {
            group = {
                familyIndex: face.familyIndex,
                faceIds: [],
                area: 0,
                closureFaceCount: 0
            };

            groups.set(face.familyIndex, group);
        }

        group.faceIds.push(face.id);
        group.area += face.area;

        if (face.source === "closure") {
            group.closureFaceCount++;
        }
    }

    let outlinePixels = 0;
    let closerPixels = 0;
    let baselineFacePixels = 0;
    let closureFacePixels = 0;
    let unassigned = 0;

    for (let p = 0; p < size; p++) {

        if (outlineMask[p]) outlinePixels++;
        if (closerMask[p]) closerPixels++;

        if (faceOf[p] >= 0) {
            if (faces[faceOf[p]].source === "outline") {
                baselineFacePixels++;
            }
            else {
                closureFacePixels++;
            }
        }

        if (
            labels[p] >= 0 &&
            !outlineMask[p] &&
            !closerMask[p] &&
            faceOf[p] < 0
        ) {
            unassigned++;
        }
    }

    const opaque = labelMap.opaqueCount;

    return {
        width,
        height,

        options: resolved,

        outlineMask,
        closerMask,
        faceOf,

        faces,
        baselineCount,

        closers,

        families: [...groups.values()].sort(
            (a, b) => b.area - a.area
        ),

        stats: {
            opaquePixels: opaque,

            outlinePixels,
            closerPixels,

            baselineFaces: baselineCount,
            closureFaces: faces.length - baselineCount,

            baselineFacePixels,
            closureFacePixels,

            unassignedPixels: unassigned,

            coverage:
                opaque === 0
                    ? 0
                    : (opaque - unassigned) / opaque,

            rounds
        }
    };
}
