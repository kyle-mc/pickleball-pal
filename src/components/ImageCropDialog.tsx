import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Source image as a data URL or object URL */
  imageSrc: string | null;
  /** Output aspect ratio (width / height). Default 1 = square (avatar). */
  aspect?: number;
  /** Output dimensions in pixels (square unless aspect != 1) */
  outputSize?: number;
  /** Output mime type for the cropped blob */
  outputType?: string;
  /** Output quality 0-1 (jpeg/webp only) */
  outputQuality?: number;
  /** Called with the cropped image as a Blob */
  onCropComplete: (blob: Blob) => void | Promise<void>;
  title?: string;
  saving?: boolean;
}

/**
 * Convert a cropped region of the source image into a Blob using a canvas.
 */
async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  outputSize: number,
  outputType: string,
  outputQuality: number,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas is empty"))),
      outputType,
      outputQuality,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  aspect = 1,
  outputSize = 512,
  outputType = "image/jpeg",
  outputQuality = 0.92,
  onCropComplete,
  title = "Crop Image",
  saving = false,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixelArea, setPixelArea] = useState<Area | null>(null);

  const onCropAreaChange = useCallback((_: Area, areaPixels: Area) => {
    setPixelArea(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !pixelArea) return;
    const blob = await getCroppedBlob(imageSrc, pixelArea, outputSize, outputType, outputQuality);
    await onCropComplete(blob);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative w-full h-72 bg-muted rounded-lg overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                cropShape={aspect === 1 ? "round" : "rect"}
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropAreaChange}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Zoom</Label>
            <Slider
              value={[zoom]}
              min={1}
              max={4}
              step={0.05}
              onValueChange={(v) => setZoom(v[0])}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !pixelArea}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
