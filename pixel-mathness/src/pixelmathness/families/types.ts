// =========================
// CLOSURE ASSEMBLY TYPES
// =========================

export type ClosureOptions = {

    // índices de paleta (ColorLayer.index) que forman el contorno base
    outlineIndices: number[];

    // Tope de área de un hueco para considerarlo "cerrado".
    // Más grande => una fuga pequeña puede tragarse regiones enormes.
    // Por defecto: 6 × mediana de las caras que ya cierra el contorno.
    maxHoleArea?: number;

    // Tope de área de lo que se añade como pared (el "tapón").
    // Por defecto: 0.6 × mediana de las caras base.
    maxCloserArea?: number;

    // Mínimo de píxeles nuevos encerrados para aceptar un cierre
    minGain?: number;

    // gain / cost mínimo: lo cerrado debe compensar lo añadido
    minRatio?: number;

    // Fracción mínima de la frontera del hueco que debe ser contorno
    // original. Evita "caras" que son solo un anillo de tono.
    minOutlineContact?: number;

    // multiplicadores de afinidad de familia de iluminación
    familyBonus?: number;
    familyPenalty?: number;

    // 1 = solo nubes sueltas, 2 = también pares de nubes vecinas
    maxCombo?: 1 | 2;
};

export type ResolvedClosureOptions =
    Required<ClosureOptions>;

export type ClosureFaceKind =
    | "filled"
    | "void";

export type AssemblyFace = {
    id: number;

    // "outline": ya la cerraba el contorno
    // "closure": la cierra el contorno + closers
    source: "outline" | "closure";

    // índices lineales (y * width + x)
    pixels: Int32Array;
    area: number;

    // ids en ClosureResult.closers
    closerIds: number[];

    // contenido por nube (palette index), mayor -> menor
    composition: {
        cloud: number;
        count: number;
    }[];

    // nube dominante dentro de la cara (-1 si es vacío)
    dominantCloud: number;

    // familia de iluminación de la nube dominante (-1 si no hay)
    familyIndex: number;

    transparentRatio: number;
    kind: ClosureFaceKind;

    outlineContact: number;

    score: number;

    // 0 = base, 1.. = ronda de cierre en que apareció
    round: number;
};

export type AppliedCloser = {
    id: number;

    pixels: Int32Array;

    // nubes (palette index) que componen el tapón
    clouds: number[];

    cost: number;
    gain: number;
    score: number;

    faceIds: number[];

    round: number;
};

export type FamilyGroup = {
    familyIndex: number;

    faceIds: number[];

    area: number;
    closureFaceCount: number;
};

export type ClosureStats = {
    opaquePixels: number;

    outlinePixels: number;
    closerPixels: number;

    baselineFaces: number;
    closureFaces: number;

    baselineFacePixels: number;
    closureFacePixels: number;

    // opacos que no son contorno, tapón ni cara
    unassignedPixels: number;

    // (contorno + tapón + caras) / opacos
    coverage: number;

    rounds: number;
};

export type ClosureResult = {
    width: number;
    height: number;

    options: ResolvedClosureOptions;

    outlineMask: Uint8Array;
    closerMask: Uint8Array;

    // faceOf[p] = índice en faces, o -1
    faceOf: Int32Array;

    // primero las caras base, luego las de cierre
    faces: AssemblyFace[];
    baselineCount: number;

    closers: AppliedCloser[];

    families: FamilyGroup[];

    stats: ClosureStats;
};
