import { useEffect, useRef, useState } from "react";
import { MaskEditor } from "./MaskEditor";
import { MatrixCanvas } from "../../components/MatrixCanvas";
import { imageToMatrix } from "../image/imageToMatrix";
import { loadImage } from "../image/loadImage";
import { corpus, type Sample } from "../benchmark/corpus";
import { reportInfo, runSample } from "../benchmark/run";
import { instanceLabels, validateReference } from "../benchmark/score";
import "./benchmark.css";

type Result = ReturnType<typeof runSample>;
function download(name: string, value: unknown) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function comparison(sample: Sample, result: Result) {
    const predicted = new Set(result.predictions.flat());
    return sample.matrix.map((row, y) => row.map((pixel, x) => {
        const label = sample.reference[y][x];
        if (label === "?") return {r:100,g:105,b:115,a:255};
        const found = predicted.has(y * row.length + x);
        if (found && label !== ".") return {r:48,g:210,b:160,a:255};
        if (found) return {r:240,g:96,b:128,a:255};
        if (label !== ".") return {r:250,g:190,b:67,a:255};
        return pixel;
    }));
}

function annotation(sample: Sample, result: Result) {
    return { schema: 1, image: sample.id, style: sample.style, split: sample.split,
        reference: sample.reference, detectorReport: { ...reportInfo, ...result } };
}

function ImportSample({onAdd}: {onAdd: (sample: Sample, result: Result) => void}) {
    const [draft, setDraft] = useState<Sample>();
    const ticket = useRef(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const worker = useRef<Worker | null>(null);
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => { alive.current = false; worker.current?.terminate(); };
    }, []);
    async function openPng(file?: File) {
        const request = ++ticket.current;
        setDraft(undefined);
        setError("");
        if (!file) return;
        try {
            const image = await loadImage(file);
            if (!alive.current || request !== ticket.current) return;
            const matrix = imageToMatrix(image);
            setDraft({ id:file.name, title:file.name, matrix, style:"personal", split:"development",
                reference:matrix.map(row=>".".repeat(row.length)) });
        } catch(e) { if (alive.current && request === ticket.current) setError(String(e)); }
    }
    async function openReference(file?: File) {
        if (!file || !draft) return;
        const request = ticket.current;
        try {
            const data = JSON.parse(await file.text());
            validateReference(data.reference,draft.matrix[0].length,draft.matrix.length);
            if (data.image !== draft.id || data.schema !== 1 || typeof data.style !== "string" ||
                !["development","holdout"].includes(data.split)) throw new Error("El archivo debe corresponder al PNG y declarar schema, style y split.");
            if (alive.current && request===ticket.current) {
                setDraft({...draft, reference:data.reference, style:data.style, split:data.split});
                setError("");
            }
        } catch(e) { if (alive.current && request===ticket.current) setError(String(e)); }
    }
    async function add() {
        if (!draft || busy) return;
        const sample = draft;
        setBusy(true);
        setError("");
        try {
            const w = new Worker(new URL("../benchmark/worker.ts", import.meta.url), {type:"module"});
            worker.current = w;
            const result = await new Promise<Result>((resolve,reject) => {
                w.onmessage = event => event.data.error ? reject(new Error(event.data.error)) : resolve(event.data.result);
                w.onerror = event => reject(new Error(event.message || "Falló el análisis."));
                w.postMessage(sample);
            });
            if (alive.current) onAdd(sample,result);
        } catch(e) {
            if (alive.current) setError(e instanceof Error ? e.message : String(e));
        } finally {
            worker.current?.terminate();
            worker.current = null;
            if (alive.current) setBusy(false);
        }
    }
    return <details><summary>Añadir PNG anotado</summary>
        <label>Sprite PNG <input type="file" accept="image/png" disabled={busy} onChange={e=>void openPng(e.target.files?.[0])}/></label>
        {draft && <fieldset disabled={busy}>
            <p>Pinta el interior visible de cada pieza con una etiqueta distinta. Puedes cargar una referencia previa para corregirla.</p>
            <label>Referencia JSON <input type="file" accept=".json" onChange={e=>void openReference(e.target.files?.[0])}/></label>
            <label>Estilo <input value={draft.style} onChange={e=>setDraft({...draft,style:e.target.value})}/></label>
            <label>Grupo <select value={draft.split} onChange={e=>setDraft({...draft,split:e.target.value as Sample["split"]})}>
                <option value="development">Desarrollo</option><option value="holdout">Reserva</option></select></label>
            <MaskEditor matrix={draft.matrix} rows={draft.reference} onChange={reference=>setDraft({...draft,reference})}/>
            <button onClick={add}>{busy ? "Analizando…" : "Evaluar sprite"}</button>
        </fieldset>}
        {error && <p role="alert">{error}</p>}
    </details>;
}

