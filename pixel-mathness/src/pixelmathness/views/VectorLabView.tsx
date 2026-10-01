import {
    useEffect,
    useMemo,
    useRef,
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

import {
    flattenCubicBezier
} from "../../generation/vectorLab/flattenCubicBezier";

import {
    rasterizeThickPath
} from "../../generation/vectorLab/rasterizeThickPath";



type VectorTool =
    | "select"
    | "line"
    | "bezier"
    | "ellipse"
    | "rectangle"
    | "butterfly"
    | "branch";


    type BranchDragTarget = {
    pointIndex: number;

    kind:
        | "position"
        | "controlIn"
        | "controlOut";
};

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

        setBranchDraftPoints([]);

    },
    [selectedTool]
);

const [
    branchDraftPoints,
    setBranchDraftPoints
] = useState<Point2D[]>([]);


const [
    branchDragTarget,
    setBranchDragTarget
] = useState<BranchDragTarget | null>(
    null
);

useEffect(
    () => {

        if (!branchDragTarget) {
            return;
        }


        /*
            Guardamos una referencia no-null.

            TypeScript ya sabe que dragTarget
            existe durante todo este effect.
        */
        const dragTarget =
            branchDragTarget;


        function handleMouseMove(
            event: MouseEvent
        ) {

            const grid =
                gridRef.current;


            if (!grid) {
                return;
            }


            const rect =
                grid.getBoundingClientRect();


            const x =
                clamp(
                    Math.round(
                        (
                            event.clientX -
                            rect.left
                        )
                        /
                        zoom
                    ),
                    0,
                    GRID_WIDTH - 1
                );


            const y =
                clamp(
                    Math.round(
                        (
                            event.clientY -
                            rect.top
                        )
                        /
                        zoom
                    ),
                    0,
                    GRID_HEIGHT - 1
                );


            updateBranchPoint(
                dragTarget.pointIndex,
                dragTarget.kind,
                {
                    x,
                    y
                }
            );
        }


        function handleMouseUp() {

            setBranchDragTarget(
                null
            );
        }


        window.addEventListener(
            "mousemove",
            handleMouseMove
        );


        window.addEventListener(
            "mouseup",
            handleMouseUp
        );


        return () => {

            window.removeEventListener(
                "mousemove",
                handleMouseMove
            );


            window.removeEventListener(
                "mouseup",
                handleMouseUp
            );
        };

    },
    [
        branchDragTarget,
        zoom,
        selectedShapeId
    ]
);
const gridRef =
    useRef<HTMLDivElement | null>(
        null
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


function updateSelectedGenerator(
    changes: Partial<SpawnGenerator>
) {
    if (!selectedGeneratorId) {
        return;
    }

    setSpawnGenerators(
        previous =>
            previous.map(
                generator =>
                    generator.id === selectedGeneratorId
                        ? {
                            ...generator,
                            ...changes
                        } as SpawnGenerator
                        : generator
            )
    );
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
if (
    selectedTool ===
    "branch"
) {

    setBranchDraftPoints(
        previous => [
            ...previous,
            point
        ]
    );

    return;
}
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

    if (
        shape.kind === "ellipse"
    ) {
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


    if (
        shape.kind ===
        "branch"
    ) {

        if (
            shape.points.length === 0
        ) {
            return {
                x: 0,
                y: 0
            };
        }


        const sum =
            shape.points.reduce(
                (accumulator, point) => ({
                    x:
                        accumulator.x +
                        point.position.x,

                    y:
                        accumulator.y +
                        point.position.y
                }),
                {
                    x: 0,
                    y: 0
                }
            );


        return {
            x:
                sum.x /
                shape.points.length,

            y:
                sum.y /
                shape.points.length
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
function buildBranchPoints(
    rawPoints: Point2D[]
) {
    return rawPoints.map(
        (
            point,
            index
        ) => {

            const previous =
                rawPoints[
                    Math.max(
                        0,
                        index - 1
                    )
                ];

            const next =
                rawPoints[
                    Math.min(
                        rawPoints.length - 1,
                        index + 1
                    )
                ];


            const tangentX =
                (
                    next.x -
                    previous.x
                )
                /
                4;


            const tangentY =
                (
                    next.y -
                    previous.y
                )
                /
                4;


            return {
                position:
                    point,

                controlIn: {
                    x:
                        point.x -
                        tangentX,

                    y:
                        point.y -
                        tangentY
                },

                controlOut: {
                    x:
                        point.x +
                        tangentX,

                    y:
                        point.y +
                        tangentY
                }
            };
        }
    );
}
function finishBranch() {

    if (
        branchDraftPoints.length < 2
    ) {
        return;
    }


   const points =
    buildBranchPoints(
        branchDraftPoints
    );


    const newShape: VectorShape = {

        id:
            crypto.randomUUID(),

        name:
            `Branch ${shapes.length + 1}`,

        kind:
            "branch",

        points,

               
              thickness:
    5,

borderWidth:
    1,

generativeCount:
    0,

generativeShapeId:
    null,
generativeRotationMode:
    "keep",
    generativeAnchorMode:
    "center",
        fillColor:
            selectedColor,

        strokeColor,

        fillEnabled:
            true,

        strokeEnabled:
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

setSelectedGroupId(
    null
);

setSelectedGeneratorId(
    null
);

setBranchDraftPoints([]);
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
type GenerativePathPoint = {
    position: Point2D;
    tangentAngle: number;
};


function getEvenlySpacedPathPoints(
    path: Point2D[],
    count: number
): GenerativePathPoint[] {

    if (
        path.length < 2 ||
        count <= 0
    ) {
        return [];
    }


    const cumulativeLengths: number[] = [
        0
    ];


    let totalLength =
        0;


    /*
        Primer recorrido:
        solamente calcula longitud acumulada.
    */

    for (
        let i = 1;
        i < path.length;
        i++
    ) {

        const previous =
            path[i - 1];

        const current =
            path[i];


        const dx =
            current.x -
            previous.x;

        const dy =
            current.y -
            previous.y;


        totalLength +=
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        cumulativeLengths.push(
            totalLength
        );
    }


    if (
        totalLength === 0
    ) {
        return [];
    }


    const result:
        GenerativePathPoint[] =
        [];


    /*
        Segundo recorrido:
        buscamos la posición correspondiente
        a cada distancia uniforme.
    */

    for (
        let spawnIndex = 1;
        spawnIndex <= count;
        spawnIndex++
    ) {

        const targetDistance =
            totalLength *
            (
                spawnIndex /
                (
                    count +
                    1
                )
            );


        let segmentIndex =
            1;


        while (
            segmentIndex <
                cumulativeLengths.length &&
            cumulativeLengths[
                segmentIndex
            ] <
                targetDistance
        ) {

            segmentIndex++;
        }


        const previousIndex =
            Math.max(
                0,
                segmentIndex - 1
            );


        const nextIndex =
            Math.min(
                segmentIndex,
                path.length - 1
            );


        const segmentStart =
            path[
                previousIndex
            ];


        const segmentEnd =
            path[
                nextIndex
            ];


        const distanceBefore =
            cumulativeLengths[
                previousIndex
            ];


        const distanceAfter =
            cumulativeLengths[
                nextIndex
            ];


        const segmentLength =
            distanceAfter -
            distanceBefore;


        const t =
            segmentLength === 0
                ? 0
                : (
                    targetDistance -
                    distanceBefore
                )
                /
                segmentLength;


        const position: Point2D = {

            x:
                segmentStart.x +
                (
                    segmentEnd.x -
                    segmentStart.x
                )
                *
                t,

            y:
                segmentStart.y +
                (
                    segmentEnd.y -
                    segmentStart.y
                )
                *
                t
        };


        /*
            Calculamos la tangente usando
            puntos alrededor del punto actual.

            Esto evita depender de un único
            segmento microscópico.
        */

        const tangentStartIndex =
            Math.max(
                0,
                previousIndex - 2
            );


        const tangentEndIndex =
            Math.min(
                path.length - 1,
                nextIndex + 2
            );


        const tangentStart =
            path[
                tangentStartIndex
            ];


        const tangentEnd =
            path[
                tangentEndIndex
            ];


        const tangentDx =
            tangentEnd.x -
            tangentStart.x;


        const tangentDy =
            tangentEnd.y -
            tangentStart.y;


        const tangentAngle =
            Math.atan2(
                tangentDy,
                tangentDx
            );


        result.push({
            position,
            tangentAngle
        });
    }


    return result;
}


    function renderShapePixels(
    shape: VectorShape,
    spawnInstance?: SpawnInstance
) {
const sourceCenter =
    applyGroupTransform(
        getShapeCenter(shape),
        shape.id
    );
function getSpawnAnchorPoint(): Point2D {

    if (
        !spawnInstance ||
        !spawnInstance.anchorMode ||
        spawnInstance.anchorMode === "center"
    ) {
        return sourceCenter;
    }


    /*
        Butterfly:
        start/end son exactamente
        su eje longitudinal.
    */

    if (
        shape.kind === "butterfly"
    ) {

        const pivot: Point2D = {
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


        const rawAnchor =
            spawnInstance.anchorMode === "start"
                ? shape.start
                : shape.end;


        /*
            Aplicamos primero las propias
            transformaciones de Butterfly.
        */

        const locallyTransformedAnchor =
            transformPoint(
                rawAnchor,
                pivot,
                shape.scale,
                shape.rotation
            );


        return applyGroupTransform(
            locallyTransformedAnchor,
            shape.id
        );
    }


    /*
        Line / Rectangle:
        también tienen start/end.
    */

    if (
        shape.kind === "line" ||
        shape.kind === "rectangle"
    ) {

        const rawAnchor =
            spawnInstance.anchorMode === "start"
                ? shape.start
                : shape.end;


        return applyGroupTransform(
            rawAnchor,
            shape.id
        );
    }


    /*
        Quadratic Bezier
    */

    if (
        shape.kind === "quadratic-bezier"
    ) {

        const rawAnchor =
            spawnInstance.anchorMode === "start"
                ? shape.start
                : shape.end;


        return applyGroupTransform(
            rawAnchor,
            shape.id
        );
    }


    return sourceCenter;
}

const sourceAnchor =
    getSpawnAnchorPoint();


function getShapeForwardAngle(
    shape: VectorShape
): number {

    if (
        shape.kind === "line" ||
        shape.kind === "rectangle"
    ) {

        return Math.atan2(
            shape.end.y -
            shape.start.y,

            shape.end.x -
            shape.start.x
        );
    }


    if (
        shape.kind ===
        "quadratic-bezier"
    ) {

        return Math.atan2(
            shape.end.y -
            shape.start.y,

            shape.end.x -
            shape.start.x
        );
    }


    if (
        shape.kind ===
        "butterfly"
    ) {

        return Math.atan2(
            shape.end.y -
            shape.start.y,

            shape.end.x -
            shape.start.x
        )
        +
        shape.rotation;
    }


    if (
        shape.kind ===
        "branch"
    ) {

        if (
            shape.points.length < 2
        ) {
            return 0;
        }


        const start =
            shape.points[0]
                .position;

        const end =
            shape.points[
                shape.points.length - 1
            ].position;


        return Math.atan2(
            end.y - start.y,
            end.x - start.x
        );
    }


    return 0;
}
function applyFinalTransform(
    point: Point2D
): Point2D {

    /*
        Primero:
        transformación normal del grupo.
    */

    const groupedPoint =
        applyGroupTransform(
            point,
            shape.id
        );


    /*
        Si no viene de un Spawn,
        terminamos aquí.
    */

    if (!spawnInstance) {
        return groupedPoint;
    }


    /*
        Scale + rotation alrededor
        del centro original de la shape.
    */

    const transformed =
        transformPoint(
            groupedPoint,
            sourceCenter,
            spawnInstance.scale,
            spawnInstance.rotation
        );


    /*
        Finalmente desplazamos el centro
        de la shape hasta la posición
        calculada por Star Spawn.
    */

    const transformedAnchor =
    transformPoint(
        sourceAnchor,
        sourceCenter,
        spawnInstance.scale,
        spawnInstance.rotation
    );


return {
    x:
        transformed.x
        +
        (
            spawnInstance.position.x -
            transformedAnchor.x
        ),

    y:
        transformed.y
        +
        (
            spawnInstance.position.y -
            transformedAnchor.y
        )
};
}

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
    applyFinalTransform(
        transformedStart
    );

const groupedEnd =
    applyFinalTransform(
        transformedEnd
    );

const groupedControl =
    applyFinalTransform(
        transformedControl
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
            applyFinalTransform(
                point
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
            applyFinalTransform(
                point
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
    applyFinalTransform(
        shape.start
    );

const end =
    applyFinalTransform(
        shape.end
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
    applyFinalTransform(
        shape.start
    );

const control =
    applyFinalTransform(
        shape.control
    );

const end =
    applyFinalTransform(
        shape.end
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

if (
    shape.kind ===
    "branch"
) {

    if (
        shape.points.length < 2
    ) {
        return null;
    }


    const path: Point2D[] =
        [];


    for (
        let i = 0;
        i <
        shape.points.length - 1;
        i++
    ) {

        const current =
            shape.points[i];

        const next =
            shape.points[i + 1];


      const transformedStart =
    applyFinalTransform(
        current.position
    );

const transformedControlOut =
    applyFinalTransform(
        current.controlOut
    );

const transformedControlIn =
    applyFinalTransform(
        next.controlIn
    );

const transformedEnd =
    applyFinalTransform(
        next.position
    );


const segment =
    flattenCubicBezier(
        transformedStart,
        transformedControlOut,
        transformedControlIn,
        transformedEnd,
        0.35
    );


        if (path.length > 0) {
            segment.shift();
        }


        path.push(
            ...segment
        );
    }
const outerPixels =
    shape.strokeEnabled
        ? rasterizeThickPath(
            path,
            shape.thickness +
            shape.borderWidth * 2
        )
        : [];


const innerPixels =
    shape.fillEnabled
        ? rasterizeThickPath(
            path,
            shape.thickness
        )
        : [];
const generativePoints =
    getEvenlySpacedPathPoints(
        path,
        shape.generativeCount
    );


const generativeShape =
    shape.generativeShapeId
        ? shapes.find(
            candidate =>
                candidate.id ===
                shape.generativeShapeId
        )
        : null;

        const generativeShapeForwardAngle =
    generativeShape
        ? getShapeForwardAngle(
            generativeShape
        )
        : 0;
return (
    <>
        {renderPixels(
            outerPixels,
            shape.strokeColor,
            `${shape.id}-branch-border`
        )}

        {renderPixels(
            innerPixels,
            shape.fillColor,
            `${shape.id}-branch-fill`
        )}


        {generativeShape &&
            generativePoints.map(
    (
        generativePoint,
        index
    ) => {

        const tangentDegrees =
    generativePoint.tangentAngle *
    180 /
    Math.PI;
let rotation =
    0;


switch (
    shape.generativeRotationMode
) {

    case "tangent":

        rotation =
            tangentDegrees;

        break;


    case "normal-left":

        rotation =
            tangentDegrees +
            90;

        break;


    case "normal-right":

        rotation =
            tangentDegrees -
            90;

        break;


    case "alternate-normal":

        rotation =
            tangentDegrees
            +
            (
                index % 2 === 0
                    ? 90
                    : -90
            );

        break;


    case "keep":
    default:

        rotation =
            0;

        break;
}
                 const branchGroup =
    getGroupForShape(
        shape.id
    );



const group =
    getGroupForShape(
        shape.id
    );


const groupScale =
    group
        ? group.scale
        : 1;


/*
    Si esta Branch a su vez fue
    spawneada por otra cosa,
    heredamos también esa escala.
*/
const parentSpawnScale =
    spawnInstance
        ? spawnInstance.scale
        : 1;


const inheritedScale =
    groupScale *
    parentSpawnScale;
const instance: SpawnInstance = {

    id:
        `${shape.id}-generative-${index}`,

    target: {
        kind: "shape",
        id:
            generativeShape.id
    },

    position:
        generativePoint.position,

    rotation,

    scale:
        inheritedScale,

    anchorMode:
        shape.generativeAnchorMode
};
                    return (
                        <div
                            key={
                                instance.id
                            }
                            className="vector-layer"
                        >
                            {renderShapePixels(
                                generativeShape,
                                instance
                            )}
                        </div>
                    );
                }
            )}
    </>
);

           
}

        return null;
    }


function renderBranchHandleLine(
    start: Point2D,
    end: Point2D,
    key: string
) {

    const startX =
        start.x * zoom +
        zoom / 2;

    const startY =
        start.y * zoom +
        zoom / 2;


    const endX =
        end.x * zoom +
        zoom / 2;

    const endY =
        end.y * zoom +
        zoom / 2;


    const dx =
        endX - startX;

    const dy =
        endY - startY;


    const length =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    const angle =
        Math.atan2(
            dy,
            dx
        )
        *
        180 /
        Math.PI;


    return (
        <div
            key={key}
            className="branch-handle-line"
            style={{
                left:
                    startX,

                top:
                    startY,

                width:
                    length,

                transform:
                    `rotate(${angle}deg)`
            }}
        />
    );
}


function renderBranchEditor() {

    if (
        !selectedShape ||
        selectedShape.kind !==
        "branch"
    ) {
        return null;
    }


    return (
        <>
            {selectedShape.points.map(
                (
                    point,
                    index
                ) => {

                    const anchor =
                        point.position;

                    const controlIn =
                        point.controlIn;

                    const controlOut =
                        point.controlOut;


                    return (
                        <div
                            key={
                                `branch-controls-${index}`
                            }
                        >

                            {renderBranchHandleLine(
                                anchor,
                                controlIn,
                                `branch-in-line-${index}`
                            )}

                            {renderBranchHandleLine(
                                anchor,
                                controlOut,
                                `branch-out-line-${index}`
                            )}


                            <div
                                className="branch-handle"
                                style={{
                                    left:
                                        controlIn.x *
                                        zoom,

                                    top:
                                        controlIn.y *
                                        zoom
                                }}
                                onMouseDown={
                                    event => {

                                        event.preventDefault();
                                        event.stopPropagation();

                                        setBranchDragTarget({
                                            pointIndex:
                                                index,

                                            kind:
                                                "controlIn"
                                        });
                                    }
                                }
                            />


                            <div
                                className="branch-anchor"
                                style={{
                                    left:
                                        anchor.x *
                                        zoom,

                                    top:
                                        anchor.y *
                                        zoom
                                }}
                                onMouseDown={
                                    event => {

                                        event.preventDefault();
                                        event.stopPropagation();

                                        setBranchDragTarget({
                                            pointIndex:
                                                index,

                                            kind:
                                                "position"
                                        });
                                    }
                                }
                            />


                            <div
                                className="branch-handle"
                                style={{
                                    left:
                                        controlOut.x *
                                        zoom,

                                    top:
                                        controlOut.y *
                                        zoom
                                }}
                                onMouseDown={
                                    event => {

                                        event.preventDefault();
                                        event.stopPropagation();

                                        setBranchDragTarget({
                                            pointIndex:
                                                index,

                                            kind:
                                                "controlOut"
                                        });
                                    }
                                }
                            />

                        </div>
                    );
                }
            )}
        </>
    );
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


    return renderShapePixels(
        sourceShape,
        instance
    );
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
function renderBranchDraft() {

    if (
        selectedTool !== "branch" ||
        branchDraftPoints.length < 2
    ) {
        return null;
    }


    const points =
        buildBranchPoints(
            branchDraftPoints
        );


    const path: Point2D[] =
        [];


    for (
        let i = 0;
        i < points.length - 1;
        i++
    ) {

        const current =
            points[i];

        const next =
            points[i + 1];


        const segment =
            flattenCubicBezier(
                current.position,
                current.controlOut,
                next.controlIn,
                next.position,
                0.35
            );


        if (
            path.length > 0
        ) {
            segment.shift();
        }


        path.push(
            ...segment
        );
    }


    const outerPixels =
        rasterizeThickPath(
            path,
            7
        );


    const innerPixels =
        rasterizeThickPath(
            path,
            5
        );


    return (
        <>
            {renderPixels(
                outerPixels,
                strokeColor,
                "branch-draft-border"
            )}

            {renderPixels(
                innerPixels,
                selectedColor,
                "branch-draft-fill"
            )}
        </>
    );
}
 function renderDraftPoints() {

    const points =
        selectedTool === "branch"
            ? branchDraftPoints
            : draftPoints;


    return points.map(
        (point, index) => (
            <div
                key={`draft-${index}`}
                className="vector-control-point"
                style={{
                    left:
                        point.x * zoom +
                        zoom / 2,

                    top:
                        point.y * zoom +
                        zoom / 2
                }}
                title={
                    `(${point.x}, ${point.y})`
                }
            />
        )
    );
}


function updateBranchPoint(
    pointIndex: number,
    kind:
        | "position"
        | "controlIn"
        | "controlOut",
    nextPosition: Point2D
) {

    if (!selectedShapeId) {
        return;
    }


    setShapes(
        previous =>
            previous.map(
                shape => {

                    if (
                        shape.id !==
                        selectedShapeId ||
                        shape.kind !==
                        "branch"
                    ) {
                        return shape;
                    }


                    const points =
                        shape.points.map(
                            (
                                point,
                                index
                            ) => {

                                if (
                                    index !==
                                    pointIndex
                                ) {
                                    return point;
                                }


                                /*
                                    Al mover el anchor,
                                    desplazamos también
                                    sus dos handles.
                                */
                                if (
                                    kind ===
                                    "position"
                                ) {

                                    const dx =
                                        nextPosition.x -
                                        point.position.x;

                                    const dy =
                                        nextPosition.y -
                                        point.position.y;


                                    return {
                                        ...point,

                                        position:
                                            nextPosition,

                                        controlIn: {
                                            x:
                                                point.controlIn.x +
                                                dx,

                                            y:
                                                point.controlIn.y +
                                                dy
                                        },

                                        controlOut: {
                                            x:
                                                point.controlOut.x +
                                                dx,

                                            y:
                                                point.controlOut.y +
                                                dy
                                        }
                                    };
                                }


                                if (
                                    kind ===
                                    "controlIn"
                                ) {
                                    return {
                                        ...point,

                                        controlIn:
                                            nextPosition
                                    };
                                }


                                return {
                                    ...point,

                                    controlOut:
                                        nextPosition
                                };
                            }
                        );


                    return {
                        ...shape,
                        points
                    };
                }
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
<button
    className={
        selectedTool === "branch"
            ? "vector-tool selected"
            : "vector-tool"
    }
    onClick={() =>
        setSelectedTool(
            "branch"
        )
    }
>
    Branch
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

    setSelectedGeneratorId(
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

    setSelectedGeneratorId(
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

                    {selectedTool === "branch" && (
    <div className="branch-draft-status">

        <span>
            Branch path:
            {" "}
            <strong>
                {branchDraftPoints.length}
            </strong>
            {" "}
            {branchDraftPoints.length === 1
                ? "point"
                : "points"}
        </span>


        {branchDraftPoints.length > 0 && (
            <div className="branch-draft-actions">

                <button
                    type="button"
                    onClick={() => {
                        setBranchDraftPoints([]);
                    }}
                >
                    Cancel
                </button>


                <button
                    type="button"
                    disabled={
                        branchDraftPoints.length < 2
                    }
                    onClick={() => {
                        finishBranch();
                    }}
                >
                    Accept
                </button>

            </div>
        )}

    </div>
)}
                    </div>

                </div>


                <div className="vector-canvas-wrapper">

                  <div
    ref={gridRef}
    className="vector-grid"
    style={gridStyle}
    onClick={handleGridClick}
>

                        <div className="vector-origin">
                            0,0
                        </div>

                        <div className="vector-layer">

    {shapes.map(
        shape =>
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
    {renderBranchDraft()}
</div>


<div className="vector-layer branch-editor-layer">
    {renderBranchEditor()}
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

                <div
    style={{
        padding: "8px",
        background: "#111",
        color: "#00ff66",
        fontSize: "12px"
    }}
>
    <div>
        shapeId:
        {" "}
        {selectedShapeId ?? "NULL"}
    </div>

    <div>
        shape:
        {" "}
        {selectedShape?.kind ?? "NULL"}
    </div>

    <div>
        group:
        {" "}
        {selectedGroup?.name ?? "NULL"}
    </div>

    <div>
        generator:
        {" "}
        {selectedGenerator?.name ?? "NULL"}
    </div>
</div>
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

{selectedGenerator && (
    <>
        <h3>
            Selected Generator
        </h3>

        {selectedGenerator.kind === "star-spawn" && (
            <div className="vector-selected-data">

                <div>
                    <strong>
                        Name:
                    </strong>
                    {" "}
                    {selectedGenerator.name}
                </div>

                <div>
                    <strong>
                        Type:
                    </strong>
                    {" "}
                    Star Spawn
                </div>


                <div className="vector-property compact-full">
                    <label>
                        Count
                    </label>

                    <div className="range-number-control">

                        <input
                            type="range"
                            min="1"
                            max="64"
                            step="1"
                            value={
                                selectedGenerator.count
                            }
                            onChange={
                                event =>
                                    updateSelectedGenerator({
                                        count:
                                            Number(
                                                event.target.value
                                            )
                                    })
                            }
                        />

                        <input
                            type="number"
                            min="1"
                            max="64"
                            step="1"
                            value={
                                selectedGenerator.count
                            }
                            onChange={
                                event =>
                                    updateSelectedGenerator({
                                        count:
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
                </div>


                <div className="vector-property compact-full">
                    <label>
                        Radius
                    </label>

                    <div className="range-number-control">

                        <input
                            type="range"
                            min="0"
                            max="128"
                            step="1"
                            value={
                                selectedGenerator.radius
                            }
                            onChange={
                                event =>
                                    updateSelectedGenerator({
                                        radius:
                                            Number(
                                                event.target.value
                                            )
                                    })
                            }
                        />

                        <input
                            type="number"
                            min="0"
                            max="128"
                            step="1"
                            value={
                                selectedGenerator.radius
                            }
                            onChange={
                                event =>
                                    updateSelectedGenerator({
                                        radius:
                                            Math.max(
                                                0,
                                                Number(
                                                    event.target.value
                                                )
                                            )
                                    })
                            }
                        />

                    </div>
                </div>


                <div className="vector-property compact-full">
                    <label>
                        Angle Offset
                    </label>

                    <div className="range-number-control">

                        <input
                            type="range"
                            min="-180"
                            max="180"
                            step="1"
                            value={
                                selectedGenerator.angleOffset *
                                180 /
                                Math.PI
                            }
                            onChange={
                                event =>
                                    updateSelectedGenerator({
                                        angleOffset:
                                            Number(
                                                event.target.value
                                            )
                                            *
                                            Math.PI /
                                            180
                                    })
                            }
                        />

                        <input
                            type="number"
                            min="-180"
                            max="180"
                            step="1"
                            value={
                                Math.round(
                                    selectedGenerator.angleOffset *
                                    180 /
                                    Math.PI
                                )
                            }
                            onChange={
                                event =>
                                    updateSelectedGenerator({
                                        angleOffset:
                                            Number(
                                                event.target.value
                                            )
                                            *
                                            Math.PI /
                                            180
                                    })
                            }
                        />

                    </div>
                </div>


                <div className="vector-property compact-full">
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
                                selectedGenerator.scale
                            }
                            onChange={
                                event =>
                                    updateSelectedGenerator({
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
                                selectedGenerator.scale
                            }
                            onChange={
                                event =>
                                    updateSelectedGenerator({
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


                <div className="vector-property compact-full">
                    <label>
                        Rotation Mode
                    </label>

                    <select
                        value={
                            selectedGenerator.rotationMode
                        }
                        onChange={
                            event =>
                                updateSelectedGenerator({
                                    rotationMode:
                                        event.target.value as
                                        StarSpawnGenerator["rotationMode"]
                                })
                        }
                    >
                        <option value="keep">
                            Keep
                        </option>

                        <option value="outward">
                            Outward
                        </option>

                        <option value="inward">
                            Inward
                        </option>

                        <option value="tangent">
                            Tangent
                        </option>
                    </select>
                </div>

            </div>
        )}
    </>
)}

                        {!selectedGenerator && selectedGroup && (
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

                {!selectedGenerator && !selectedGroup && selectedShape ? (
    <div className="vector-selected-data">
<div
    style={{
        gridColumn: "1 / -1",
        padding: "10px",
        background: "yellow",
        color: "black"
    }}
>
    DEBUG:
    {" "}
    {selectedShape.kind}
</div>
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


{selectedShape.kind === "branch" && (
    <>
        <div className="vector-property">

            <label>
                Thickness
            </label>

            <div className="range-number-control">

                <input
                    type="range"
                    min="1"
                    max="40"
                    step="1"
                    value={
                        selectedShape.thickness
                    }
                    onChange={
                        event =>
                            updateSelectedShape({
                                thickness:
                                    Number(
                                        event.target.value
                                    )
                            })
                    }
                />

                <input
                    type="number"
                    min="1"
                    max="40"
                    step="1"
                    value={
                        selectedShape.thickness
                    }
                    onChange={
                        event =>
                            updateSelectedShape({
                                thickness:
                                    clamp(
                                        Number(
                                            event.target.value
                                        ),
                                        1,
                                        40
                                    )
                            })
                    }
                />

            </div>

        </div>


        <div className="vector-property">

            <label>
                Border Width
            </label>

            <div className="range-number-control">

                <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={
                        selectedShape.borderWidth
                    }
                    onChange={
                        event =>
                            updateSelectedShape({
                                borderWidth:
                                    Number(
                                        event.target.value
                                    )
                            })
                    }
                />

                <input
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    value={
                        selectedShape.borderWidth
                    }
                    onChange={
                        event =>
                            updateSelectedShape({
                                borderWidth:
                                    clamp(
                                        Number(
                                            event.target.value
                                        ),
                                        0,
                                        10
                                    )
                            })
                    }
                />

            </div>

        </div>
        <div className="vector-property">

    <label>
        Generative Branches
    </label>

    <div className="range-number-control">

        <input
            type="range"
            min="0"
            max="32"
            step="1"
            value={
                selectedShape.generativeCount
            }
            onChange={
                event =>
                    updateSelectedShape({
                        generativeCount:
                            Number(
                                event.target.value
                            )
                    })
            }
        />

        <input
            type="number"
            min="0"
            max="32"
            step="1"
            value={
                selectedShape.generativeCount
            }
            onChange={
                event =>
                    updateSelectedShape({
                        generativeCount:
                            clamp(
                                Number(
                                    event.target.value
                                ),
                                0,
                                32
                            )
                    })
            }
        />

    </div>

</div>


<div className="vector-property">

    <label>
        Spawn Object
    </label>

    <select
        value={
            selectedShape.generativeShapeId
            ??
            ""
        }
        onChange={
            event =>
                updateSelectedShape({
                    generativeShapeId:
                        event.target.value === ""
                            ? null
                            : event.target.value
                })
        }
    >

        <option value="">
            None
        </option>


        {shapes
            .filter(
                candidate =>
                    candidate.id !==
                    selectedShape.id
                    &&
                    candidate.kind !==
                    "branch"
            )
            .map(
                candidate => (
                    <option
                        key={
                            candidate.id
                        }
                        value={
                            candidate.id
                        }
                    >
                        {candidate.name}
                    </option>
                )
            )}

    </select>

</div>

<div className="vector-property">

    <label>
        Rotation Mode
    </label>

    <select
        value={
            selectedShape.generativeRotationMode
        }
        onChange={
            event =>
                updateSelectedShape({
                    generativeRotationMode:
                        event.target.value as
                            | "keep"
                            | "tangent"
                            | "normal-left"
                            | "normal-right"
                            | "alternate-normal"
                })
        }
    >
        <option value="keep">
            Keep
        </option>

        <option value="tangent">
            Tangent
        </option>

        <option value="normal-left">
            Perpendicular Left
        </option>

        <option value="normal-right">
            Perpendicular Right
        </option>

        <option value="alternate-normal">
            Alternate Perpendicular
        </option>
    </select>

</div>
<div className="vector-property">

    <label>
        Spawn Anchor
    </label>

    <select
        value={
            selectedShape.generativeAnchorMode
        }
        onChange={
            event =>
                updateSelectedShape({
                    generativeAnchorMode:
                        event.target.value as
                            | "center"
                            | "start"
                            | "end"
                })
        }
    >
        <option value="center">
            Center
        </option>

        <option value="start">
            Start
        </option>

        <option value="end">
            End
        </option>
    </select>

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