import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import {
    closureFaceToMatrix,
    closureToMatrix,
    createClosureAssembly
} from "../index";

import type {
    ClosureOptions,
    ColorLayer,
    IlluminationFamily,
    LabelMap,
    PixelMatrix
} from "../index";


// =========================
// CANVAS ESCALADO
// =========================
// Dibuja una PixelMatrix con zoom entero y sin suavizado.
// (matrixToCanvas no escala y loguea en cada redibujado,
//  y aquí se redibuja al mover los sliders.)

type PixelCanvasProps = {
    matrix: PixelMatrix;
    scale: number;
    onPick?: (x: number, y: number) => void;
};

function PixelCanvas({
    matrix,
    scale,
    onPick
}: PixelCanvasProps) {

    const ref = useRef<HTMLCanvasElement>(null);

    const height = matrix.length;
    const width = height === 0 ? 0 : matrix[0].length;

    useEffect(() => {

        const canvas = ref.current;

        if (!canvas || width === 0) return;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        const image = ctx.createImageData(width, height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {

                const pixel = matrix[y][x];
                const i = (y * width + x) * 4;

                image.data[i] = pixel.r;
                image.data[i + 1] = pixel.g;
                image.data[i + 2] = pixel.b;
                image.data[i + 3] = pixel.a;
            }
        }

        ctx.putImageData(image, 0, 0);

    }, [matrix, width, height]);

    return (
        <canvas
            ref={ref}
            className="closure-canvas"
            style={{
                width: width * scale,
                height: height * scale,
                cursor: onPick ? "crosshair" : "default"
            }}
            onClick={event => {

                if (!onPick) return;

                const rect =
                    event.currentTarget.getBoundingClientRect();

                onPick(
                    Math.floor(
                        (event.clientX - rect.left) /
                        rect.width * width
                    ),
                    Math.floor(
                        (event.clientY - rect.top) /
                        rect.height * height
                    )
                );
            }}
        />
    );
}


function Swatch({
    palette,
    index
}: {
    palette: LabelMap["palette"];
    index: number;
}) {

    const color = palette[index];

    if (!color) return null;

    return (
        <span
            className="closure-swatch"
            title={`rgba(${color.r},${color.g},${color.b},${color.a})`}
            style={{
                background:
                    `rgba(${color.r},${color.g},${color.b},${color.a / 255})`
            }}
        />
    );
}


// =========================
// SLIDERS
// =========================

type NumericKey =
    | "minGain"
    | "minRatio"
    | "minOutlineContact"
    | "maxHoleArea"
    | "maxCloserArea"
    | "familyBonus"
    | "familyPenalty";

const SLIDERS: {
    key: NumericKey;
    label: string;
    hint: string;
    min: number;
    max: number;
    step: number;
}[] = [
    {
        key: "minGain",
        label: "Gain mínimo (px)",
        hint: "píxeles nuevos que debe encerrar un tapón",
        min: 1, max: 40, step: 1
    },
    {
        key: "minRatio",
        label: "Gain / coste mínimo",
        hint: "lo cerrado debe compensar lo añadido",
        min: 0.2, max: 12, step: 0.1
    },
    {
        key: "minOutlineContact",
        label: "Contacto con contorno",
        hint: "fracción de la frontera que es contorno original",
        min: 0, max: 1, step: 0.05
    },
    {
        key: "maxHoleArea",
        label: "Área máx. del hueco",
        hint: "por encima se considera fuga",
        min: 8, max: 3000, step: 8
    },
    {
        key: "maxCloserArea",
        label: "Área máx. del tapón",
        hint: "tamaño máximo de lo que se añade como pared",
        min: 1, max: 200, step: 1
    },
    {
        key: "familyBonus",
        label: "Bonus misma familia",
        hint: "multiplicador si tapón y contenido son del mismo material",
        min: 1, max: 3, step: 0.1
    },
    {
        key: "familyPenalty",
        label: "Penalización otra familia",
        hint: "multiplicador si son de materiales distintos",
        min: 0.1, max: 1, step: 0.05
    }
];


// =========================
// VISTA
// =========================

type Props = {
    matrix: PixelMatrix;
    labelMap: LabelMap;
    layers: ColorLayer[];
    families: IlluminationFamily[];
    outlineIndices: number[];
};

