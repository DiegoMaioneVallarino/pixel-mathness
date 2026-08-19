import { useRef, useState } from "react";
import "./App.css";

import type {
    ColorLayer,
    AssemblyHierarchy,
    AnalyzedFace,
    PixelMatrix
} from "./pixelmathness";

type FaceView = {
    analysis: AnalyzedFace;
    matrix: PixelMatrix;
};
import {
    loadImage,
    imageToMatrix,
    matrixToCanvas,
    extractSilhouette,
    silhouetteToMatrix,
    separateColorLayers,
    createAssemblyHierarchy,
    analyzeStrokeGraph,
    strokeGraphToMatrix,
    detectStrokeFaces,
    strokeFacesToMatrix,
    analyzeFaceContents,
    createOutlineLayer,
    faceToMatrix
} from "./pixelmathness";

import { MatrixCanvas } from "./components/MatrixCanvas";


function App() {

    // =========================
    // REFS
    // =========================

    const originalCanvasRef =
        useRef<HTMLCanvasElement>(null);

    const silhouetteCanvasRef =
        useRef<HTMLCanvasElement>(null);
const [strokeGraphMatrix, setStrokeGraphMatrix] =
    useState<PixelMatrix | null>(null);

    // =========================
    // STATE
    // =========================

    const [colorLayers, setColorLayers] =
        useState<ColorLayer[]>([]);

  const [
    assemblyHierarchy,
    setAssemblyHierarchy
] =
    useState<AssemblyHierarchy | null>(
        null
    );

const [
    strokeFacesMatrix,
    setStrokeFacesMatrix
] = useState<PixelMatrix | null>(null);


    const [faceViews, setFaceViews] =
    useState<FaceView[]>([]);

    // =========================
    // IMAGE LOADING
    // =========================

    async function handleImage(
        event: React.ChangeEvent<HTMLInputElement>
    ) {

        const file = event.target.files?.[0];

        if (!file) return;


        // -------------------------
        // 1. Cargar imagen
        // -------------------------

        const image = await loadImage(file);


        // -------------------------
        // 2. Imagen → PixelMatrix
        // -------------------------

        const matrix = imageToMatrix(image);

        console.log("PIXEL MATRIX:");
        console.log(matrix);


        // -------------------------
        // 3. Detectar fondo
        // -------------------------

        const backgroundColor =
            matrix[0][0];

        console.log(
            "BACKGROUND COLOR:",
            backgroundColor
        );


        // -------------------------
        // 4. Crear silueta
        // -------------------------

        const silhouette =
            extractSilhouette(
                matrix,
                backgroundColor,
                0
            );


        // -------------------------
        // 5. Analizar Color Clouds
        // -------------------------

        // Analizar Color Clouds
const layers = separateColorLayers(matrix);

// Buscar la Color Cloud negra

const OUTLINE_THRESHOLD = 40;

const outlineLayers = layers.filter(layer => {

    const { r, g, b } = layer.color;

    const isPureBlack =
        r === 0 &&
        g === 0 &&
        b === 0;

    const luminance =
        0.2126 * r +
        0.7152 * g +
        0.0722 * b;

    return (
        isPureBlack ||
        luminance <= OUTLINE_THRESHOLD
    );
});

console.log(
    "OUTLINE LAYERS:",
    outlineLayers
);

const strokeLayer =
    createOutlineLayer(
        matrix,
        outlineLayers
    );

// Analizar el stroke
if (strokeLayer) {

    const strokeGraph =
        analyzeStrokeGraph(strokeLayer);
const faces =
    detectStrokeFaces(
        strokeLayer
    ).sort(
        (a, b) => b.area - a.area
    );
const views = faces.map(face => {

    const analysis =
        analyzeFaceContents(
            face,
            matrix
        );

    const faceMatrix =
        faceToMatrix(
            face,
            matrix
        );

    return {
        analysis,
        matrix: faceMatrix
    };
});

setFaceViews(views);
console.log(
    "STROKE FACES:",
    faces
);

console.log(
    "Detected faces:",
    faces.length
);

const facesMatrix =
    strokeFacesToMatrix(
        faces,
        matrix[0].length,
        matrix.length
    );

setStrokeFacesMatrix(
    facesMatrix
);
    console.log("STROKE GRAPH:", strokeGraph);
    console.log("Stroke pixels:", strokeGraph.pixels.length);
    console.log("Endpoints:", strokeGraph.endpoints.length);
    console.log("Path points:", strokeGraph.pathPoints.length);
    console.log("Junctions:", strokeGraph.junctions.length);
    console.log("Isolated:", strokeGraph.isolated.length);

    const graphMatrix =
        strokeGraphToMatrix(
            strokeGraph,
            matrix[0].length,
            matrix.length
        );

    setStrokeGraphMatrix(graphMatrix);
}

setColorLayers(layers);
        console.log(
            "COLOR LAYERS:",
            layers
        );

        console.log(
            "TOTAL COLORS:",
            layers.length
        );

        setColorLayers(layers);


        // -------------------------
        // 6. Assembly Families
        // -------------------------

       const hierarchy =
    createAssemblyHierarchy(
        layers
    );

console.log(
    "ASSEMBLY HIERARCHY:",
    hierarchy
);

setAssemblyHierarchy(
    hierarchy
);


        // -------------------------
        // 7. Stats de silueta
        // -------------------------

        let active = 0;
        let inactive = 0;

        for (const row of silhouette) {

            for (const pixel of row) {

                if (pixel) {
                    active++;
                } else {
                    inactive++;
                }

            }
        }

        console.log(
            "SILHOUETTE STATS:",
            {
                active,
                inactive,
                total:
                    active + inactive
            }
        );


        // -------------------------
        // 8. Silhouette → Matrix
        // -------------------------

        const silhouetteMatrix =
            silhouetteToMatrix(
                silhouette
            );


        // -------------------------
        // 9. Dibujar original
        // -------------------------

        if (
            originalCanvasRef.current
        ) {

            matrixToCanvas(
                matrix,
                originalCanvasRef.current
            );

        }


        // -------------------------
        // 10. Dibujar silueta
        // -------------------------

        if (
            silhouetteCanvasRef.current
        ) {

            matrixToCanvas(
                silhouetteMatrix,
                silhouetteCanvasRef.current
            );

        }

    }


    // =========================
    // UI
    // =========================

    return (

        <div className="app">

            <h1>
                PixelMathness
            </h1>


            {/* =====================
                IMAGE INPUT
            ====================== */}

            <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImage}
            />


            {/* =====================
                ORIGINAL + SILHOUETTE
            ====================== */}

            <div className="canvases">

                <div>

                    <h2>
                        Original
                    </h2>

                    <canvas
                        ref={
                            originalCanvasRef
                        }
                    />

                </div>


                <div>

                    <h2>
                        Silhouette
                    </h2>

                    <canvas
                        ref={
                            silhouetteCanvasRef
                        }
                    />

                </div>

            </div>


            {/* =====================
                COLOR CLOUDS
            ====================== */}

            <section>

                <h2>
                    Color Clouds
                </h2>


                <div className="color-layers">

                    {colorLayers.map(
                        (layer, index) => (

                            <div
                                className="color-layer"
                                key={
                                    `${layer.color.r}-${layer.color.g}-${layer.color.b}-${layer.color.a}`
                                }
                            >

                                <h3>
                                    Color {index + 1}
                                </h3>


                                <div>
                                    rgba(
                                    {layer.color.r},
                                    {layer.color.g},
                                    {layer.color.b},
                                    {layer.color.a}
                                    )
                                </div>


                                <MatrixCanvas
                                    matrix={
                                        layer.matrix
                                    }
                                />


                                <div className="cloud-stats">
<div>
    Pixels: {layer.pixelCount}
</div>

<div>
    Subgroups: {layer.subgroupCount}
</div>

<div>
    Pixel groups: {layer.pixelSubgroupCount}
</div>

<div>
    Lines: {layer.lineSubgroupCount}
</div>

<div>
    Straight: {layer.straightLineCount}
</div>

<div>
    Curves: {layer.curveLineCount}
</div>

<div>
    Loops: {layer.loopLineCount}
</div>

<div>
    Strokes: {layer.strokeSubgroupCount}
</div>

<div>
    Solids: {layer.solidSubgroupCount}
</div>

<div>
    Border: {(layer.borderRatio * 100).toFixed(1)}%
</div>
                                </div>

                            </div>

                        )
                    )}

                </div>

            </section>

<section>
    <h2>Stroke Graph</h2>

    {strokeGraphMatrix && (
        <div>
            <MatrixCanvas
                matrix={strokeGraphMatrix}
            />

            <div>
                Negro = path
                <br />
                Rojo = endpoint
                <br />
                Azul = junction
                <br />
                Verde = isolated
            </div>
        </div>
    )}
</section>
<section>

    <h2>
        Stroke Faces
    </h2>

    {strokeFacesMatrix && (

        <MatrixCanvas
            matrix={
                strokeFacesMatrix
            }
        />

    )}

</section>
<section>

    <h2>Face Contents</h2>

    <div className="face-contents">

        {faceViews.map(
            (view, index) => (

                <div
                    className="face-content"
                    key={view.analysis.face.id}
                >

                    <h3>
                        Face {index + 1}
                    </h3>

                    <MatrixCanvas
                        matrix={view.matrix}
                    />

                    <div>
                        Area:{" "}
                        {view.analysis.pixelCount}
                    </div>

                    {view.analysis.colors.map(
                        (content, colorIndex) => (

                            <div key={colorIndex}>

                                rgba(
                                {content.color.r},
                                {content.color.g},
                                {content.color.b}
                                )

                                {" — "}

                                {
                                    (
                                        content.ratio *
                                        100
                                    ).toFixed(1)
                                }
                                %

                            </div>

                        )
                    )}

                </div>

            )
        )}

    </div>

</section>
            {/* =====================
                ASSEMBLY FAMILIES
            ====================== */}

            <section>

                <h2>
                    Assembly Families
                </h2>


                <section>

    <h2>
        Assembly Hierarchy
    </h2>

    {assemblyHierarchy &&
        assemblyHierarchy.levels.map(
            level => (

                <div
                    className="assembly-level"
                    key={level.level}
                >

                    <h3>
                        Level {level.level}
                    </h3>

                    <div>
                        {level.inputCount}
                        {" → "}
                        {level.output.length}
                    </div>


                    <div className="assembly-families">

                        {level.pairs.map(
                            (
                                pair,
                                index
                            ) => (

                                <div
                                    className="assembly-family"
                                    key={index}
                                >

                                    <h4>
                                        {
                                            pair.nodeA.id
                                        }
                                        {" + "}
                                        {
                                            pair.nodeB.id
                                        }
                                    </h4>

                                    <MatrixCanvas
                                        matrix={
                                            pair.result.matrix
                                        }
                                    />

                                    <div>
                                        Contact:{" "}
                                        {
                                            pair.contactPixels
                                        }
                                    </div>

                                    <div>
                                        Clouds:{" "}
                                        {
                                            pair.result.clouds.length
                                        }
                                    </div>

                                    <div>
                                        Pixels:{" "}
                                        {
                                            pair.result.pixelCount
                                        }
                                    </div>

                                </div>

                            )
                        )}


                        {level.carry && (

                            <div className="assembly-family">

                                <h4>
                                    {
                                        level.carry.id
                                    }
                                    {" "}
                                    (carry)
                                </h4>

                                <MatrixCanvas
                                    matrix={
                                        level.carry.matrix
                                    }
                                />

                            </div>

                        )}

                    </div>

                </div>

            )
        )
    }


    {assemblyHierarchy?.root && (

        <div>

            <h3>
                Final Assembly
            </h3>

            <MatrixCanvas
                matrix={
                    assemblyHierarchy
                        .root
                        .matrix
                }
            />

            <div>
                Clouds:{" "}
                {
                    assemblyHierarchy
                        .root
                        .clouds
                        .length
                }
            </div>

        </div>

    )}

</section>
  <h2>
                    Tonal families
                </h2>
            </section>

        </div>

    );

}

export default App;