import type {
    PixelMatrix
} from "../../pixelmathness/types/PixelMatrix";

import type {
    Cuboid,
    CuboidPixelRole,
    CuboidRasterCommand,
    CuboidRasterStructure
} from "./types";


import type {
    CuboidPalette
} from "./cuboidPalette";

import {
    defaultCuboidPalette
} from "./cuboidPalette";

type PixelPoint = {
    x: number;
    y: number;
};

function offsetPointY(
    point: PixelPoint,
    offsetY: number
): PixelPoint {
    return {
        x: point.x,
        y: point.y + offsetY
    };
}

type IsoEdgeResult = {
    pairStart: PixelPoint;
    pairEnd: PixelPoint;
    xDirection: 1 | -1;
};


type IsoVertexPair = {
    left: PixelPoint;
    right: PixelPoint;
};


type IsoTopFaceGeometry = {
    top: IsoVertexPair;
    right: IsoVertexPair;
    bottom: IsoVertexPair;
    left: IsoVertexPair;

    widthSteps: number;
    depthSteps: number;

    topStart: PixelPoint;
    rightStart: PixelPoint;
    bottomStart: PixelPoint;
    leftStart: PixelPoint;
};


type RGBA = {
    r: number;
    g: number;
    b: number;
    a: number;
};


// =====================================================
// MATRIX
// =====================================================

function createBlankMatrix(
    width: number,
    height: number
): PixelMatrix {

    return Array.from(
        { length: height },
        () =>
            Array.from(
                { length: width },
                () => ({
                    r: 255,
                    g: 255,
                    b: 255,
                    a: 255
                })
            )
    );
}

function createRasterStructure(
    width: number,
    height: number
): CuboidRasterStructure {

    return {
        width,
        height,
        commands: []
    };
}


// =====================================================
// PIXELS
// =====================================================

function setBlackPixel(
    matrix: PixelMatrix,
    x: number,
    y: number
) {

    if (
        x < 0 ||
        y < 0 ||
        y >= matrix.length ||
        x >= matrix[0].length
    ) {
        return;
    }

    matrix[y][x] = {
        r: 0,
        g: 0,
        b: 0,
        a: 255
    };
}


function setRedPixel(
    matrix: PixelMatrix,
    x: number,
    y: number
) {

    if (
        x < 0 ||
        y < 0 ||
        y >= matrix.length ||
        x >= matrix[0].length
    ) {
        return;
    }

    matrix[y][x] = {
        r: 255,
        g: 0,
        b: 0,
        a: 255
    };
}
function createCommand(
    objectId: string,
    role: CuboidPixelRole
): CuboidRasterCommand {

    return {
        objectId,
        role,
        indices: []
    };
}


function addCommandPixel(
    structure: CuboidRasterStructure,
    command: CuboidRasterCommand,
    x: number,
    y: number
) {

    if (
        x < 0 ||
        x >= structure.width ||
        y < 0 ||
        y >= structure.height
    ) {
        return;
    }

    command.indices.push(
        y * structure.width + x
    );
}
function setColorPixel(
    matrix: PixelMatrix,
    x: number,
    y: number,
    color: RGBA
) {

    if (
        x < 0 ||
        y < 0 ||
        y >= matrix.length ||
        x >= matrix[0].length
    ) {
        return;
    }

    matrix[y][x] = {
        ...color
    };
}


function averageColor(
    a: RGBA,
    b: RGBA
): RGBA {

    return {
        r: Math.round(
            (a.r + b.r) / 2
        ),

        g: Math.round(
            (a.g + b.g) / 2
        ),

        b: Math.round(
            (a.b + b.b) / 2
        ),

        a: 255
    };
}


function lightenColor(
    base: RGBA,
    amount: number
): RGBA {

    const t =
        Math.max(
            0,
            Math.min(
                1,
                amount
            )
        );

    return {

        r: Math.round(
            base.r +
            (255 - base.r) * t
        ),

        g: Math.round(
            base.g +
            (255 - base.g) * t
        ),

        b: Math.round(
            base.b +
            (255 - base.b) * t
        ),

        a: 255
    };
}

function setWhiteTransparentPixel(
    matrix: PixelMatrix,
    x: number,
    y: number,
    alpha: number
) {
    if (
        x < 0 ||
        y < 0 ||
        y >= matrix.length ||
        x >= matrix[0].length
    ) {
        return;
    }

    blendPixel(
        matrix,
        x,
        y,
        {
            r: 255,
            g: 255,
            b: 255,
            a: Math.round(
                Math.max(0, Math.min(1, alpha)) * 255
            )
        }
    );
}


