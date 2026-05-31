import { useEffect, useRef, useState } from "react";
import { X, Eraser, Trash2, Send } from "lucide-react";

const PRESET_COLORS = [
  "#ffffff","#000000","#9ca3af","#ef4444","#f97316","#f59e0b","#eab308",
  "#84cc16","#22c55e","#10b981","#14b8a6","#06b6d4","#0ea5e9","#3b82f6",
  "#6366f1","#8b5cf6","#a855f7","#d946ef","#ec4899","#f43f5e","#fb7185",
  "#fda4af","#fdba74","#fde68a","#bef264","#86efac","#67e8f9","#93c5fd",
  "#c4b5fd","#f0abfc","#fbcfe8","#fecaca","#fed7aa","#fef08a","#d9f99d",
  "#bbf7d0","#a7f3d0","#bae6fd","#ddd6fe","#fae8ff","#ffe4e6","#7c2d12",
  "#9a3412","#a16207","#365314","#064e3b","#155e75","#1e3a8a","#3730a3",
  "#581c87","#831843",
];

export function DrawingCanvas({ onSend, onClose }: { onSend: (dataUrl: string) => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState("#ff8c50");
  const [size, setSize] = useState(4);
  const [erase, setErase] = useState(false);

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#0a0910";
    ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * e.currentTarget.width,
      y: ((e.clientY - r.top) / r.height) * e.currentTarget.height,
    };
  }
  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    last.current = pos(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.strokeStyle = erase ? "#0a0910" : color;
    ctx.lineWidth = erase ? size * 4 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  }
  function up() { drawing.current = false; last.current = null; }

  function clear() {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#0a0910";
    ctx.fillRect(0, 0, c.width, c.height);
  }
  async function send() {
    const url = canvasRef.current!.toDataURL("image/png");
    onSend(url);
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/85 p-3 backdrop-blur-md sm:p-6">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between pb-3 text-white">
        <div className="text-sm font-bold">🎨 Draw</div>
        <button onClick={onClose} className="rounded-md p-1.5 hover:bg-white/10"><X className="h-4 w-4" /></button>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="mx-auto w-full max-w-3xl flex-1 touch-none rounded-xl border border-white/10 bg-[#0a0910]"
        style={{ aspectRatio: "8/5" }}
      />
      <div className="mx-auto mt-3 w-full max-w-3xl space-y-3">
        <div className="flex flex-wrap gap-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setErase(false); }}
              className={`h-6 w-6 rounded ${color === c && !erase ? "ring-2 ring-white" : ""}`}
              style={{ background: c }}
              title={c}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => { setColor(e.target.value); setErase(false); }}
            className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <input type="range" min={1} max={24} value={size} onChange={(e) => setSize(+e.target.value)} className="flex-1" />
          <span className="w-8 text-xs tabular-nums text-white/60">{size}px</span>
          <button onClick={() => setErase((v) => !v)} className={`rounded-md px-3 py-1.5 text-xs ${erase ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/15"}`}>
            <Eraser className="inline h-3.5 w-3.5" /> Erase
          </button>
          <button onClick={clear} className="rounded-md bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15">
            <Trash2 className="inline h-3.5 w-3.5" /> Clear
          </button>
          <button onClick={send} className="rounded-md bg-[rgb(var(--polaris-accent))] px-4 py-1.5 text-xs font-bold text-black">
            <Send className="inline h-3.5 w-3.5" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}