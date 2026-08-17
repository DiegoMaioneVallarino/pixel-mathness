import { useEffect, useRef } from "react";

import type { PixelMatrix } from "../pixelmathness";
import { matrixToCanvas } from "../pixelmathness";

type Props = {
    matrix: PixelMatrix;
};

export function MatrixCanvas({ matrix }: Props) {

    const canvasRef =
        useRef<HTMLCanvasElement>(null);

    useEffect(() => {

        if (!canvasRef.current) return;

        matrixToCanvas(
            matrix,
            canvasRef.current
        );

    }, [matrix]);

    return <canvas ref={canvasRef} />;
}