// =====================================================
// ALPHA
// =====================================================

function blendPixel(
    matrix: PixelMatrix,
    x: number,
    y: number,
    source: RGBA
) {

    if (
        x < 0 ||
        y < 0 ||
        y >= matrix.length ||
        x >= matrix[0].length
    ) {
        return;
    }

    const destination =
        matrix[y][x];

    const srcAlpha =
        source.a / 255;

    const dstAlpha =
        destination.a / 255;

    const outAlpha =
        srcAlpha +
        dstAlpha *
        (1 - srcAlpha);


    if (outAlpha === 0) {
        return;
    }


    matrix[y][x] = {

        r: Math.round(
            (
                source.r *
                srcAlpha
                +
                destination.r *
                dstAlpha *
                (1 - srcAlpha)
            )
            /
            outAlpha
        ),

        g: Math.round(
            (
                source.g *
                srcAlpha
                +
                destination.g *
                dstAlpha *
                (1 - srcAlpha)
            )
            /
            outAlpha
        ),

        b: Math.round(
            (
                source.b *
                srcAlpha
                +
                destination.b *
                dstAlpha *
                (1 - srcAlpha)
            )
            /
            outAlpha
        ),

        a: Math.round(
            outAlpha * 255
        )
    };
}


// =====================================================
// ISO EDGE GEOMETRY
// =====================================================

function calculateIsoEdge(
    start: PixelPoint,
    steps: number,
    xDirection: 1 | -1,
    yDirection: 1 | -1
): IsoEdgeResult {

    let x =
        start.x;

    let y =
        start.y;


    let lastA: PixelPoint = {
        x,
        y
    };

    let lastB: PixelPoint = {
        x: x + xDirection,
        y
    };


    for (
        let i = 0;
        i < steps;
        i++
    ) {

        lastA = {
            x,
            y
        };

        lastB = {
            x:
                x + xDirection,
            y
        };


        x +=
            2 * xDirection;

        y +=
            yDirection;
    }


    return {
        pairStart:
            lastA,

        pairEnd:
            lastB,

        xDirection
    };
}


function normalizePair(
    a: PixelPoint,
    b: PixelPoint
): IsoVertexPair {

    if (
        a.x <= b.x
    ) {

        return {
            left: a,
            right: b
        };
    }


    return {
        left: b,
        right: a
    };
}


function connectNextEdge(
    previous: IsoEdgeResult,
    nextXDirection: 1 | -1
): PixelPoint {

    if (
        previous.xDirection ===
        nextXDirection
    ) {

        return {
            ...previous.pairStart
        };
    }


    return {
        ...previous.pairEnd
    };
}


// =====================================================
// CALCULATE TOP FACE
// NO DIBUJA NADA
// =====================================================

function calculateIsoTopFace(
    centerX: number,
    centerY: number,
    width: number,
    depth: number
): IsoTopFaceGeometry {

    const safeWidth =
        Math.max(
            2,
            Math.round(
                width / 2
            ) * 2
        );


    const safeDepth =
        Math.max(
            2,
            Math.round(
                depth / 2
            ) * 2
        );


    const widthSteps =
        safeWidth / 2;

    const depthSteps =
        safeDepth / 2;


    const topStart: PixelPoint = {

        x:
            Math.round(
                centerX
            ),

        y:
            Math.round(
                centerY -
                (
                    widthSteps +
                    depthSteps
                ) / 2
            )
    };


    // TOP -> RIGHT

    const edge1 =
        calculateIsoEdge(
            topStart,
            widthSteps,
            1,
            1
        );


    const top =
        normalizePair(
            topStart,
            {
                x:
                    topStart.x + 1,

                y:
                    topStart.y
            }
        );


    // RIGHT -> BOTTOM

    const rightStart =
        connectNextEdge(
            edge1,
            -1
        );


    const right =
        normalizePair(
            edge1.pairStart,
            edge1.pairEnd
        );


    const edge2 =
        calculateIsoEdge(
            rightStart,
            depthSteps,
            -1,
            1
        );


    // BOTTOM -> LEFT

    const bottomStart =
        connectNextEdge(
            edge2,
            -1
        );


    const bottom =
        normalizePair(
            edge2.pairStart,
            edge2.pairEnd
        );


    const edge3 =
        calculateIsoEdge(
            bottomStart,
            widthSteps,
            -1,
            -1
        );


    // LEFT -> TOP

    const leftStart =
        connectNextEdge(
            edge3,
            1
        );


    const left =
        normalizePair(
            edge3.pairStart,
            edge3.pairEnd
        );


    return {

        top,
        right,
        bottom,
        left,

        widthSteps,
        depthSteps,

        topStart,
        rightStart,
        bottomStart,
        leftStart
    };
}


