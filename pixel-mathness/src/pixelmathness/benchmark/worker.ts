import { runSample } from "./run";
import type { Sample } from "./corpus";

self.onmessage = ({data}: MessageEvent<Sample>) => {
    try { self.postMessage({ result: runSample(data) }); }
    catch (e) { self.postMessage({ error: String(e) }); }
};
