import {
    useEffect,
    useMemo,
    useState
} from "react";

import type {
    Point2D,
    VectorShape,
    VectorGroup,
    SpawnGenerator,
    StarSpawnGenerator,
    SpawnInstance
} from "../../generation/vectorLab/types";


import {
    expandStarSpawn
} from "../../generation/vectorLab/expandStarSpawn";

import {
    transformPoint
} from "../../generation/vectorLab/transformPoint";

import { cleanDigitalPath } from "../../generation/vectorLab/cleanDigitalPath";

import {
    sampleQuadraticBezier
} from "../../generation/vectorLab/sampleQuadraticBezier";

import {
    rasterizeQuadraticBezier
} from "../../generation/vectorLab/rasterizeBezier";

import {
    rasterizeLineBresenham
} from "../../generation/vectorLab/rasterizeLineBresenham";

import {
    rasterizeEllipse
} from "../../generation/vectorLab/rasterizeEllipse";

import {
    mirrorPointAcrossLine
} from "../../generation/vectorLab/mirrorPointAcrossLine";

import {
    fillPolygon
} from "../../generation/vectorLab/fillPolygon";

type VectorTool =
    | "select"
    | "line"
    | "bezier"
    | "ellipse"
    | "rectangle"
    | "butterfly";


const GRID_WIDTH = 256;
const GRID_HEIGHT = 256;