// =====================================================
// DRAW ISO EDGE
// =====================================================

function drawIsoEdge(
    structure: CuboidRasterStructure,
    objectId: string,
    start: PixelPoint,
    steps: number,
    xDirection: 1 | -1,
    yDirection: 1 | -1,
    hidden = false
) {

    const command =
        createCommand(
            objectId,
            hidden
                ? "hidden-edge"
                : "outline"
        );


    let x =
        start.x;

    let y =
        start.y;


    for (
        let i = 0;
        i < steps;
        i++
    ) {

        addCommandPixel(
            structure,
            command,
            x,
            y
        );

        addCommandPixel(
            structure,
            command,
            x + xDirection,
            y
        );


        x +=
            2 * xDirection;

        y +=
            yDirection;
    }


    structure.commands.push(
        command
    );
}
function collectIsoEdgePixels(
    start: PixelPoint,
    steps: number,
    xDirection: 1 | -1,
    yDirection: 1 | -1
): PixelPoint[] {

    const pixels: PixelPoint[] = [];

    let x = start.x;
    let y = start.y;

    for (
        let i = 0;
        i < steps;
        i++
    ) {

        pixels.push({
            x,
            y
        });

        pixels.push({
            x: x + xDirection,
            y
        });

        x +=
            2 * xDirection;

        y +=
            yDirection;
    }

    return pixels;
}
function fillDiscreteTopFace(
        objectId: string,
    structure: CuboidRasterStructure,
    geometry: IsoTopFaceGeometry,
    role: CuboidPixelRole
) {

    const command =
        createCommand(
            objectId,
            role);


    const borderPixels = [

        ...collectIsoEdgePixels(
            geometry.topStart,
            geometry.widthSteps,
            1,
            1
        ),

        ...collectIsoEdgePixels(
            geometry.rightStart,
            geometry.depthSteps,
            -1,
            1
        ),

        ...collectIsoEdgePixels(
            geometry.bottomStart,
            geometry.widthSteps,
            -1,
            -1
        ),

        ...collectIsoEdgePixels(
            geometry.leftStart,
            geometry.depthSteps,
            1,
            -1
        )
    ];


    const rows =
        new Map<
            number,
            number[]
        >();


    for (
        const pixel
        of borderPixels
    ) {

        const row =
            rows.get(pixel.y);

        if (row) {
            row.push(pixel.x);
        }
        else {
            rows.set(
                pixel.y,
                [pixel.x]
            );
        }
    }


    for (
        const [y, xs]
        of rows
    ) {

        const minX =
            Math.min(...xs);

        const maxX =
            Math.max(...xs);


        for (
            let x = minX;
            x <= maxX;
            x++
        ) {

            addCommandPixel(
                structure,
                command,
                x,
                y
            );
        }
    }


    structure.commands.push(
        command
    );
}
// =====================================================
// VERTICAL
// =====================================================

function drawVertical(
    structure: CuboidRasterStructure,
    objectId: string,
    x: number,
    startY: number,
    height: number,
    hidden = false
) {

    const command =
        createCommand(
            objectId,
            hidden
                ? "hidden-edge"
                : "outline"
        );


    for (
        let y = startY;
        y <= startY + height;
        y++
    ) {

        addCommandPixel(
            structure,
            command,
            x,
            y
        );
    }


    structure.commands.push(
        command
    );
}

function drawHighlightVertical(
        objectId: string,
    structure: CuboidRasterStructure,
    x: number,
    startY: number,
    height: number,
    role: CuboidPixelRole
) {

    const command =
        createCommand(
            objectId,
            role);


    for (
        let y = startY;
        y <= startY + height;
        y++
    ) {

        addCommandPixel(
            structure,
            command,
            x,
            y
        );
    }


    structure.commands.push(
        command
    );
}

