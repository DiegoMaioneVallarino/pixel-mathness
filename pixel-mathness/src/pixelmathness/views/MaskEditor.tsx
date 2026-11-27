import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { PixelMatrix } from "../types/PixelMatrix";
import { matrixToCanvas } from "../image/matrixToCanvas";
import { instanceLabels } from "../benchmark/score";

type Props = { matrix: PixelMatrix; rows: string[]; onChange: (rows: string[]) => void };

export function MaskEditor({matrix,rows,onChange}: Props) {
    const canvas = useRef<HTMLCanvasElement>(null);
    const [label,setLabel] = useState("1");
    const last = useRef<[number,number] | null>(null);
    const current = useRef(rows);
    current.current = rows;
    const width = matrix[0].length;
    const height = matrix.length;
    useEffect(() => {
        const c = canvas.current;
        if (!c) return;
        matrixToCanvas(matrix,c);
        const ctx = c.getContext("2d")!;
        rows.forEach((row,y)=>Array.from(row).forEach((id,x)=>{
            if (id === ".") return;
            ctx.fillStyle = id === "?" ? "rgba(128,128,128,.75)" : "hsla(" + (137 * instanceLabels.indexOf(id) % 360) + ",90%,60%,.65)";
            ctx.fillRect(x,y,1,1);
        }));
    },[matrix,rows]);
    function paint(e: PointerEvent<HTMLCanvasElement>) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.floor((e.clientX-rect.left)*width/rect.width);
        const y = Math.floor((e.clientY-rect.top)*height/rect.height);
        if (x<0 || x>=width || y<0 || y>=height) { last.current = null; return; }
        const [x0,y0] = last.current ?? [x,y];
        const steps = Math.max(1,Math.abs(x-x0),Math.abs(y-y0));
        const next = current.current.slice();
        for (let i=0;i<=steps;i++) {
            const px=Math.round(x0+(x-x0)*i/steps), py=Math.round(y0+(y-y0)*i/steps);
            const row=next[py];
            next[py]=row.slice(0,px)+label+row.slice(px+1);
        }
        current.current=next;
        last.current=[x,y];
        onChange(next);
    }
    return <div className="bench-editor">
        <label>Pincel <select value={label} onChange={e=>setLabel(e.target.value)}>
            {Array.from(instanceLabels,id=><option key={id} value={id}>Pieza {id}</option>)}
            <option value=".">Borrar</option><option value="?">Zona sin evaluar</option>
        </select></label>
        <canvas ref={canvas} aria-label="Pintar máscara de referencia" style={{width:width*Math.max(1,Math.min(16,Math.floor(550/width)))}}
            onPointerDown={e=>{ if(e.button!==0)return; last.current=null; e.currentTarget.setPointerCapture(e.pointerId); paint(e); }}
            onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId)) paint(e);}}
            onLostPointerCapture={()=>{last.current=null;}}/>
    </div>;
}
