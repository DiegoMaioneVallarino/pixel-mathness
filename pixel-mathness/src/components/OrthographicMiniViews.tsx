import {
    useEffect,
    useRef
} from "react";

import type {
    PrimaryObject
} from "../generation/cuboids/types";

import {
    getCuboidWorldBounds
} from "../generation/cuboids/getCuboidWorldBounds";

type Projection =
    | "top"
    | "front"
    | "side";


type MiniViewProps = {
    objects: PrimaryObject[];
    projection: Projection;

    width?: number;
    height?: number;
};


function OrthographicCanvas({
    objects,
    projection,
    width = 180,
    height = 180
}: MiniViewProps) {

    const canvasRef =
        useRef<HTMLCanvasElement | null>(
            null
        );


    useEffect(
        () => {

            const canvas =
                canvasRef.current;

            if (!canvas) {
                return;
            }


            const ctx =
                canvas.getContext("2d");

            if (!ctx) {
                return;
            }


            ctx.clearRect(
                0,
                0,
                width,
                height
            );


            // =========================
            // BACKGROUND
            // =========================

            ctx.fillStyle =
                "#ffffff";

            ctx.fillRect(
                0,
                0,
                width,
                height
            );


            // =========================
            // GRID AXES
            // =========================

            const centerX =
                width / 2;

            const centerY =
                height / 2;


            ctx.strokeStyle =
                "#dddddd";

            ctx.lineWidth = 1;


            // horizontal axis

            ctx.beginPath();

            ctx.moveTo(
                0,
                centerY
            );

            ctx.lineTo(
                width,
                centerY
            );

            ctx.stroke();


            // vertical axis

            ctx.beginPath();

            ctx.moveTo(
                centerX,
                0
            );

            ctx.lineTo(
                centerX,
                height
            );

            ctx.stroke();


            // =========================
            // SCALE
            // =========================

            const scale = 2;


            // =========================
            // OBJECTS
            // =========================

            for (
                const object
                of objects
            ) {

                const bounds =
                getCuboidWorldBounds(
                    object.cuboid
                );
                const isLight =
                  object.id === "light-visual";
                let rectX = 0;
                let rectY = 0;

                let rectWidth = 0;
                let rectHeight = 0;


                // =====================
                // TOP
                // X / Y
                // =====================
// =====================
// TOP
// X / Y
// =====================

if (
    projection === "top"
) {

    rectX =
        centerX +
        bounds.minX * scale;

    rectY =
        centerY +
        bounds.minY * scale;

    rectWidth =
        (
            bounds.maxX -
            bounds.minX
        ) * scale;

    rectHeight =
        (
            bounds.maxY -
            bounds.minY
        ) * scale;
}


// =====================
// FRONT
// X / Z
// =====================

if (
    projection === "front"
) {

    rectX =
        centerX +
        bounds.minX * scale;

    rectY =
        centerY -
        bounds.maxZ * scale;

    rectWidth =
        (
            bounds.maxX -
            bounds.minX
        ) * scale;

    rectHeight =
        (
            bounds.maxZ -
            bounds.minZ
        ) * scale;
}


// =====================
// SIDE
// Y / Z
// =====================

if (
    projection === "side"
) {

    rectX =
        centerX +
        bounds.minY * scale;

    rectY =
        centerY -
        bounds.maxZ * scale;

    rectWidth =
        (
            bounds.maxY -
            bounds.minY
        ) * scale;

    rectHeight =
        (
            bounds.maxZ -
            bounds.minZ
        ) * scale;
}


                // =====================
                // FILL
                // =====================

                ctx.globalAlpha =
                    0.25;

                ctx.fillStyle =
                    "#777777";

                ctx.fillRect(
                    rectX,
                    rectY,
                    rectWidth,
                    rectHeight
                );


                // =====================
                // BORDER
                // =====================

                ctx.globalAlpha =
                    1;

                ctx.strokeStyle =
                    object.id
                    === objects[
                        objects.length - 1
                    ]?.id

                        ? "#000000"
                        : "#555555";

if (isLight) {
    ctx.fillStyle =
        "rgba(255, 220, 40, 0.85)";

    ctx.strokeStyle =
        "rgb(180, 140, 0)";
}
else {
    ctx.fillStyle =
        "rgba(120, 120, 120, 0.25)";

    ctx.strokeStyle =
        "rgb(80, 80, 80)";
}
                ctx.strokeRect(
                    rectX,
                    rectY,
                    rectWidth,
                    rectHeight
                );
            }


            ctx.globalAlpha = 1;

        },
        [
            objects,
            projection,
            width,
            height
        ]
    );


    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="orthographic-mini-canvas"
        />
    );
}


type OrthographicMiniViewsProps = {
    objects: PrimaryObject[];
};


export function OrthographicMiniViews({
    objects
}: OrthographicMiniViewsProps) {

    return (

        <div className="orthographic-views">

            <div className="orthographic-view">

                <strong>
                    TOP
                </strong>

                <OrthographicCanvas
                    objects={objects}
                    projection="top"
                />

            </div>


            <div className="orthographic-view">

                <strong>
                    FRONT
                </strong>

                <OrthographicCanvas
                    objects={objects}
                    projection="front"
                />

            </div>


            <div className="orthographic-view">

                <strong>
                    SIDE
                </strong>

                <OrthographicCanvas
                    objects={objects}
                    projection="side"
                />

            </div>

        </div>
    );
}