function drawHighlightIsoEdge(
    objectId: string,
    structure: CuboidRasterStructure,
    start: PixelPoint,
    steps: number,
    xDirection: 1 | -1,
    yDirection: 1 | -1,
    role: CuboidPixelRole
) {

    const command =
        createCommand(
            objectId,
            role);


    let x =
        start.x;

    let y =
        start.y;


    for (
        let i = 0;
        i < steps;
        i++
    ) {

        addCommandPixel(
            structure,
            command,
            x,
            y
        );

        addCommandPixel(
            structure,
            command,
            x + xDirection,
            y
        );


        x +=
            2 * xDirection;

        y +=
            yDirection;
    }


    structure.commands.push(
        command
    );
}


// =====================================================
// OFFSET
// =====================================================

function offsetPairY(
    pair: IsoVertexPair,
    offsetY: number
): IsoVertexPair {

    return {

        left: {
            x:
                pair.left.x,

            y:
                pair.left.y +
                offsetY
        },

        right: {
            x:
                pair.right.x,

            y:
                pair.right.y +
                offsetY
        }
    };
}


// =====================================================
// POLYGON
// =====================================================

function pointInsidePolygon(
    x: number,
    y: number,
    polygon: PixelPoint[]
): boolean {

    let inside =
        false;


    for (
        let i = 0,
        j = polygon.length - 1;

        i < polygon.length;

        j = i++
    ) {

        const xi =
            polygon[i].x;

        const yi =
            polygon[i].y;

        const xj =
            polygon[j].x;

        const yj =
            polygon[j].y;


        const intersects =
            (
                yi > y
            ) !== (
                yj > y
            )
            &&
            x <
                (
                    (xj - xi) *
                    (y - yi)
                )
                /
                (yj - yi)
                +
                xi;


        if (
            intersects
        ) {
            inside =
                !inside;
        }
    }


    return inside;
}


function fillFace(
    objectId: string,
    structure: CuboidRasterStructure,
    polygon: PixelPoint[],
    role: CuboidPixelRole
) {

    const command =
        createCommand(
            objectId,
            role);


    const minX =
        Math.floor(
            Math.min(
                ...polygon.map(
                    point =>
                        point.x
                )
            )
        );


    const maxX =
        Math.ceil(
            Math.max(
                ...polygon.map(
                    point =>
                        point.x
                )
            )
        );


    const minY =
        Math.floor(
            Math.min(
                ...polygon.map(
                    point =>
                        point.y
                )
            )
        );


    const maxY =
        Math.ceil(
            Math.max(
                ...polygon.map(
                    point =>
                        point.y
                )
            )
        );


    for (
        let y = minY;
        y <= maxY;
        y++
    ) {

        for (
            let x = minX;
            x <= maxX;
            x++
        ) {

            if (
                pointInsidePolygon(
                    x + 0.5,
                    y + 0.5,
                    polygon
                )
            ) {

                addCommandPixel(
                    structure,
                    command,
                    x,
                    y
                );
            }
        }
    }


    structure.commands.push(
        command
    );
}


// =====================================================
// VISIBLE TOP EDGES
// =====================================================

function drawTopVisibleEdges(
    structure: CuboidRasterStructure,
    objectId: string,
    geometry: IsoTopFaceGeometry
) {

    drawIsoEdge(
        structure,
        objectId,
        geometry.topStart,
        geometry.widthSteps,
        1,
        1
    );

    drawIsoEdge(
        structure,
        objectId,
        geometry.leftStart,
        geometry.depthSteps,
        1,
        -1
    );
}


// =====================================================
// BOTTOM VISIBLE EDGES
// =====================================================

function drawBottomVisibleEdges(
    structure: CuboidRasterStructure,
    objectId: string,
    geometry: IsoTopFaceGeometry,
    height: number
) {

    const right =
        offsetPairY(
            geometry.right,
            height
        );

    const bottom =
        offsetPairY(
            geometry.bottom,
            height
        );


    drawIsoEdge(
        structure,
        objectId,
        right.right,
        geometry.depthSteps,
        -1,
        1
    );


    drawIsoEdge(
        structure,
        objectId,
        bottom.right,
        geometry.widthSteps,
        -1,
        -1
    );
}


