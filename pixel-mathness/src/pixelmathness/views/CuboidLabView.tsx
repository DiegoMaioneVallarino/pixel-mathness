import {
    useMemo,
    useState
} from "react";

import {
    MatrixCanvas
} from "../../components/MatrixCanvas";

import type {
    PrimaryObject
} from "../../generation/cuboids/types";

import {
    rasterizeCuboidObject
} from "../../generation/cuboids/rasterizeCuboidObject";

import {
    defaultCuboidPalette,
    shiftPaletteHue
} from "../../generation/cuboids/cuboidPalette";

import {
    colorizeCuboidStructure
} from "../../generation/cuboids/colorizeCuboidStructure";

type LibraryMode =
    | "primary"
    | "composite";




export function CuboidLabView() {
const [
    libraryMode,
    setLibraryMode
] = useState<LibraryMode>(
    "primary"
);
    const [
        surfaceAlpha,
        setSurfaceAlpha
    ] = useState(1);


    const [
        primaryObjects,
        setPrimaryObjects
    ] = useState<PrimaryObject[]>([
       {
    id: "object-1",
    name: "Object 1",

    cuboid: {
        x: 0,
        y: 0,
        z: 0,

        width: 40,
        depth: 30,
        height: 20
    },

    appearance: {
        alpha: 1,
        hue: 0
    }
}
    ]);


    const [
        selectedPrimaryId,
        setSelectedPrimaryId
    ] = useState<string>(
        "object-1"
    );

        const [
        hueShift,
        setHueShift
    ] = useState(0);

    const selectedPrimary =
        primaryObjects.find(
            object =>
                object.id === selectedPrimaryId
        ) ?? null;

const palette = useMemo(
    () =>
        shiftPaletteHue(
            defaultCuboidPalette,
            hueShift
        ),
    [hueShift]
);
const structure = useMemo(
    () =>
        rasterizeCuboidObject(
            primaryObjects,
            250,
            250
        ),
    [
        primaryObjects
    ]
);


const matrix = useMemo(
    () =>
        colorizeCuboidStructure(
            structure,
            primaryObjects,
            0.45,
            0.25
        ),
    [
        structure,
        primaryObjects
    ]
);

function createPrimaryObject() {

    const id =
        `object-${Date.now()}`;


    const newObject: PrimaryObject = {
    appearance: {
        alpha: 1,
        hue: 0
    },
        id,

        name:
            `Object ${primaryObjects.length + 1}`,

        cuboid: {
            x: 0,
            y: 0,
            z: 0,

            width: 20,
            depth: 20,
            height: 20
        }
    };


    setPrimaryObjects(
        previous => [
            ...previous,
            newObject
        ]
    );


    setSelectedPrimaryId(
        id
    );
}

function duplicatePrimary(
    id: string
) {
    const source =
        primaryObjects.find(
            object =>
                object.id === id
        );

    if (!source) {
        return;
    }

    const newId =
        `object-${Date.now()}`;

    const duplicate: PrimaryObject = {
        ...source,

        id: newId,

        name:
            `${source.name} copy`,

        cuboid: {
            ...source.cuboid,

            // pequeño offset para que
            // no quede exactamente encima
            x: source.cuboid.x + 4,
            y: source.cuboid.y + 4
        },

        appearance: {
            ...source.appearance
        }
    };


    setPrimaryObjects(
        previous => {

            const index =
                previous.findIndex(
                    object =>
                        object.id === id
                );

            const copy =
                [...previous];

            copy.splice(
                index + 1,
                0,
                duplicate
            );

            return copy;
        }
    );


    setSelectedPrimaryId(
        newId
    );
}

function deleteSelectedPrimary() {

    if (!selectedPrimaryId) {
        return;
    }


    const remaining =
        primaryObjects.filter(
            object =>
                object.id !==
                selectedPrimaryId
        );


    setPrimaryObjects(
        remaining
    );


    setSelectedPrimaryId(
        remaining[0]?.id ??
        null
    );
}

function updatePrimaryAppearance(
    id: string,
    changes: Partial<
        PrimaryObject["appearance"]
    >
) {
    setPrimaryObjects(
        previous =>
            previous.map(
                object =>
                    object.id === id
                        ? {
                            ...object,
                            appearance: {
                                ...object.appearance,
                                ...changes
                            }
                        }
                        : object
            )
    );
}


function movePrimary(
    id: string,
    direction: -1 | 1
) {
    setPrimaryObjects(
        previous => {

            const index =
                previous.findIndex(
                    object =>
                        object.id === id
                );

            if (index === -1) {
                return previous;
            }

            const targetIndex =
                index + direction;

            if (
                targetIndex < 0 ||
                targetIndex >= previous.length
            ) {
                return previous;
            }

            const copy =
                [...previous];

            [
                copy[index],
                copy[targetIndex]
            ] = [
                copy[targetIndex],
                copy[index]
            ];

            return copy;
        }
    );
}

    function updateSelectedCuboid(
        changes:
            Partial<
                PrimaryObject["cuboid"]
            >
    ) {

        setPrimaryObjects(
            previous =>
                previous.map(
                    object => {

                        if (
                            object.id !==
                            selectedPrimaryId
                        ) {
                            return object;
                        }

                        return {
                            ...object,

                            cuboid: {
                                ...object.cuboid,
                                ...changes
                            }
                        };
                    }
                )
        );
    }


    return (

    <div className="cuboid-lab">

        <h2>
            Cuboid Lab
        </h2>


        <div className="cuboid-lab-layout">

            <main className="cuboid-main">

                {selectedPrimary && (

                    <>

                        {/* ================================= */}
                        {/* TUS CONTROLES ACTUALES SE QUEDAN */}
                        {/* ================================= */}

                        <div>
                            <label>
                                Width: {
                                    selectedPrimary
                                        .cuboid
                                        .width
                                }
                            </label>

                            <input
                                type="range"
                                min="2"
                                max="120"
                                step="2"
                                value={
                                    selectedPrimary
                                        .cuboid
                                        .width
                                }
                                onChange={
                                    event =>
                                        updateSelectedCuboid({
                                            width:
                                                Number(
                                                    event
                                                        .target
                                                        .value
                                                )
                                        })
                                }
                            />
                        </div>


                        <div>
                            <label>
                                Depth: {
                                    selectedPrimary
                                        .cuboid
                                        .depth
                                }
                            </label>

                            <input
                                type="range"
                                min="2"
                                max="100"
                                step="2"
                                value={
                                    selectedPrimary
                                        .cuboid
                                        .depth
                                }
                                onChange={
                                    event =>
                                        updateSelectedCuboid({
                                            depth:
                                                Number(
                                                    event
                                                        .target
                                                        .value
                                                )
                                        })
                                }
                            />
                        </div>


                        <div>
                            <label>
                                Height: {
                                    selectedPrimary
                                        .cuboid
                                        .height
                                }
                            </label>

                            <input
                                type="range"
                                min="0"
                                max="60"
                                step="1"
                                value={
                                    selectedPrimary
                                        .cuboid
                                        .height
                                }
                                onChange={
                                    event =>
                                        updateSelectedCuboid({
                                            height:
                                                Number(
                                                    event
                                                        .target
                                                        .value
                                                )
                                        })
                                }
                            />
                        </div>


                        <div>
                            <label>
                                X: {
                                    selectedPrimary
                                        .cuboid
                                        .x
                                }
                            </label>

                            <input
                                type="range"
                                min="-100"
                                max="100"
                                step="1"
                                value={
                                    selectedPrimary
                                        .cuboid
                                        .x
                                }
                                onChange={
                                    event =>
                                        updateSelectedCuboid({
                                            x:
                                                Number(
                                                    event
                                                        .target
                                                        .value
                                                )
                                        })
                                }
                            />
                        </div>


                        <div>
                            <label>
                                Y: {
                                    selectedPrimary
                                        .cuboid
                                        .y
                                }
                            </label>

                            <input
                                type="range"
                                min="-100"
                                max="100"
                                step="1"
                                value={
                                    selectedPrimary
                                        .cuboid
                                        .y
                                }
                                onChange={
                                    event =>
                                        updateSelectedCuboid({
                                            y:
                                                Number(
                                                    event
                                                        .target
                                                        .value
                                                )
                                        })
                                }
                            />
                        </div>


                        <div>
                            <label>
                                Z: {
                                    selectedPrimary
                                        .cuboid
                                        .z
                                }
                            </label>

                            <input
                                type="range"
                                min="-100"
                                max="100"
                                step="1"
                                value={
                                    selectedPrimary
                                        .cuboid
                                        .z
                                }
                                onChange={
                                    event =>
                                        updateSelectedCuboid({
                                            z:
                                                Number(
                                                    event
                                                        .target
                                                        .value
                                                )
                                        })
                                }
                            />
                        </div>

                    </>

                )}


                <h3>
                    Isometric Cuboid
                </h3>

                <MatrixCanvas
                    matrix={matrix}
                />

            </main>


            {/* ================================= */}
            {/* NUEVA RIGHTBAR                   */}
            {/* ================================= */}

            <aside className="cuboid-rightbar">

                <div className="rightbar-tabs">

                    <button
                        onClick={() =>
                            setLibraryMode(
                                "primary"
                            )
                        }
                    >
                        PRIMARY
                    </button>

                    <button
                        onClick={() =>
                            setLibraryMode(
                                "composite"
                            )
                        }
                    >
                        COMPOSITE
                    </button>

                </div>


                {libraryMode === "primary" && (

                    <>

                        <button
                            onClick={
                                createPrimaryObject
                            }
                        >
                            + Primitive
                        </button>


                        <div className="layer-list">

    {[...primaryObjects]
        .reverse()
        .map(
            object => (

                <div
                    key={object.id}

                    className={
                        object.id ===
                        selectedPrimaryId
                            ? "layer-item selected"
                            : "layer-item"
                    }
                >

                    {/* NOMBRE + ORDEN */}

                    <div className="layer-header">

                        <button
                            className="layer-name"

                            onClick={() =>
                                setSelectedPrimaryId(
                                    object.id
                                )
                            }
                        >
                            {object.name}
                        </button>


                        <div className="layer-buttons">

    <button
        onClick={() =>
            duplicatePrimary(
                object.id
            )
        }
        title="Duplicate"
    >
        ⧉
    </button>


    <button
        onClick={() =>
            movePrimary(
                object.id,
                1
            )
        }
        title="Move up"
    >
        ↑
    </button>


    <button
        onClick={() =>
            movePrimary(
                object.id,
                -1
            )
        }
        title="Move down"
    >
        ↓
    </button>

</div>

                    </div>


                    {/* ALPHA DEL OBJETO */}

                    <div className="layer-control">

                        <label>
                            Alpha: {
                                object.appearance.alpha.toFixed(2)
                            }
                        </label>

                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"

                            value={
                                object.appearance.alpha
                            }

                            onChange={
                                event =>
                                    updatePrimaryAppearance(
                                        object.id,
                                        {
                                            alpha:
                                                Number(
                                                    event.target.value
                                                )
                                        }
                                    )
                            }
                        />

                    </div>


                    {/* HUE DEL OBJETO */}

                    <div className="layer-control">

                        <label>
                            Hue: {
                                object.appearance.hue
                            }°
                        </label>

                        <input
                            type="range"
                            min="0"
                            max="360"
                            step="1"

                            value={
                                object.appearance.hue
                            }

                            onChange={
                                event =>
                                    updatePrimaryAppearance(
                                        object.id,
                                        {
                                            hue:
                                                Number(
                                                    event.target.value
                                                )
                                        }
                                    )
                            }
                        />

                    </div>

                </div>

            )
        )}

</div>


                        <button
                            onClick={
                                deleteSelectedPrimary
                            }

                            disabled={
                                !selectedPrimaryId
                            }
                        >
                            Delete
                        </button>

                    </>

                )}


                {libraryMode === "composite" && (

                    <div>
                        No composites yet
                    </div>

                )}

            </aside>

        </div>

    </div>
);
}