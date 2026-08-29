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
            palette,
            surfaceAlpha,
            0.45,
            0.25
        ),
    [
        structure,
        palette,
        surfaceAlpha
    ]
);

function createPrimaryObject() {

    const id =
        `object-${Date.now()}`;


    const newObject: PrimaryObject = {

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

<div className="cuboid-library">

    <div className="library-tabs">

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

        <div>

            <button
                onClick={
                    createPrimaryObject
                }
            >
                + New Primitive
            </button>


            <div className="primary-list">

                {primaryObjects.map(
                    object => (

                        <button
                            key={
                                object.id
                            }

                            onClick={() =>
                                setSelectedPrimaryId(
                                    object.id
                                )
                            }
                        >
                            {object.name}
                        </button>

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

        </div>

    )}


    {libraryMode === "composite" && (

        <div>
            No composites yet
        </div>

    )}

</div>
            {selectedPrimary && (

                <>

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


            <div>
                <label>
                    Surface Alpha: {
                        surfaceAlpha.toFixed(2)
                    }
                </label>

                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"

                    value={
                        surfaceAlpha
                    }

                    onChange={
                        event =>
                            setSurfaceAlpha(
                                Number(
                                    event
                                        .target
                                        .value
                                )
                            )
                    }
                />
            </div>

                    <div>
    <label>
        Hue: {hueShift}°
    </label>

    <input
        type="range"
        min="0"
        max="360"
        step="1"
        value={hueShift}
        onChange={event =>
            setHueShift(
                Number(event.target.value)
            )
        }
    />
</div>
            <h3>
                Isometric Cuboid
            </h3>


            <MatrixCanvas
                matrix={matrix}
            />

        </div>
    );
}