export function BenchmarkView() {
    const [entries,setEntries] = useState(() => corpus.map(sample => ({sample,result:runSample(sample)})));
    const [selected,setSelected] = useState(0);
    const {sample,result} = entries[selected];
    const [filter,setFilter] = useState("all");
    const visible = entries.filter(({sample}) => filter === "all" || sample.split === filter);
    const expected = visible.reduce((sum,x)=>sum+x.result.expected,0);
    const hits = visible.reduce((sum,x)=>sum+x.result.matches.length,0);
    const extra = visible.reduce((sum,x)=>sum+x.result.extra.length,0);
    function selectFilter(value: string) {
        setFilter(value);
        if (value !== "all" && sample.split !== value) setSelected(entries.findIndex(x=>x.sample.split===value));
    }
    return <section className="bench">
        <h2>Banco de formas</h2>
        <div className="bench-controls">
            <label>Conjunto <select value={filter} onChange={e=>selectFilter(e.target.value)}>
                <option value="all">Todos</option><option value="development">Desarrollo</option><option value="holdout">Reserva</option>
            </select></label>
            <button onClick={()=>download("pixelmathness-baseline.json",{...reportInfo,cases:visible.map(x=>x.result)})}>Exportar informe</button>
        </div>
        <p><strong>{hits} de {expected}</strong> interiores recuperados · {extra} detecciones sin pareja · IoU ≥ 0.50</p>
        <div className="bench-layout">
            <div className="bench-list">{visible.map(entry=><button key={entries.indexOf(entry)} aria-pressed={entry===entries[selected]} onClick={()=>setSelected(entries.indexOf(entry))}>
                {entry.sample.title} <span>{entry.result.matches.length}/{entry.result.expected}</span>
            </button>)}</div>
            <article><h3>{sample.title}</h3>
                <div className="bench-images">
                    <figure><MatrixCanvas matrix={sample.matrix}/><figcaption>Original</figcaption></figure>
                    <figure><MatrixCanvas matrix={comparison(sample,result)}/><figcaption>Comparación por píxel</figcaption></figure>
                </div>
                <p className="bench-key"><b>Verde</b> Coincide · <b>Ámbar</b> Falta · <b>Rosa</b> Sobra · Gris sin evaluar</p>
                <p>Omitidas {result.missed.join(", ") || "—"} · Fusiones {result.merges.length} · Fragmentaciones {result.fragments.length} · {result.elapsedMs.toFixed(2)} ms</p>
                <table><thead><tr><th>Cara</th><th>Instancias tocadas</th><th>IoU aceptada</th></tr></thead>
                    <tbody>{result.overlap.map(row=><tr key={row.prediction}><td>{row.prediction+1}</td><td>{row.links.map(edge=>edge.label).join(", ") || "—"}</td><td>{result.matches.find(m=>m.prediction===row.prediction)?.iou.toFixed(2) ?? "—"}</td></tr>)}</tbody></table>
                <button onClick={()=>download(sample.id+".json",annotation(sample,result))}>Exportar referencia</button>
            </article>
        </div>
        <ImportSample onAdd={(sample,result)=>{
            const index = entries.findIndex(entry=>entry.sample.id === sample.id);
            const next = entries.slice();
            const position = index < 0 ? next.length : index;
            next[position] = {sample,result};
            setEntries(next); setSelected(position); setFilter("all");
        }}/>
    </section>;
}
