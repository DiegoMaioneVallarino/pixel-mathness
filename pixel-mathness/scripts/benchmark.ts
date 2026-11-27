import { corpus } from "../src/pixelmathness/benchmark/corpus";
import { runSample, reportInfo } from "../src/pixelmathness/benchmark/run";

console.log(JSON.stringify({ ...reportInfo, cases: corpus.map(runSample) }, null, 2));
