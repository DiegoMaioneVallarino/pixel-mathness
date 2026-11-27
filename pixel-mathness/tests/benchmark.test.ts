import { test } from "node:test";
import assert from "node:assert/strict";
import { corpus } from "../src/pixelmathness/benchmark/corpus";
import { runSample } from "../src/pixelmathness/benchmark/run";
import { score, validateReference } from "../src/pixelmathness/benchmark/score";

test("la referencia permanece independiente del detector", () => {
    const expected = [
        [1,1,0],[1,0,0],[1,1,0],[1,1,0],[0,0,1],
        [1,0,0],[2,2,0],[2,0,1],[0,0,1],[3,2,0],[3,1,0],
    ];
    assert.deepEqual(corpus.map(sample => {
        const r = runSample(sample);
        return [r.expected,r.matches.length,r.extra.length];
    }), expected);
});

test("una fusión no cuenta dos veces", () => {
    const r = score(["12"], [[0,1]]);
    assert.equal(r.matches.length,1);
    assert.equal(r.matches[0].iou,0.5);
    assert.equal(r.missed.length,1);
    assert.deepEqual(r.merges,[0]);
});

test("dos fragmentos solo consiguen una pareja", () => {
    const r = score(["11"], [[0],[1]]);
    assert.equal(r.matches.length,1);
    assert.equal(r.extra.length,1);
    assert.deepEqual(r.fragments,["1"]);
});

test("los píxeles desconocidos se excluyen de la unión y los falsos positivos", () => {
    const r = score(["1??."], [[0,1],[2],[3]]);
    assert.equal(r.matches[0].iou,1);
    assert.deepEqual(r.extra,[2]);
});

test("rechaza referencias mal dimensionadas o con etiquetas inválidas", () => {
    for (const bad of [[], ["01"], ["1"], [14]]) {
        assert.throws(()=>validateReference(bad,2,1));
    }
});
