import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Brush, Eraser, Undo2, Sparkles, Check, X } from "lucide-react";
import { toast } from "sonner";

interface BlurBrushEditorProps {
  file: File | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => void;
  /** Permitir continuar sin desenfocar nada */
  allowSkip?: boolean;
}

const MAX_SIDE = 2000;

/**
 * Editor de "Pincel de Privacidad": permite a la creadora pintar zonas
 * sobre la foto que serán desenfocadas (Gaussian blur) de forma permanente
 * antes de subir el archivo al Storage. No agrega stickers ni parches:
 * solo difumina la piel manteniendo la estética.
 */
export function BlurBrushEditor({
  file,
  open,
  onCancel,
  onConfirm,
  allowSkip = true,
}: BlurBrushEditorProps) {
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [brushSize, setBrushSize] = useState<number>(60);
  const [blurAmount, setBlurAmount] = useState<number>(28);
  const [mode, setMode] = useState<"paint" | "erase">("paint");
  const [history, setHistory] = useState<ImageData[]>([]);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [processing, setProcessing] = useState(false);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  // Cargar la imagen al canvas base
  useEffect(() => {
    if (!file || !open) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const longest = Math.max(w, h);
      if (longest > MAX_SIDE) {
        const r = MAX_SIDE / longest;
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      const base = document.createElement("canvas");
      base.width = w;
      base.height = h;
      base.getContext("2d")!.drawImage(img, 0, 0, w, h);
      baseCanvasRef.current = base;

      const mask = document.createElement("canvas");
      mask.width = w;
      mask.height = h;
      maskCanvasRef.current = mask;

      setImgSize({ w, h });
      setHistory([]);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [file, open]);

  // Redibujar preview al cambiar máscara, blur o tamaño
  useEffect(() => {
    if (!imgSize) return;
    drawPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSize, blurAmount]);

  // Ajustar escala al contenedor
  useEffect(() => {
    if (!imgSize || !containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const maxH = Math.min(window.innerHeight * 0.6, 600);
    const s = Math.min(cw / imgSize.w, maxH / imgSize.h, 1);
    setScale(s);
  }, [imgSize]);

  const drawPreview = () => {
    const display = displayRef.current;
    const base = baseCanvasRef.current;
    const mask = maskCanvasRef.current;
    if (!display || !base || !mask || !imgSize) return;
    display.width = imgSize.w;
    display.height = imgSize.h;
    const ctx = display.getContext("2d")!;
    ctx.clearRect(0, 0, imgSize.w, imgSize.h);
    ctx.drawImage(base, 0, 0);

    // Generar capa blureada limitada por la máscara
    const blurred = document.createElement("canvas");
    blurred.width = imgSize.w;
    blurred.height = imgSize.h;
    const bctx = blurred.getContext("2d")!;
    bctx.filter = `blur(${blurAmount}px)`;
    bctx.drawImage(base, 0, 0);
    bctx.filter = "none";
    bctx.globalCompositeOperation = "destination-in";
    bctx.drawImage(mask, 0, 0);

    ctx.drawImage(blurred, 0, 0);

    // Indicador suave del área pintada (solo en preview)
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#a855f7";
    const tmp = document.createElement("canvas");
    tmp.width = imgSize.w;
    tmp.height = imgSize.h;
    const tctx = tmp.getContext("2d")!;
    tctx.drawImage(mask, 0, 0);
    tctx.globalCompositeOperation = "source-in";
    tctx.fillStyle = "#a855f7";
    tctx.fillRect(0, 0, imgSize.w, imgSize.h);
    ctx.drawImage(tmp, 0, 0);
    ctx.restore();
  };

  const pushHistory = () => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext("2d")!;
    setHistory((h) => {
      const snap = ctx.getImageData(0, 0, mask.width, mask.height);
      const next = [...h, snap];
      if (next.length > 20) next.shift();
      return next;
    });
  };

  const undo = () => {
    const mask = maskCanvasRef.current;
    if (!mask || history.length === 0) return;
    const ctx = mask.getContext("2d")!;
    const last = history[history.length - 1];
    ctx.putImageData(last, 0, 0);
    setHistory((h) => h.slice(0, -1));
    drawPreview();
  };

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: x * (imgSize?.w ?? 0), y: y * (imgSize?.h ?? 0) };
  };

  const stroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext("2d")!;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = mode === "paint" ? "source-over" : "destination-out";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    pushHistory();
    drawing.current = true;
    const p = getPos(e);
    last.current = p;
    stroke(p, p);
    drawPreview();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const p = getPos(e);
    if (last.current) stroke(last.current, p);
    last.current = p;
    drawPreview();
  };

  const onPointerUp = () => {
    drawing.current = false;
    last.current = null;
  };

  const apply = async () => {
    const base = baseCanvasRef.current;
    const mask = maskCanvasRef.current;
    if (!base || !mask || !file || !imgSize) return;
    setProcessing(true);
    try {
      const out = document.createElement("canvas");
      out.width = imgSize.w;
      out.height = imgSize.h;
      const ctx = out.getContext("2d")!;
      ctx.drawImage(base, 0, 0);

      const blurred = document.createElement("canvas");
      blurred.width = imgSize.w;
      blurred.height = imgSize.h;
      const bctx = blurred.getContext("2d")!;
      bctx.filter = `blur(${blurAmount}px)`;
      bctx.drawImage(base, 0, 0);
      bctx.filter = "none";
      bctx.globalCompositeOperation = "destination-in";
      bctx.drawImage(mask, 0, 0);

      ctx.drawImage(blurred, 0, 0);

      const blob: Blob = await new Promise((resolve, reject) =>
        out.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.9),
      );
      const baseName = file.name.replace(/\.[^.]+$/, "");
      const newFile = new File([blob], `${baseName}-blur.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      onConfirm(newFile);
    } catch (err: any) {
      toast.error(err?.message ?? "No pudimos aplicar el desenfoque");
    } finally {
      setProcessing(false);
    }
  };

  const skip = () => {
    if (!file) return;
    onConfirm(file);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Pincel de Privacidad
          </DialogTitle>
          <DialogDescription>
            Pinta sobre la zona que quieras desenfocar. El desenfoque se aplica de
            forma permanente antes de subir la foto.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "paint" ? "default" : "outline"}
            onClick={() => setMode("paint")}
            className="gap-1"
          >
            <Brush className="h-4 w-4" /> Pincel
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "erase" ? "default" : "outline"}
            onClick={() => setMode("erase")}
            className="gap-1"
          >
            <Eraser className="h-4 w-4" /> Borrar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={undo}
            disabled={history.length === 0}
            className="gap-1"
          >
            <Undo2 className="h-4 w-4" /> Deshacer
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Tamaño del pincel: {brushSize}px
            </Label>
            <Slider
              min={10}
              max={200}
              step={2}
              value={[brushSize]}
              onValueChange={(v) => setBrushSize(v[0])}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Intensidad del desenfoque: {blurAmount}px
            </Label>
            <Slider
              min={8}
              max={60}
              step={1}
              value={[blurAmount]}
              onValueChange={(v) => setBlurAmount(v[0])}
            />
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative w-full bg-black/40 rounded-xl overflow-hidden flex items-center justify-center"
          style={{ minHeight: 200 }}
        >
          {imgSize && (
            <canvas
              ref={displayRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{
                width: imgSize.w * scale,
                height: imgSize.h * scale,
                touchAction: "none",
                cursor: "crosshair",
                display: "block",
              }}
            />
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={processing} className="gap-1">
            <X className="h-4 w-4" /> Cancelar
          </Button>
          {allowSkip && (
            <Button variant="ghost" onClick={skip} disabled={processing}>
              Subir sin desenfocar
            </Button>
          )}
          <Button onClick={apply} disabled={processing} className="gap-1">
            <Check className="h-4 w-4" />
            {processing ? "Procesando…" : "Aplicar y continuar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
