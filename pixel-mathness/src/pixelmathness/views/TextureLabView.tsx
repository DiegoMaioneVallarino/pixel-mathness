import {
    useMemo,
    useState
} from "react";

import {
    MatrixCanvas
} from "../../components/MatrixCanvas";

import {
    createEllipse
} from "../../generation/shapes/createEllipse";

import {
    rasterizeShape
} from "../../generation/raster/rasterizeShape";

import {
    inlineTexture
} from "../../generation/textures/inlineTexture";

import {
    starWarp
} from "../../generation/transforms/starWarp";

import type {
    PixelMatrix
} from "../types/PixelMatrix";
import {
    loadImage,
    imageToMatrix
} from "../index";

import type {
    TransformType
} from "../../generation/transforms/types";

import {
    applyTransform
} from "../../generation/transforms/applyTransform";

export function TextureLabView() {

    const [width, setWidth] =
        useState(40);

    const [height, setHeight] =
        useState(20);

    const [rotation, setRotation] =
        useState(0);

    const [offsetX, setOffsetX] =
        useState(0);

    const [offsetY, setOffsetY] =
        useState(0);

    const [band1Width, setBand1Width] =
        useState(2);

    const [band2Width, setBand2Width] =
        useState(2);

    const [band3Width, setBand3Width] =
        useState(2);
    
    const [band4Width, setBand4Width] =
    useState(2);

    const [band5Width, setBand5Width] =
    useState(2);

    const [
    transformType,
    setTransformType
] =
    useState<TransformType>(
        "star"
    );

    const [
        transformAmount,
        setTransformAmount
    ] = useState(0);

    const [sourceMode, setSourceMode] =
    useState<"bands" | "image">("bands");

const [loadedMatrix, setLoadedMatrix] =
    useState<PixelMatrix | null>(null);

    

    const STAR_STRENGTH = 0.35;

    async function handleTextureImage(
    event: React.ChangeEvent<HTMLInputElement>
) {
    const file =
        event.target.files?.[0];

    if (!file) return;

    const image =
        await loadImage(file);

    const loaded =
        imageToMatrix(image);

    setLoadedMatrix(loaded);
    setSourceMode("image");
}

    const matrix =
    useMemo(
        () => {

            let sourceMatrix: PixelMatrix;


            // =========================
            // SOURCE: GENERATED BANDS
            // =========================

            if (
                sourceMode === "bands" ||
                !loadedMatrix
            ) {

                const shape =
                    createEllipse(
                        50,
                        50,
                        width,
                        height,
                        rotation
                    );

                const texture =
                    inlineTexture(
                        {
                            r: 0,
                            g: 90,
                            b: 210,
                            a: 255
                        },

                        offsetX,
                        offsetY,

                        [
                            {
                                width: band1Width,
                                color: {
                                    r: 0,
                                    g: 153,
                                    b: 251,
                                    a: 255
                                }
                            },

                            {
                                width: band2Width,
                                color: {
                                    r: 0,
                                    g: 124,
                                    b: 243,
                                    a: 255
                                }
                            },

                            {
                                width: band3Width,
                                color: {
                                    r: 0,
                                    g: 94,
                                    b: 234,
                                    a: 255
                                }
                            },

                            {
                                width: band4Width,
                                color: {
                                    r: 0,
                                    g: 63,
                                    b: 193,
                                    a: 255
                                }
                            },

                            {
                                width: band5Width,
                                color: {
                                    r: 0,
                                    g: 40,
                                    b: 147,
                                    a: 255
                                }
                            }
                        ]
                    );

                sourceMatrix =
                    rasterizeShape(
                        shape,
                        texture,
                        100,
                        100
                    );
            }

            // =========================
            // SOURCE: LOADED IMAGE
            // =========================

            else {
                sourceMatrix =
                    loadedMatrix;
            }


            // =========================
            // TRANSFORMATION
            // =========================

            const centerX =
                sourceMatrix[0].length / 2;

            const centerY =
                sourceMatrix.length / 2;

            return applyTransform(
            sourceMatrix,
            transformType,
            transformAmount
        );
        },

            [
        sourceMode,
        loadedMatrix,

        width,
        height,
        rotation,

        offsetX,
        offsetY,

        band1Width,
        band2Width,
        band3Width,
        band4Width,
        band5Width,

        transformType,
        transformAmount
    ]
    );


    return (

        <div className="texture-lab">

            <h2>
                Texture Lab
            </h2>

<div>

    <h3>
        Texture Source
    </h3>

    <label>
        <input
            type="radio"
            checked={
                sourceMode === "bands"
            }
            onChange={() =>
                setSourceMode("bands")
            }
        />

        Generated Bands
    </label>

    <br />

    <label>
        <input
            type="radio"
            checked={
                sourceMode === "image"
            }
            onChange={() =>
                setSourceMode("image")
            }
        />

        Loaded Texture
    </label>

    <br />

    <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleTextureImage}
    />

</div>
            <div>

                <label>
                    Width: {width}
                </label>

                <input
                    type="range"
                    min="5"
                    max="90"
                    value={width}
                    onChange={
                        event =>
                            setWidth(
                                Number(
                                    event.target.value
                                )
                            )
                    }
                />

            </div>


            <div>

                <label>
                    Height: {height}
                </label>

                <input
                    type="range"
                    min="5"
                    max="90"
                    value={height}
                    onChange={
                        event =>
                            setHeight(
                                Number(
                                    event.target.value
                                )
                            )
                    }
                />

            </div>


            <div>

                <label>
                    Rotation: {rotation}°
                </label>

                <input
                    type="range"
                    min="0"
                    max="180"
                    value={rotation}
                    onChange={
                        event =>
                            setRotation(
                                Number(
                                    event.target.value
                                )
                            )
                    }
                />

            </div>


            <div>

                <label>
                    Texture X: {offsetX}
                </label>

                <input
                    type="range"
                    min="-20"
                    max="20"
                    value={offsetX}
                    onChange={
                        event =>
                            setOffsetX(
                                Number(
                                    event.target.value
                                )
                            )
                    }
                />

            </div>


            <div>

                <label>
                    Texture Y: {offsetY}
                </label>

                <input
                    type="range"
                    min="-20"
                    max="20"
                    value={offsetY}
                    onChange={
                        event =>
                            setOffsetY(
                                Number(
                                    event.target.value
                                )
                            )
                    }
                />

            </div>

            <div>
            <label>
                Inline 1 Width: {band1Width}
            </label>

            <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={band1Width}
                onChange={event =>
                    setBand1Width(
                        Number(event.target.value)
                    )
                }
            />
        </div>

        <div>
            <label>
                Inline 2 Width: {band2Width}
            </label>

            <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={band2Width}
                onChange={event =>
                    setBand2Width(
                        Number(event.target.value)
                    )
                }
            />
        </div>

        <div>
            <label>
                Inline 3 Width: {band3Width}
            </label>

            <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={band3Width}
                onChange={event =>
                    setBand3Width(
                        Number(event.target.value)
                    )
                }
            />
        </div>

        <div>
            <label>
                Inline 4 Width: {band4Width}
            </label>

            <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={band4Width}
                onChange={event =>
                    setBand4Width(
                        Number(event.target.value)
                    )
                }
            />
        </div>

        <div>
            <label>
                Inline 5 Width: {band5Width}
            </label>

            <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={band5Width}
                onChange={event =>
                    setBand5Width(
                        Number(event.target.value)
                    )
                }
            />
        </div>



            <h3>
                Generated Shape
            </h3>

            <MatrixCanvas
                matrix={matrix}
            />


            <div>

    <label>
        Transform:{" "}
    </label>

    <select
        value={transformType}
        onChange={event =>
            setTransformType(
                event.target.value as TransformType
            )
        }
    >
        <option value="none">
            None
        </option>

        <option value="star">
            Star
        </option>

        <option value="bulge">
            Bulge
        </option>

        <option value="pinch">
            Pinch
        </option>

        <option value="wave">
            Wave
        </option>

        <option value="twist">
            Twist
        </option>

        <option value="shear">
            Shear
        </option>

    </select>

</div>
<div>
    <label>
        Matrix Transformation:{" "}
        {transformAmount.toFixed(2)}
    </label>

    <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={transformAmount}
        onChange={event =>
            setTransformAmount(
                Number(event.target.value)
            )
        }
    />
</div>
        </div>
        
    );
}