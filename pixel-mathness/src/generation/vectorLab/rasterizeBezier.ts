import type {
    Point2D
} from "./types";

import {
    sampleQuadraticBezier
} from "./sampleQuadraticBezier";

import {
    rasterizeLineBresenham
} from "./rasterizeLineBresenham";

import {
    cleanDigitalPath
} from "./cleanDigitalPath";


export function rasterizeQuadraticBezier(
    start: Point2D,
    control: Point2D,
    end: Point2D,
    samples = 64
): Point2D[] {

    const sampled =
        sampleQuadraticBezier(
            start,
            control,
            end,
            samples
        );


    const pixels: Point2D[] = [];


    for (
        let i = 0;
        i <
        sampled.length - 1;
        i++
    ) {

        const segment =
            rasterizeLineBresenham(
                sampled[i],
                sampled[i + 1]
            );


        if (pixels.length > 0) {
            segment.shift();
        }


        pixels.push(
            ...segment
        );
    }


    return cleanDigitalPath(
        pixels,
        false
    );
}