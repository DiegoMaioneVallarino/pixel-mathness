import type {
    BinaryMask
} from "./matrixToMask";

export type DistanceField =
    number[][];

const NEIGHBORS_8 = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1]
] as const;


function distanceToOpposite(
    mask: BinaryMask,
    startX: number,
    startY: number
): number {

    const height =
        mask.length;

    const width =
        mask[0].length;

    const startValue =
        mask[startY][startX];

    const visited =
        Array.from(
            { length: height },
            () =>
                Array(width).fill(false)
        );

    const queue = [
        {
            x: startX,
            y: startY,
            distance: 0
        }
    ];

    visited[startY][startX] =
        true;


    while (queue.length > 0) {

        const current =
            queue.shift()!;

        for (
            const [dx, dy]
            of NEIGHBORS_8
        ) {

            const nx =
                current.x + dx;

            const ny =
                current.y + dy;

            if (
                nx < 0 ||
                ny < 0 ||
                nx >= width ||
                ny >= height
            ) {
                continue;
            }

            if (
                mask[ny][nx] !==
                startValue
            ) {
                return (
                    current.distance +
                    1
                );
            }

            if (
                visited[ny][nx]
            ) {
                continue;
            }

            visited[ny][nx] =
                true;

            queue.push({
                x: nx,
                y: ny,
                distance:
                    current.distance +
                    1
            });
        }
    }

    return Math.max(
        width,
        height
    );
}


export function createSignedDistanceField(
    mask: BinaryMask
): DistanceField {

    return mask.map(
        (row, y) =>
            row.map(
                (inside, x) => {

                    const distance =
                        distanceToOpposite(
                            mask,
                            x,
                            y
                        );

                    return inside
                        ? -distance
                        : distance;
                }
            )
    );
}