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


    const matrix =
        useMemo(
            () => {

                // La forma siempre permanece centrada.
                const shape =
                    createEllipse(
                        50,
                        50,
                        width,
                        height,
                        rotation
                    );


                // La textura se desplaza DENTRO
                // de la forma mediante offsetX / offsetY.
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
                                minDistance: 0,
                                maxDistance: 2,

                                color: {
                                    r: 0,
                                    g: 35,
                                    b: 120,
                                    a: 255
                                }
                            },

                            {
                                minDistance: 2,
                                maxDistance: 4,

                                color: {
                                    r: 0,
                                    g: 120,
                                    b: 240,
                                    a: 255
                                }
                            },

                            {
                                minDistance: 4,
                                maxDistance: 6,

                                color: {
                                    r: 80,
                                    g: 190,
                                    b: 255,
                                    a: 255
                                }
                            }
                        ]
                    );


                return rasterizeShape(
                    shape,
                    texture,
                    100,
                    100
                );
            },
            [
                width,
                height,
                rotation,
                offsetX,
                offsetY
            ]
        );


    return (

        <div className="texture-lab">

            <h2>
                Texture Lab
            </h2>


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


            <h3>
                Generated Shape
            </h3>

            <MatrixCanvas
                matrix={matrix}
            />

        </div>
    );
}