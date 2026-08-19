import { useRef, useState } from "react";
import "./App.css";

import type {
    ColorLayer,
    AssemblyFamily,
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
    createAssemblyFamilies,
    analyzeStrokeGraph,
    strokeGraphToMatrix,
    detectStrokeFaces,
    strokeFacesToMatrix,
    analyzeFaceContents,
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

    const [assemblyFamilies, setAssemblyFamilies] =
        useState<AssemblyFamily[]>([]);
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
const strokeLayer = layers.find(
    layer =>
        layer.color.r === 0 &&
        layer.color.g === 0 &&
        layer.color.b === 0
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

        const families =
            createAssemblyFamilies(
                matrix,
                layers
            );

        console.log(
            "ASSEMBLY FAMILIES:",
            families
        );

        setAssemblyFamilies(
            families
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
                                        Pixels:{" "}
                                        {layer.pixelCount}
                                    </div>


                                    <div>
                                        Subgroups:{" "}
                                        {layer.subgroupCount}
                                    </div>


                                    <div>
                                        Single pixels:{" "}
                                        {
                                            layer.singlePixelSubgroupCount
                                        }
                                    </div>


                                    <div>
                                        Strokes:{" "}
                                        {
                                            layer.strokeSubgroupCount
                                        }
                                    </div>


                                    <div>
                                        Border:{" "}
                                        {
                                            (
                                                layer.borderRatio *
                                                100
                                            ).toFixed(1)
                                        }
                                        %
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


                <div className="assembly-families">

                    {assemblyFamilies.map(
                        (family, index) => {

                            const indexA =
                                colorLayers.indexOf(
                                    family.cloudA
                                );

                            const indexB =
                                colorLayers.indexOf(
                                    family.cloudB
                                );

                            return (

                                <div
                                    className="assembly-family"
                                    key={index}
                                >

                                    <h3>
                                        Family {index + 1}
                                    </h3>


                                    <div>
                                        Color {indexA + 1}
                                        {" + "}
                                        Color {indexB + 1}
                                    </div>


                                    <MatrixCanvas
                                        matrix={
                                            family.matrix
                                        }
                                    />


                                    <div className="family-stats">

                                        Contact pixels:{" "}
                                        {
                                            family.contactPixels
                                        }

                                    </div>

                                </div>

                            );

                        }
                    )}

                </div>
  <h2>
                    Tonal families
                </h2>
            </section>

        </div>

    );

}

export default App;