export  function VectorLabView() {

    const [
        selectedTool,
        setSelectedTool
    ] = useState<VectorTool>("select");

    const [
        zoom,
        setZoom
    ] = useState(16);

    const [
        selectedColor,
        setSelectedColor
    ] = useState("#39b54a");

    const [
        strokeEnabled,
        setStrokeEnabled
    ] = useState(true);

    const [
        strokeColor,
        setStrokeColor
    ] = useState("#000000");

    const [
        shapes,
        setShapes
    ] = useState<VectorShape[]>([]);
    
    const [
    groups,
    setGroups
] = useState<VectorGroup[]>([]);
const [
    spawnGenerators,
    setSpawnGenerators
] = useState<SpawnGenerator[]>([]);


const [
    selectedGeneratorId,
    setSelectedGeneratorId
] = useState<string | null>(
    null
);

const [
    selectedGroupId,
    setSelectedGroupId
] = useState<string | null>(null);


    const [
        selectedShapeId,
        setSelectedShapeId
    ] = useState<string | null>(null);



const selectedGenerator =
    spawnGenerators.find(
        generator =>
            generator.id ===
            selectedGeneratorId
    ) ?? null;



    const [
    selectedShapeIds,
    setSelectedShapeIds
] = useState<string[]>([]);

    const [
        draftPoints,
        setDraftPoints
    ] = useState<Point2D[]>([]);


    useEffect(
        () => {
            setDraftPoints([]);
        },
        [selectedTool]
    );


    const selectedShape =
        shapes.find(
            shape =>
                shape.id === selectedShapeId
        ) ?? null;

        const selectedGroup =
    groups.find(
        group =>
            group.id === selectedGroupId
    ) ?? null;


    const gridStyle =
        useMemo(
            () => ({
                width:
                    `${GRID_WIDTH * zoom}px`,

                height:
                    `${GRID_HEIGHT * zoom}px`,

                backgroundSize:
                    `${zoom}px ${zoom}px`
            }),
            [zoom]
        );


    function clamp(
        value: number,
        min: number,
        max: number
    ) {
        return Math.max(
            min,
            Math.min(max, value)
        );
    }


    function getGridPoint(
        event: React.MouseEvent<HTMLDivElement>
    ): Point2D {

        const rect =
            event.currentTarget.getBoundingClientRect();

        const localX =
            event.clientX - rect.left;

        const localY =
            event.clientY - rect.top;

        const x =
            clamp(
                Math.floor(localX / zoom),
                0,
                GRID_WIDTH - 1
            );

        const y =
            clamp(
                Math.floor(localY / zoom),
                0,
                GRID_HEIGHT - 1
            );

        return { x, y };
    }

    function createStarSpawnFromSelectedShape() {

    if (!selectedShape) {
        return;
    }


    const center =
        getShapeCenter(
            selectedShape
        );


    const newGenerator:
        StarSpawnGenerator = {

        id:
            crypto.randomUUID(),

        name:
            `Star ${spawnGenerators.length + 1}`,

        kind:
            "star-spawn",

        target: {
            kind: "shape",
            id: selectedShape.id
        },

        center,

        count: 8,

        radius: 20,

        angleOffset: 0,

        scale: 1,

        rotationMode:
            "outward"
    };


    setSpawnGenerators(
        previous => [
            ...previous,
            newGenerator
        ]
    );


    setSelectedGeneratorId(
        newGenerator.id
    );

    setSelectedShapeId(
        null
    );

    setSelectedGroupId(
        null
    );
}

    function handleGridClick(
        event: React.MouseEvent<HTMLDivElement>
    ) {

        const point =
            getGridPoint(event);

        if (selectedTool === "select") {
            setDraftPoints([]);
            return;
        }
        


        if (selectedTool === "butterfly") {

    const nextPoints = [
        ...draftPoints,
        point
    ];


    if (nextPoints.length < 3) {

        setDraftPoints(
            nextPoints
        );

        return;
    }


    const newShape: VectorShape = {

        id:
            crypto.randomUUID(),

        name:
            `Butterfly ${shapes.length + 1}`,

        kind:
            "butterfly",

        start:
            nextPoints[0],

        end:
            nextPoints[1],

        control:
            nextPoints[2],
            rotation: 0,

        scale: 1,

        strokeColor,

        fillColor:
            selectedColor,

        strokeEnabled,

        fillEnabled:
            true
    };


    setShapes(
        previous => [
            ...previous,
            newShape
        ]
    );

    setSelectedShapeId(
        newShape.id
    );

    setDraftPoints([]);
}

if (selectedTool === "rectangle") {

    const nextPoints = [
        ...draftPoints,
        point
    ];


    if (nextPoints.length < 2) {

        setDraftPoints(
            nextPoints
        );

        return;
    }


    const newShape: VectorShape = {

        id:
            crypto.randomUUID(),

        name:
            `Rectangle ${shapes.length + 1}`,

        kind:
            "rectangle",

        start:
            nextPoints[0],

        end:
            nextPoints[1],

        strokeColor,

        fillColor:
            selectedColor,

        strokeEnabled,

        fillEnabled:
            true
    };


    setShapes(
        previous => [
            ...previous,
            newShape
        ]
    );

    setSelectedShapeId(
        newShape.id
    );

    setDraftPoints([]);
}



    if (selectedTool === "line") {

    const nextPoints = [
        ...draftPoints,
        point
    ];


    if (nextPoints.length < 2) {

        setDraftPoints(
            nextPoints
        );

        return;
    }


    const newShape: VectorShape = {

        id:
            crypto.randomUUID(),

        name:
            `Line ${shapes.length + 1}`,

        kind:
            "line",

        start:
            nextPoints[0],

        end:
            nextPoints[1],

        strokeColor,

        fillColor:
            selectedColor,

        strokeEnabled,

        fillEnabled:
            false
    };


    setShapes(
        previous => [
            ...previous,
            newShape
        ]
    );


    setSelectedShapeId(
        newShape.id
    );


    setDraftPoints([]);
}

if (selectedTool === "ellipse") {

    const nextPoints = [
        ...draftPoints,
        point
    ];


    if (nextPoints.length < 2) {

        setDraftPoints(
            nextPoints
        );

        return;
    }


    const center =
        nextPoints[0];

    const edge =
        nextPoints[1];


    const radiusX =
        Math.max(
            1,
            Math.abs(
                edge.x -
                center.x
            )
        );

    const radiusY =
        Math.max(
            1,
            Math.abs(
                edge.y -
                center.y
            )
        );


    const newShape: VectorShape = {

        id:
            crypto.randomUUID(),

        name:
            `Ellipse ${shapes.length + 1}`,

        kind:
            "ellipse",

        center,

        radiusX,
        radiusY,

        strokeColor,

        fillColor:
            selectedColor,

        strokeEnabled,

        fillEnabled:
            true
    };


    setShapes(
        previous => [
            ...previous,
            newShape
        ]
    );


    setSelectedShapeId(
        newShape.id
    );


    setDraftPoints([]);
}


        if (selectedTool === "bezier") {

            const nextPoints = [
                ...draftPoints,
                point
            ];

            if (nextPoints.length < 3) {
                setDraftPoints(nextPoints);
                return;
            }

            const newShape: VectorShape = {
                id: crypto.randomUUID(),
                name:
                    `Bezier ${shapes.length + 1}`,

                kind:
                    "quadratic-bezier",

                start: nextPoints[0],
                control: nextPoints[1],
                end: nextPoints[2],

                strokeColor,
                fillColor: selectedColor,

                strokeEnabled,
                fillEnabled: true
            };

            setShapes(
                previous => [
                    ...previous,
                    newShape
                ]
            );

            setSelectedShapeId(
                newShape.id
            );

            setDraftPoints([]);
        }
    }
function createGroupFromSelection() {

    const alreadyGroupedIds =
        new Set(
            groups.flatMap(
                group =>
                    group.shapeIds
            )
        );


    const availableShapeIds =
        selectedShapeIds.filter(
            id =>
                !alreadyGroupedIds.has(id)
        );


    if (
        availableShapeIds.length < 2
    ) {
        return;
    }


    const newGroup: VectorGroup = {

        id:
            crypto.randomUUID(),

        name:
            `Group ${groups.length + 1}`,

        shapeIds:
            availableShapeIds,

        rotation: 0,

        scale: 1
    };


    setGroups(
        previous => [
            ...previous,
            newGroup
        ]
    );


    setSelectedGroupId(
        newGroup.id
    );

    setSelectedShapeId(
        null
    );

    setSelectedShapeIds([]);
}


function updateSelectedGroup(
    changes: Partial<VectorGroup>
) {

    if (!selectedGroupId) {
        return;
    }


    setGroups(
        previous =>
            previous.map(
                group =>
                    group.id ===
                    selectedGroupId
                        ? {
                            ...group,
                            ...changes
                        }
                        : group
            )
    );
}


function toggleShapeSelection(
    id: string
) {

    setSelectedShapeIds(
        previous =>
            previous.includes(id)
                ? previous.filter(
                    shapeId =>
                        shapeId !== id
                )
                : [
                    ...previous,
                    id
                ]
    );
}

function getShapeCenter(
    shape: VectorShape
): Point2D {

    if (shape.kind === "ellipse") {

        return {
            x: shape.center.x,
            y: shape.center.y
        };
    }


    if (
        shape.kind === "line" ||
        shape.kind === "rectangle"
    ) {

        return {
            x:
                (
                    shape.start.x +
                    shape.end.x
                ) / 2,

            y:
                (
                    shape.start.y +
                    shape.end.y
                ) / 2
        };
    }


    if (
        shape.kind ===
        "quadratic-bezier"
    ) {

        return {
            x:
                (
                    shape.start.x +
                    shape.control.x +
                    shape.end.x
                ) / 3,

            y:
                (
                    shape.start.y +
                    shape.control.y +
                    shape.end.y
                ) / 3
        };
    }


    // Butterfly
    return {
        x:
            (
                shape.start.x +
                shape.end.x
            ) / 2,

        y:
            (
                shape.start.y +
                shape.end.y
            ) / 2
    };
}


function getGroupPivot(
    group: VectorGroup
): Point2D {

    const members =
        shapes.filter(
            shape =>
                group.shapeIds.includes(
                    shape.id
                )
        );


    if (members.length === 0) {

        return {
            x: 0,
            y: 0
        };
    }


    const centers =
        members.map(
            getShapeCenter
        );


    return {
        x:
            centers.reduce(
                (sum, point) =>
                    sum + point.x,
                0
            )
            /
            centers.length,

        y:
            centers.reduce(
                (sum, point) =>
                    sum + point.y,
                0
            )
            /
            centers.length
    };
}

function getGroupForShape(
    shapeId: string
): VectorGroup | null {

    return (
        groups.find(
            group =>
                group.shapeIds.includes(
                    shapeId
                )
        )
        ??
        null
    );
}

function applyGroupTransform(
    point: Point2D,
    shapeId: string
): Point2D {

    const group =
        getGroupForShape(
            shapeId
        );


    if (!group) {
        return point;
    }


    const pivot =
        getGroupPivot(
            group
        );


    return transformPoint(
        point,
        pivot,
        group.scale,
        group.rotation
    );
}

function renderPixels(
    points: Point2D[],
    color: string,
    keyPrefix: string
) {

    return points.map(
        (point, index) => (
            <div
                key={
                    `${keyPrefix}-${index}-${point.x}-${point.y}`
                }
                className="vector-pixel"
                style={{
                    left:
                        point.x * zoom,

                    top:
                        point.y * zoom,

                    width:
                        zoom,

                    height:
                        zoom,

                    backgroundColor:
                        color
                }}
            />
        )
    );
}


function renderQuantizedAlphaPixels(
    points: Point2D[],
    keyPrefix: string
) {
    if (points.length === 0) {
        return null;
    }

    const alphaSteps = [
        0,
        0.03,
        0.1,
        0.25,
        0.35
    ];

    const lastIndex =
        Math.max(1, points.length - 1);

    return points.map(
        (point, index) => {

            const t =
                index / lastIndex;

            const quantizedIndex =
                Math.min(
                    3,
                    Math.floor(t * 4)
                );

            const alpha =
                alphaSteps[quantizedIndex];

            return (
                <div
                    key={`${keyPrefix}-${index}-${point.x}-${point.y}`}
                    className="vector-pixel"
                    style={{
                        left: point.x * zoom,
                        top: point.y * zoom,
                        width: zoom,
                        height: zoom,
                        backgroundColor: `rgba(0, 0, 0, ${alpha})`
                    }}
                />
            );
        }
    );
}
    function renderShapePixels(
        shape: VectorShape
    ) {


      if (shape.kind === "butterfly") {

    const pivot: Point2D = {

        x:
            (
                shape.start.x +
                shape.end.x
            )
            /
            2,

        y:
            (
                shape.start.y +
                shape.end.y
            )
            /
            2
    };


    const transformedStart =
        transformPoint(
            shape.start,
            pivot,
            shape.scale,
            shape.rotation
        );


    const transformedEnd =
        transformPoint(
            shape.end,
            pivot,
            shape.scale,
            shape.rotation
        );


    const transformedControl =
        transformPoint(
            shape.control,
            pivot,
            shape.scale,
            shape.rotation
        );

const groupedStart =
    applyGroupTransform(
        transformedStart,
        shape.id
    );

const groupedEnd =
    applyGroupTransform(
        transformedEnd,
        shape.id
    );

const groupedControl =
    applyGroupTransform(
        transformedControl,
        shape.id
    );

const centerLinePixels =
    rasterizeLineBresenham(
        groupedStart,
        groupedEnd
    );

const mirroredControl =
    mirrorPointAcrossLine(
        groupedControl,
        groupedStart,
        groupedEnd
    );


const sideA =
    rasterizeQuadraticBezier(
        groupedStart,
        groupedControl,
        groupedEnd,
        96
    );

const sideB =
    rasterizeQuadraticBezier(
        groupedEnd,
        mirroredControl,
        groupedStart,
        96
    );

    const polygon = [
    ...sideA,
    ...sideB.slice(
        1,
        -1
    )
];


    const fillPixels =
        shape.fillEnabled
            ? fillPolygon(
                polygon
            )
            : [];


    const strokePixels =
        shape.strokeEnabled
            ? cleanDigitalPath(
                [
                    ...sideA,
                    ...sideB.slice(1)
                ],
                true
            )
            : [];


    return (
    <>
        {renderPixels(
            fillPixels,
            shape.fillColor,
            `${shape.id}-fill`
        )}

        {renderQuantizedAlphaPixels(
            centerLinePixels,
            `${shape.id}-center-line`
        )}

        {renderPixels(
            strokePixels,
            shape.strokeColor,
            `${shape.id}-stroke`
        )}
    </>
);
}

if (shape.kind === "rectangle") {

    const minX =
        Math.min(
            shape.start.x,
            shape.end.x
        );

    const maxX =
        Math.max(
            shape.start.x,
            shape.end.x
        );

    const minY =
        Math.min(
            shape.start.y,
            shape.end.y
        );

    const maxY =
        Math.max(
            shape.start.y,
            shape.end.y
        );


    const rawCorners: Point2D[] = [
        {
            x: minX,
            y: minY
        },
        {
            x: maxX,
            y: minY
        },
        {
            x: maxX,
            y: maxY
        },
        {
            x: minX,
            y: maxY
        }
    ];


    const polygon =
        rawCorners.map(
            point =>
                applyGroupTransform(
                    point,
                    shape.id
                )
        );


    const fillPixels =
        shape.fillEnabled
            ? fillPolygon(
                polygon
            )
            : [];


    const top =
        rasterizeLineBresenham(
            polygon[0],
            polygon[1]
        );

    const right =
        rasterizeLineBresenham(
            polygon[1],
            polygon[2]
        );

    const bottom =
        rasterizeLineBresenham(
            polygon[2],
            polygon[3]
        );

    const left =
        rasterizeLineBresenham(
            polygon[3],
            polygon[0]
        );


    const strokePixels =
        shape.strokeEnabled
            ? [
                ...top,
                ...right,
                ...bottom,
                ...left
            ]
            : [];


    return (
        <>
            {renderPixels(
                fillPixels,
                shape.fillColor,
                `${shape.id}-fill`
            )}

            {renderPixels(
                strokePixels,
                shape.strokeColor,
                `${shape.id}-stroke`
            )}
        </>
    );
}

if (shape.kind === "ellipse") {

    const rawContour: Point2D[] = [];

    const steps =
        Math.max(
            48,
            Math.ceil(
                Math.max(
                    shape.radiusX,
                    shape.radiusY
                ) * 8
            )
        );


    for (
        let i = 0;
        i < steps;
        i++
    ) {

        const angle =
            (
                i /
                steps
            )
            *
            Math.PI *
            2;


        rawContour.push({
            x:
                shape.center.x +
                Math.cos(angle) *
                shape.radiusX,

            y:
                shape.center.y +
                Math.sin(angle) *
                shape.radiusY
        });
    }


    const polygon =
        rawContour.map(
            point =>
                applyGroupTransform(
                    point,
                    shape.id
                )
        );


    const fillPixels =
        shape.fillEnabled
            ? fillPolygon(
                polygon
            )
            : [];


    const strokePixels: Point2D[] = [];


    if (shape.strokeEnabled) {

        for (
            let i = 0;
            i < polygon.length;
            i++
        ) {

            const current =
                polygon[i];

            const next =
                polygon[
                    (
                        i + 1
                    )
                    %
                    polygon.length
                ];


            strokePixels.push(
                ...rasterizeLineBresenham(
                    current,
                    next
                )
            );
        }
    }


    return (
        <>
            {renderPixels(
                fillPixels,
                shape.fillColor,
                `${shape.id}-fill`
            )}

            {renderPixels(
                cleanDigitalPath(
                    strokePixels,
                    true
                ),
                shape.strokeColor,
                `${shape.id}-stroke`
            )}
        </>
    );
}


if (shape.kind === "line") {

    const start =
        applyGroupTransform(
            shape.start,
            shape.id
        );

    const end =
        applyGroupTransform(
            shape.end,
            shape.id
        );


    const points =
        rasterizeLineBresenham(
            start,
            end
        );


    return renderPixels(
        points,
        shape.strokeColor,
        shape.id
    );
}
        if (
    shape.kind ===
    "quadratic-bezier"
) {

    const start =
        applyGroupTransform(
            shape.start,
            shape.id
        );

    const control =
        applyGroupTransform(
            shape.control,
            shape.id
        );

    const end =
        applyGroupTransform(
            shape.end,
            shape.id
        );


    const points =
        rasterizeQuadraticBezier(
            start,
            control,
            end,
            96
        );


    return renderPixels(
        points,
        shape.strokeColor,
        shape.id
    );
}

        return null;
    }



    function renderSpawnInstance(
    instance: SpawnInstance
) {

    if (
        instance.target.kind !==
        "shape"
    ) {
        return null;
    }


    const sourceShape =
        shapes.find(
            shape =>
                shape.id ===
                instance.target.id
        );


    if (!sourceShape) {
        return null;
    }


    const sourceCenter =
        getShapeCenter(
            sourceShape
        );


    const dx =
        instance.position.x -
        sourceCenter.x;

    const dy =
        instance.position.y -
        sourceCenter.y;


    /*
        PRIMERA VERSIÓN:

        soportamos Butterfly perfectamente.
    */

    if (
        sourceShape.kind ===
        "butterfly"
    ) {

        const spawnedShape: VectorShape = {

            ...sourceShape,

            id:
                instance.id,

            start: {
                x:
                    sourceShape.start.x +
                    dx,

                y:
                    sourceShape.start.y +
                    dy
            },

            end: {
                x:
                    sourceShape.end.x +
                    dx,

                y:
                    sourceShape.end.y +
                    dy
            },

            control: {
                x:
                    sourceShape.control.x +
                    dx,

                y:
                    sourceShape.control.y +
                    dy
            },

            rotation:
                sourceShape.rotation +
                instance.rotation,

            scale:
                sourceShape.scale *
                instance.scale
        };


        return renderShapePixels(
            spawnedShape
        );
    }


    return null;
}


function renderSpawnGenerator(
    generator: SpawnGenerator
) {

    if (
        generator.kind !==
        "star-spawn"
    ) {
        return null;
    }


    const instances =
        expandStarSpawn(
            generator
        );


    return (
        <>
            {instances.map(
                instance => (
                    <div
                        key={
                            instance.id
                        }
                        className="vector-layer"
                    >
                        {renderSpawnInstance(
                            instance
                        )}
                    </div>
                )
            )}
        </>
    );
}

    function renderDraftPoints() {

        return draftPoints.map(
            (point, index) => (
                <div
                    key={`draft-${index}`}
                    className="vector-control-point"
                    style={{
                        left:
                            point.x * zoom + zoom / 2,
                        top:
                            point.y * zoom + zoom / 2
                    }}
                    title={`(${point.x}, ${point.y})`}
                />
            )
        );
    }
        function updateSelectedShape(
            changes: Partial<VectorShape>
        ) {

            if (!selectedShapeId) {
                return;
            }


            setShapes(
                previous =>
                    previous.map(
                        shape =>
                            shape.id ===
                            selectedShapeId
                                ? {
                                    ...shape,
                                    ...changes
                                } as VectorShape
                                : shape
                    )
            );
        }

    function removeSelectedShape() {

        if (!selectedShapeId) {
            return;
        }

        setShapes(
            previous =>
                previous.filter(
                    shape =>
                        shape.id !==
                        selectedShapeId
                )
        );

        setSelectedShapeId(null);
    }


    return (
        <div className="vector-lab">

            <aside className="vector-lab-leftbar">

                <h3>
                    Shapes
                </h3>
<div className="vector-tool-grid">
                <button
                    className={
                        selectedTool === "select"
                            ? "vector-tool selected"
                            : "vector-tool"
                    }
                    onClick={
                        () =>
                            setSelectedTool(
                                "select"
                            )
                    }
                >
                    Select
                </button>

                <button
                    className={
                        selectedTool === "bezier"
                            ? "vector-tool selected"
                            : "vector-tool"
                    }
                    onClick={
                        () =>
                            setSelectedTool(
                                "bezier"
                            )
                    }
                >
                    Bezier
                </button>

                <button
                className={
                    selectedTool === "line"
                        ? "vector-tool selected"
                        : "vector-tool"
                }
                onClick={
                    () =>
                        setSelectedTool(
                            "line"
                        )
                }
            >
                Line
            </button>

                <button
                        className={
                            selectedTool === "ellipse"
                                ? "vector-tool selected"
                                : "vector-tool"
                        }
                        onClick={
                            () =>
                                setSelectedTool(
                                    "ellipse"
                                )
                        }
                    >
                        Ellipse
                    </button>

                <button
    className={
        selectedTool === "rectangle"
            ? "vector-tool selected"
            : "vector-tool"
    }
    onClick={() =>
        setSelectedTool(
            "rectangle"
        )
    }
>
    Rectangle
</button>


<button
    className={
        selectedTool === "butterfly"
            ? "vector-tool selected"
            : "vector-tool"
    }
    onClick={() =>
        setSelectedTool(
            "butterfly"
        )
    }
>
    Butterfly
</button>


<button
    disabled={!selectedShape}
    onClick={
        createStarSpawnFromSelectedShape
    }
>
    + Star Spawn
</button>

                <hr />
</div>
<button
    disabled={
        selectedShapeIds.length < 2
    }
    onClick={
        createGroupFromSelection
    }
>
    + Group
</button>
                <h3>
    Groups
</h3>

<h3>
    Generators
</h3>

<div className="vector-generator-list">

    {spawnGenerators.map(
        generator => (

            <button
                key={
                    generator.id
                }
                className={
                    generator.id ===
                    selectedGeneratorId
                        ? "vector-generator-item selected"
                        : "vector-generator-item"
                }
                onClick={() => {

                    setSelectedGeneratorId(
                        generator.id
                    );

                    setSelectedShapeId(
                        null
                    );

                    setSelectedGroupId(
                        null
                    );
                }}
            >
                {generator.name}
            </button>

        )
    )}

</div>

<div className="vector-group-list">

    {groups.map(group => (

        <button
            key={group.id}
            className={
                group.id === selectedGroupId
                    ? "vector-group-item selected"
                    : "vector-group-item"
            }
            onClick={() => {

                setSelectedGroupId(
                    group.id
                );

                setSelectedShapeId(
                    null
                );
            }}
        >
            {group.name}
            {" "}
            ({group.shapeIds.length})
        </button>

    ))}

</div>


<h3>
    Shapes
</h3>

<div className="vector-shape-list">

    {shapes.map(shape => (

        <div
            key={shape.id}
            className="vector-shape-row"
        >

            <input
                type="checkbox"
                checked={
                    selectedShapeIds.includes(
                        shape.id
                    )
                }
                onChange={() =>
                    toggleShapeSelection(
                        shape.id
                    )
                }
            />

            <button
                className={
                    shape.id === selectedShapeId
                        ? "vector-shape-item selected"
                        : "vector-shape-item"
                }
                onClick={() => {

                    setSelectedShapeId(
                        shape.id
                    );

                    setSelectedGroupId(
                        null
                    );
                }}
            >
                {shape.name}
            </button>

        </div>

    ))}

</div>

            </aside>


            <main className="vector-lab-main">

                <div className="vector-lab-toolbar">

                    <label>
    Zoom: {zoom}×
</label>

                    <input
                        type="range"
                        min="1"
                        max="40"
                        step="1"
                        value={zoom}
                        onChange={
                            event =>
                                setZoom(
                                    Number(
                                        event.target.value
                                    )
                                )
                        }
                    />

                    <div className="vector-draft-info">
                       
                       {selectedTool === "rectangle" && (
    <span>
                            Rectangle:
                            {" "}
                            click 1 = corner A,
                            {" "}
                            click 2 = corner B
                        </span>
                    )}

                    {selectedTool === "butterfly" && (
                        <span>
                            Butterfly:
                            {" "}
                            click 1 = start,
                            {" "}
                            click 2 = end,
                            {" "}
                            click 3 = curvature
                        </span>
                    )}
                        {selectedTool === "line" && (
                        <span>
                            Line:
                            {" "}
                            click 1 = start,
                            {" "}
                            click 2 = end
                        </span>
                    )}

                    {selectedTool === "bezier" && (
                        <span>
                            Bezier:
                            {" "}
                            click 1 = start,
                            {" "}
                            click 2 = control,
                            {" "}
                            click 3 = end
                        </span>
                    )}

                    {selectedTool === "ellipse" && (
                        <span>
                            Ellipse:
                            {" "}
                            click 1 = center,
                            {" "}
                            click 2 = radius
                        </span>
                    )}
                    </div>

                </div>


                <div className="vector-canvas-wrapper">

                    <div
                        className="vector-grid"
                        style={gridStyle}
                        onClick={handleGridClick}
                    >

                        <div className="vector-origin">
                            0,0
                        </div>

                        <div className="vector-layer">
                            {shapes.map(shape =>
                                renderShapePixels(
                                    shape
                                )
                            )}
                        </div>

                        <div className="vector-layer">

    {spawnGenerators.map(
        generator =>
            renderSpawnGenerator(
                generator
            )
    )}

</div>

                        <div className="vector-layer">
                            {renderDraftPoints()}
                        </div>

                    </div>

                </div>

            </main>


            <aside className="vector-lab-rightbar">

                <h3>
                    Properties
                </h3>
<div className="vector-default-properties">

                <div className="vector-property">
                    <label>
                        Fill color
                    </label>

                    <input
                        type="color"
                        value={selectedColor}
                        onChange={
                            event =>
                                setSelectedColor(
                                    event.target.value
                                )
                        }
                    />
                </div>

                <div className="vector-property">
                    <label>
                        Stroke enabled
                    </label>

                    <input
                        type="checkbox"
                        checked={strokeEnabled}
                        onChange={
                            event =>
                                setStrokeEnabled(
                                    event.target.checked
                                )
                        }
                    />
                </div>

                <div className="vector-property">
                    <label>
                        Stroke color
                    </label>

                    <input
                        type="color"
                        value={strokeColor}
                        disabled={!strokeEnabled}
                        onChange={
                            event =>
                                setStrokeColor(
                                    event.target.value
                                )
                        }
                    />
                </div>
                </div>

                <hr />
                        {selectedGroup && (
    <>
        <h3>
            Selected Group
        </h3>

        <div className="vector-selected-data">

            <div>
                <strong>
                    Name:
                </strong>
                {" "}
                {selectedGroup.name}
            </div>

            <div>
                <strong>
                    Shapes:
                </strong>
                {" "}
                {selectedGroup.shapeIds.length}
            </div>


            <div className="vector-property">

                <label>
                    Rotation
                </label>

                <div className="range-number-control">

                    <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={
                            selectedGroup.rotation
                        }
                        onChange={
                            event =>
                                updateSelectedGroup({
                                    rotation:
                                        Number(
                                            event.target.value
                                        )
                                })
                        }
                    />

                    <input
                        type="number"
                        min="-180"
                        max="180"
                        step="1"
                        value={
                            selectedGroup.rotation
                        }
                        onChange={
                            event =>
                                updateSelectedGroup({
                                    rotation:
                                        Number(
                                            event.target.value
                                        )
                                })
                        }
                    />

                </div>

            </div>


            <div className="vector-property">

                <label>
                    Scale
                </label>

                <div className="range-number-control">

                    <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.05"
                        value={
                            selectedGroup.scale
                        }
                        onChange={
                            event =>
                                updateSelectedGroup({
                                    scale:
                                        Number(
                                            event.target.value
                                        )
                                })
                        }
                    />

                    <input
                        type="number"
                        min="0.1"
                        max="5"
                        step="0.05"
                        value={
                            selectedGroup.scale
                        }
                        onChange={
                            event =>
                                updateSelectedGroup({
                                    scale:
                                        Math.max(
                                            0.1,
                                            Number(
                                                event.target.value
                                            )
                                        )
                                })
                        }
                    />

                </div>

            </div>

        </div>
    </>
)}
                {!selectedGroup && (
    <h3>
        Selected Shape
    </h3>
)}

                {!selectedGroup && selectedShape ? (
    <div className="vector-selected-data">

        <div>
            <strong>
                Name:
            </strong>
            {" "}
            {selectedShape.name}
        </div>

        <div>
            <strong>
                Type:
            </strong>
            {" "}
            {selectedShape.kind}
        </div>

        <div className="vector-property">

    <label>
        Fill
    </label>

    <input
        type="checkbox"
        checked={
            selectedShape.fillEnabled
        }
        onChange={
            event =>
                updateSelectedShape({
                    fillEnabled:
                        event.target.checked
                })
        }
    />

</div>


<div className="vector-property">

    <label>
        Fill Color
    </label>

    <input
        type="color"
        value={
            selectedShape.fillColor
        }
        disabled={
            !selectedShape.fillEnabled
        }
        onChange={
            event =>
                updateSelectedShape({
                    fillColor:
                        event.target.value
                })
        }
    />

</div>


<div className="vector-property">

    <label>
        Stroke
    </label>

    <input
        type="checkbox"
        checked={
            selectedShape.strokeEnabled
        }
        onChange={
            event =>
                updateSelectedShape({
                    strokeEnabled:
                        event.target.checked
                })
        }
    />

</div>


<div className="vector-property">

    <label>
        Stroke Color
    </label>

    <input
        type="color"
        value={
            selectedShape.strokeColor
        }
        disabled={
            !selectedShape.strokeEnabled
        }
        onChange={
            event =>
                updateSelectedShape({
                    strokeColor:
                        event.target.value
                })
        }
    />

</div>
{selectedShape.kind === "butterfly" && (
    <div className="butterfly-properties">

        <div className="vector-property">

            <label>
                Rotation
            </label>

            <div className="range-number-control">

                <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={
                        selectedShape.rotation
                    }
                    onChange={
                        event =>
                            updateSelectedShape({
                                rotation:
                                    Number(
                                        event.target.value
                                    )
                            })
                    }
                />

                <input
                    type="number"
                    min="-180"
                    max="180"
                    step="1"
                    value={
                        selectedShape.rotation
                    }
                    onChange={
                        event =>
                            updateSelectedShape({
                                rotation:
                                    Number(
                                        event.target.value
                                    )
                            })
                    }
                />

            </div>

        </div>


        <div className="vector-property">

            <label>
                Scale
            </label>

            <div className="range-number-control">

                <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.05"
                    value={
                        selectedShape.scale
                    }
                    onChange={
                        event =>
                            updateSelectedShape({
                                scale:
                                    Number(
                                        event.target.value
                                    )
                            })
                    }
                />

                <input
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.05"
                    value={
                        selectedShape.scale
                    }
                    onChange={
                        event =>
                            updateSelectedShape({
                                scale:
                                    Math.max(
                                        0.1,
                                        Number(
                                            event.target.value
                                        )
                                    )
                            })
                    }
                />

            </div>

        </div>


        <div className="vector-property">

    <label>
        Start X
    </label>

    <div className="range-number-control">

        <input
            type="range"
            min="0"
            max={GRID_WIDTH - 1}
            step="1"
            value={
                selectedShape.start.x
            }
            onChange={
                event =>
                    updateSelectedShape({
                        start: {
                            ...selectedShape.start,

                            x:
                                Number(
                                    event.target.value
                                )
                        }
                    })
            }
        />

        <input
            type="number"
            min="0"
            max={GRID_WIDTH - 1}
            value={
                selectedShape.start.x
            }
            onChange={
                event =>
                    updateSelectedShape({
                        start: {
                            ...selectedShape.start,

                            x:
                                clamp(
                                    Number(
                                        event.target.value
                                    ),
                                    0,
                                    GRID_WIDTH - 1
                                )
                        }
                    })
            }
        />

    </div>

</div>


<div className="vector-property">

    <label>
        Start Y
    </label>

    <div className="range-number-control">

        <input
            type="range"
            min="0"
            max={GRID_HEIGHT - 1}
            step="1"
            value={
                selectedShape.start.y
            }
            onChange={
                event =>
                    updateSelectedShape({
                        start: {
                            ...selectedShape.start,

                            y:
                                Number(
                                    event.target.value
                                )
                        }
                    })
            }
        />

        <input
            type="number"
            min="0"
            max={GRID_HEIGHT - 1}
            value={
                selectedShape.start.y
            }
            onChange={
                event =>
                    updateSelectedShape({
                        start: {
                            ...selectedShape.start,

                            y:
                                clamp(
                                    Number(
                                        event.target.value
                                    ),
                                    0,
                                    GRID_HEIGHT - 1
                                )
                        }
                    })
            }
        />

    </div>

</div>


<div className="vector-property">

    <label>
        End X
    </label>

    <div className="range-number-control">

        <input
            type="range"
            min="0"
            max={GRID_WIDTH - 1}
            step="1"
            value={
                selectedShape.end.x
            }
            onChange={
                event =>
                    updateSelectedShape({
                        end: {
                            ...selectedShape.end,

                            x:
                                Number(
                                    event.target.value
                                )
                        }
                    })
            }
        />

        <input
            type="number"
            min="0"
            max={GRID_WIDTH - 1}
            value={
                selectedShape.end.x
            }
            onChange={
                event =>
                    updateSelectedShape({
                        end: {
                            ...selectedShape.end,

                            x:
                                clamp(
                                    Number(
                                        event.target.value
                                    ),
                                    0,
                                    GRID_WIDTH - 1
                                )
                        }
                    })
            }
        />

    </div>

</div>


<div className="vector-property">

    <label>
        End Y
    </label>

    <div className="range-number-control">

        <input
            type="range"
            min="0"
            max={GRID_HEIGHT - 1}
            step="1"
            value={
                selectedShape.end.y
            }
            onChange={
                event =>
                    updateSelectedShape({
                        end: {
                            ...selectedShape.end,

                            y:
                                Number(
                                    event.target.value
                                )
                        }
                    })
            }
        />

        <input
            type="number"
            min="0"
            max={GRID_HEIGHT - 1}
            value={
                selectedShape.end.y
            }
            onChange={
                event =>
                    updateSelectedShape({
                        end: {
                            ...selectedShape.end,

                            y:
                                clamp(
                                    Number(
                                        event.target.value
                                    ),
                                    0,
                                    GRID_HEIGHT - 1
                                )
                        }
                    })
            }
        />

    </div>

</div>


<div className="vector-property">

    <label>
        Curve X
    </label>

    <div className="range-number-control">

        <input
            type="range"
            min="0"
            max={GRID_WIDTH - 1}
            step="1"
            value={
                selectedShape.control.x
            }
            onChange={
                event =>
                    updateSelectedShape({
                        control: {
                            ...selectedShape.control,

                            x:
                                Number(
                                    event.target.value
                                )
                        }
                    })
            }
        />

        <input
            type="number"
            min="0"
            max={GRID_WIDTH - 1}
            value={
                selectedShape.control.x
            }
            onChange={
                event =>
                    updateSelectedShape({
                        control: {
                            ...selectedShape.control,

                            x:
                                clamp(
                                    Number(
                                        event.target.value
                                    ),
                                    0,
                                    GRID_WIDTH - 1
                                )
                        }
                    })
            }
        />

    </div>

</div>


<div className="vector-property">

    <label>
        Curve Y
    </label>

    <div className="range-number-control">

        <input
            type="range"
            min="0"
            max={GRID_HEIGHT - 1}
            step="1"
            value={
                selectedShape.control.y
            }
            onChange={
                event =>
                    updateSelectedShape({
                        control: {
                            ...selectedShape.control,

                            y:
                                Number(
                                    event.target.value
                                )
                        }
                    })
            }
        />

        <input
            type="number"
            min="0"
            max={GRID_HEIGHT - 1}
            value={
                selectedShape.control.y
            }
            onChange={
                event =>
                    updateSelectedShape({
                        control: {
                            ...selectedShape.control,

                            y:
                                clamp(
                                    Number(
                                        event.target.value
                                    ),
                                    0,
                                    GRID_HEIGHT - 1
                                )
                        }
                    })
            }
        />

    </div>

</div>

    </div>
)}


{selectedShape.kind === "rectangle" && (
    <>
        <div>
            <strong>
                Corner A:
            </strong>
            {" "}
            ({selectedShape.start.x},
            {" "}
            {selectedShape.start.y})
        </div>

        <div>
            <strong>
                Corner B:
            </strong>
            {" "}
            ({selectedShape.end.x},
            {" "}
            {selectedShape.end.y})
        </div>
    </>
)}
        {selectedShape.kind === "line" && (
            <>
                <div>
                    <strong>
                        Start:
                    </strong>
                    {" "}
                    ({selectedShape.start.x},
                    {" "}
                    {selectedShape.start.y})
                </div>

                <div>
                    <strong>
                        End:
                    </strong>
                    {" "}
                    ({selectedShape.end.x},
                    {" "}
                    {selectedShape.end.y})
                </div>
            </>
        )}


        {selectedShape.kind === "quadratic-bezier" && (
            <>
                <div>
                    <strong>
                        Start:
                    </strong>
                    {" "}
                    ({selectedShape.start.x},
                    {" "}
                    {selectedShape.start.y})
                </div>

                <div>
                    <strong>
                        Control:
                    </strong>
                    {" "}
                    ({selectedShape.control.x},
                    {" "}
                    {selectedShape.control.y})
                </div>

                <div>
                    <strong>
                        End:
                    </strong>
                    {" "}
                    ({selectedShape.end.x},
                    {" "}
                    {selectedShape.end.y})
                </div>
            </>
        )}


        {selectedShape.kind === "ellipse" && (
    <>

        <div className="vector-property">

            <label>
                Center X
            </label>

            <input
                type="number"
                value={
                    selectedShape.center.x
                }
                onChange={
                    event =>
                        updateSelectedShape({
                            center: {
                                ...selectedShape.center,
                                x: Number(
                                    event.target.value
                                )
                            }
                        })
                }
            />

        </div>


        <div className="vector-property">

            <label>
                Center Y
            </label>

            <input
                type="number"
                value={
                    selectedShape.center.y
                }
                onChange={
                    event =>
                        updateSelectedShape({
                            center: {
                                ...selectedShape.center,
                                y: Number(
                                    event.target.value
                                )
                            }
                        })
                }
            />

        </div>


        <div className="vector-property">

            <label>
                Radius X
            </label>

            <input
                type="number"
                min="1"
                value={
                    selectedShape.radiusX
                }
                onChange={
                    event =>
                        updateSelectedShape({
                            radiusX:
                                Math.max(
                                    1,
                                    Number(
                                        event.target.value
                                    )
                                )
                        })
                }
            />

        </div>


        <div className="vector-property">

            <label>
                Radius Y
            </label>

            <input
                type="number"
                min="1"
                value={
                    selectedShape.radiusY
                }
                onChange={
                    event =>
                        updateSelectedShape({
                            radiusY:
                                Math.max(
                                    1,
                                    Number(
                                        event.target.value
                                    )
                                )
                        })
                }
            />

        </div>

    </>
)}




        <button
            onClick={
                removeSelectedShape
            }
        >
            Delete shape
        </button>

    </div>
) : (
    <div>
        No shape selected
    </div>
)}

            </aside>

        </div>
    );
}