import type {
    Vector3
} from "./types";


export function subtract(
    a: Vector3,
    b: Vector3
): Vector3 {

    return {
        x: a.x - b.x,
        y: a.y - b.y,
        z: a.z - b.z
    };
}


export function length(
    v: Vector3
): number {

    return Math.sqrt(
        v.x * v.x +
        v.y * v.y +
        v.z * v.z
    );
}


export function normalize(
    v: Vector3
): Vector3 {

    const len =
        length(v);

    if (len === 0) {
        return {
            x: 0,
            y: 0,
            z: 0
        };
    }

    return {
        x: v.x / len,
        y: v.y / len,
        z: v.z / len
    };
}


export function dot(
    a: Vector3,
    b: Vector3
): number {

    return (
        a.x * b.x +
        a.y * b.y +
        a.z * b.z
    );
}