export function ClosureDebugView({
    matrix,
    labelMap,
    layers,
    families,
    outlineIndices
}: Props) {

    // null/ausente = automático (se calcula a partir de las caras base)
    const [overrides, setOverrides] =
        useState<Partial<ClosureOptions>>({});

    const [selectedFaceId, setSelectedFaceId] =
        useState<number | null>(null);

    const result = useMemo(
        () =>
            createClosureAssembly(
                labelMap,
                layers,
                families,
                {
                    ...overrides,
                    outlineIndices
                }
            ),
        [
            labelMap,
            layers,
            families,
            outlineIndices,
            overrides
        ]
    );

    const before = useMemo(
        () =>
            closureToMatrix(
                result,
                matrix,
                { mode: "before" }
            ),
        [result, matrix]
    );

    const after = useMemo(
        () =>
            closureToMatrix(
                result,
                matrix,
                {
                    mode: "after",
                    highlightFaceId: selectedFaceId
                }
            ),
        [result, matrix, selectedFaceId]
    );

    const selected =
        selectedFaceId === null
            ? null
            : result.faces[selectedFaceId] ?? null;

    const tile = useMemo(
        () =>
            selected
                ? closureFaceToMatrix(
                    result,
                    selected,
                    matrix
                )
                : null,
        [result, selected, matrix]
    );

    const scale = Math.max(
        1,
        Math.min(
            8,
            Math.floor(
                480 /
                Math.max(
                    1,
                    result.width,
                    result.height
                )
            )
        )
    );

    const stats = result.stats;

    const topClosers = useMemo(
        () =>
            [...result.closers]
                .sort((a, b) => b.score - a.score)
                .slice(0, 30),
        [result]
    );

    function pick(x: number, y: number) {

        if (
            x < 0 ||
            y < 0 ||
            x >= result.width ||
            y >= result.height
        ) {
            return;
        }

        const id = result.faceOf[y * result.width + x];

        setSelectedFaceId(id >= 0 ? id : null);
    }

    return (
        <section className="closure-debug">

            <h2>Closure Assembly</h2>

            <p className="closure-help">
                Gris = región abierta (el contorno no la cierra).
                Pastel = cara cerrada por el contorno.
                Color saturado = cara cerrada al sumar nubes de tono.
                Magenta = tapón (nube añadida como pared).
                Clic en una cara para inspeccionarla.
            </p>


            {/* ---------- stats ---------- */}

            <div className="closure-stats">

                <div>
                    <b>{stats.baselineFaces}</b> caras por contorno
                </div>

                <div>
                    <b>+{stats.closureFaces}</b> caras por cierre
                </div>

                <div>
                    <b>{result.closers.length}</b> tapones
                    ({stats.closerPixels} px)
                </div>

                <div>
                    cobertura{" "}
                    <b>{(stats.coverage * 100).toFixed(1)}%</b>
                </div>

                <div>
                    sin asignar <b>{stats.unassignedPixels}</b> px
                </div>

                <div>
                    rondas <b>{stats.rounds}</b>
                </div>

            </div>


            {/* ---------- controles ---------- */}

            <div className="closure-controls">

                {SLIDERS.map(slider => {

                    const value =
                        overrides[slider.key] ??
                        result.options[slider.key];

                    const isAuto =
                        overrides[slider.key] === undefined;

                    return (
                        <label
                            key={slider.key}
                            title={slider.hint}
                        >
                            <span>
                                {slider.label}:{" "}
                                <b>
                                    {Number(value.toFixed(2))}
                                </b>
                                {isAuto && " (auto)"}
                            </span>

                            <input
                                type="range"
                                min={slider.min}
                                max={slider.max}
                                step={slider.step}
                                value={value}
                                onChange={event =>
                                    setOverrides(current => ({
                                        ...current,
                                        [slider.key]:
                                            Number(event.target.value)
                                    }))
                                }
                            />
                        </label>
                    );
                })}

                <label>
                    <input
                        type="checkbox"
                        checked={result.options.maxCombo >= 2}
                        onChange={event =>
                            setOverrides(current => ({
                                ...current,
                                maxCombo:
                                    event.target.checked ? 2 : 1
                            }))
                        }
                    />
                    {" "}Probar pares de nubes vecinas
                </label>

                <button
                    onClick={() => {
                        setOverrides({});
                        setSelectedFaceId(null);
                    }}
                >
                    Restablecer a automático
                </button>

            </div>


            {/* ---------- antes / después ---------- */}

            <div className="closure-compare">

                <div>
                    <h3>Solo contorno</h3>

                    <PixelCanvas
                        matrix={before}
                        scale={scale}
                    />
                </div>

                <div>
                    <h3>Con cierre</h3>

                    <PixelCanvas
                        matrix={after}
                        scale={scale}
                        onPick={pick}
                    />
                </div>

            </div>


            {/* ---------- cara seleccionada ---------- */}

            {selected && tile && (

                <div className="closure-selected">

                    <h3>
                        Cara #{selected.id}
                        {" — "}
                        {selected.source === "outline"
                            ? "cerrada por contorno"
                            : `cerrada por cierre (ronda ${selected.round})`}
                    </h3>

                    <div className="closure-selected-body">

                        <PixelCanvas
                            matrix={tile}
                            scale={
                                Math.max(
                                    4,
                                    Math.min(
                                        24,
                                        Math.floor(
                                            160 /
                                            Math.max(
                                                tile.length,
                                                tile[0].length
                                            )
                                        )
                                    )
                                )
                            }
                        />

                        <div>

                            <div>Área: {selected.area}</div>

                            <div>Tipo: {selected.kind}</div>

                            <div>
                                Contacto con contorno:{" "}
                                {(selected.outlineContact * 100)
                                    .toFixed(0)}%
                            </div>

                            <div>
                                Score: {selected.score.toFixed(1)}
                            </div>

                            <div>
                                Familia de iluminación:{" "}
                                {selected.familyIndex >= 0
                                    ? selected.familyIndex + 1
                                    : "—"}
                            </div>

                            <div>
                                Contenido:
                                {selected.composition.map(item => (
                                    <span
                                        key={item.cloud}
                                        className="closure-chip"
                                    >
                                        <Swatch
                                            palette={labelMap.palette}
                                            index={item.cloud}
                                        />
                                        {item.count}
                                    </span>
                                ))}
                            </div>

                            {selected.closerIds.map(id => {

                                const closer = result.closers[id];

                                return (
                                    <div key={id}>
                                        Tapón #{id}:{" "}
                                        {closer.clouds.map(cloud => (
                                            <Swatch
                                                key={cloud}
                                                palette={labelMap.palette}
                                                index={cloud}
                                            />
                                        ))}
                                        {" "}coste {closer.cost} px
                                        {" → "}ganancia {closer.gain} px
                                        {" "}({closer.faceIds.length} cara
                                        {closer.faceIds.length === 1
                                            ? ""
                                            : "s"})
                                    </div>
                                );
                            })}

                        </div>

                    </div>

                </div>
            )}


            {/* ---------- tapones ---------- */}

            <h3>Mejores tapones</h3>

            <table className="closure-table">

                <thead>
                    <tr>
                        <th>#</th>
                        <th>Ronda</th>
                        <th>Nubes</th>
                        <th>Coste</th>
                        <th>Ganancia</th>
                        <th>Score</th>
                        <th>Caras</th>
                    </tr>
                </thead>

                <tbody>
                    {topClosers.map(closer => (
                        <tr
                            key={closer.id}
                            onClick={() =>
                                setSelectedFaceId(
                                    closer.faceIds[0] ?? null
                                )
                            }
                        >
                            <td>{closer.id}</td>
                            <td>{closer.round}</td>
                            <td>
                                {closer.clouds.map(cloud => (
                                    <Swatch
                                        key={cloud}
                                        palette={labelMap.palette}
                                        index={cloud}
                                    />
                                ))}
                            </td>
                            <td>{closer.cost}</td>
                            <td>{closer.gain}</td>
                            <td>{closer.score.toFixed(1)}</td>
                            <td>{closer.faceIds.length}</td>
                        </tr>
                    ))}
                </tbody>

            </table>


            {/* ---------- familias ---------- */}

            <h3>Caras por familia de iluminación</h3>

            <div className="closure-families">

                {result.families.map(group => {

                    const family =
                        families[group.familyIndex];

                    return (
                        <div
                            key={group.familyIndex}
                            className="closure-family"
                        >

                            <div>
                                <b>
                                    Familia{" "}
                                    {group.familyIndex >= 0
                                        ? group.familyIndex + 1
                                        : "—"}
                                </b>
                            </div>

                            <div>
                                {family?.members.map(member => (
                                    <Swatch
                                        key={member.cloud.index}
                                        palette={labelMap.palette}
                                        index={member.cloud.index}
                                    />
                                ))}
                            </div>

                            <div>{group.faceIds.length} caras</div>

                            <div>
                                {group.closureFaceCount} por cierre
                            </div>

                            <div>{group.area} px</div>

                        </div>
                    );
                })}

            </div>

        </section>
    );
}