// =====================================================
// MAIN
// =====================================================
export function drawCuboidWireframe(
    structure: CuboidRasterStructure,
    cuboid: Cuboid,
    objectId: string
): void {

    const canvasHeight =
        structure.height;

    const canvasWidth =
        structure.width;

const centerX =
    canvasWidth / 2
    +
    cuboid.x * 2
    -
    cuboid.y * 2;

const centerY =
    canvasHeight / 2
    +
    cuboid.x
    +
    cuboid.y
    -
    (
        cuboid.z +
        cuboid.height
    );

    const height =
        Math.max(
            0,
            Math.round(
                cuboid.height
            )
        );


    // =================================================
    // GEOMETRY
    // =================================================

    const vertices =
        calculateIsoTopFace(
            centerX,
            centerY,
            cuboid.width,
            cuboid.depth
        );


    

    const bottomRight =
        offsetPairY(
            vertices.right,
            height
        );


    const bottomBottom =
        offsetPairY(
            vertices.bottom,
            height
        );


    const bottomLeft =
        offsetPairY(
            vertices.left,
            height
        );


    // =================================================
    // POLYGONS
    // =================================================

    const topFace:
        PixelPoint[] = [

        vertices.top.left,
        vertices.right.right,
        vertices.bottom.right,
        vertices.left.left
    ];


    const leftFace:
        PixelPoint[] = [

        vertices.left.left,
        vertices.bottom.right,
        bottomBottom.right,
        bottomLeft.left
    ];


    const rightFace:
        PixelPoint[] = [

        vertices.bottom.right,
        vertices.right.right,
        bottomRight.right,
        bottomBottom.right
    ];

// =================================================
// 1. HIDDEN EDGES
// SE DIBUJAN PRIMERO
// =================================================


// vertical trasera

drawVertical(
    structure,
    objectId,
    vertices.top.left.x,
    vertices.top.left.y,
    height,
    true
);


// inferior trasera derecha
// copia exacta de TOP -> RIGHT

drawIsoEdge(
    structure,
    objectId,
    offsetPointY(
        vertices.topStart,
        height
    ),

    vertices.widthSteps,

    1,
    1,

    true
);


// inferior trasera izquierda
// copia exacta de LEFT -> TOP

drawIsoEdge(
    structure,
    objectId,
    offsetPointY(
        vertices.leftStart,
        height
    ),

    vertices.depthSteps,

    1,
    -1,

    true
);
    // =================================================
    // 2. SURFACES
    // =================================================



fillDiscreteTopFace(
    objectId,
    structure,
    vertices,
    "top"
);

fillFace(
    objectId,
    structure,
    leftFace,
    "left"
);

fillFace(
    objectId,
    structure,
    rightFace,
    "right"
);





// =================================================
// DIAGONAL DERECHA
// TOP + RIGHT
// =================================================

drawHighlightIsoEdge(
    objectId,
    structure,
    vertices.rightStart,
    vertices.depthSteps,
    -1,
    1,
    "diagonal-right"

);


// =================================================
// DIAGONAL IZQUIERDA
// TOP + LEFT
// =================================================

drawHighlightIsoEdge(
    objectId,
    structure,
    vertices.bottomStart,
    vertices.widthSteps,
    -1,
    -1,
    "diagonal-left"
);


// =================================================
// VERTICAL FRONTAL
// LEFT + RIGHT
// =================================================

drawHighlightVertical(
    objectId,
    structure,
    vertices.bottom.right.x,

    // La vertical empieza 1 px debajo
    // del vértice compartido.
    vertices.bottom.right.y + 1,

    // Restamos 1 para que siga
    // terminando a la misma altura.
    Math.max(
        0,
        height - 1
    ),

    "vertical"
);


// =================================================
// 4. OUTLINE EXTERIOR NEGRO
// SIEMPRE AL FINAL
// =================================================
// SIEMPRE AL FINAL
// =================================================


// dos aristas superiores traseras

drawTopVisibleEdges(
    structure,
    objectId,
    vertices
);


drawVertical(
    structure,
    objectId,
    vertices.left.left.x,
    vertices.left.left.y,
    height
);


drawVertical(
    structure,
    objectId,
    vertices.right.right.x,
    vertices.right.right.y,
    height
);


drawBottomVisibleEdges(
    structure,
    objectId,
    vertices,
    height
);



}
export function rasterizeCuboidWireframe(
    cuboid: Cuboid,
    canvasWidth = 200,
    canvasHeight = 200
): CuboidRasterStructure {

    const structure =
        createRasterStructure(
            canvasWidth,
            canvasHeight
        );


    drawCuboidWireframe(
         structure,
    cuboid,
    "cuboid"
    );


    return structure;
}


