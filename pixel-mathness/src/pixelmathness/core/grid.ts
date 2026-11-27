// =========================
// GRID PRIMITIVES
// =========================
// Todo el análisis nuevo trabaja con índices lineales (y * width + x)
// sobre arrays tipados. Nada de strings "x,y" ni queue.shift() O(n).

/**
 * Cola FIFO de enteros con capacidad fija.
 *
 * Mientras cada píxel se marque como visitado ANTES de hacer push,
 * `width * height` es capacidad suficiente para un BFS completo.
 *
 * `data[0..tail)` conserva el orden de visita, así que al terminar un
 * flood fill se puede copiar directamente como lista de píxeles.
 */
export class IntQueue {

    readonly data: Int32Array;

    head = 0;
    tail = 0;

    constructor(capacity: number) {
        this.data = new Int32Array(Math.max(1, capacity));
    }

    clear(): void {
        this.head = 0;
        this.tail = 0;
    }

    push(value: number): void {
        this.data[this.tail++] = value;
    }

    shift(): number {
        return this.data[this.head++];
    }

    get length(): number {
        return this.tail - this.head;
    }
}
