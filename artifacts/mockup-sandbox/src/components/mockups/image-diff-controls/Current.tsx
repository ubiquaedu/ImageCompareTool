import { useState } from "react";
import "./_group.css";
import { Image as ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export function Current() {
  const selectedPreview = {
    src: "/__mockup/images/imagediff-portrait-sample.svg",
    name: "portrait-sample.jpg",
    resolution: "3000x4500",
    size: "5.82 MB",
  };
  const [showResolution, setShowResolution] = useState(true);
  const [showFileSize, setShowFileSize] = useState(true);
  const [previewOrientation, setPreviewOrientation] = useState<{
    src: string;
    isPortrait: boolean;
  } | null>(null);
  const isPortraitPreview =
    previewOrientation?.src === selectedPreview.src &&
    previewOrientation.isPortrait;

  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto flex min-h-[680px] w-full max-w-[480px] flex-col gap-6 border-l bg-sidebar/50 p-6">
        <section className="space-y-3" aria-label="Selected image preview">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <ImageIcon className="h-5 w-5 text-primary" />
              Preview
            </h2>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Selected</span>
          </div>
          <div
            className={`relative w-full overflow-hidden rounded-lg border bg-black/5 ${
              isPortraitPreview ? "min-h-[300px]" : "aspect-[4/3]"
            }`}
            style={isPortraitPreview ? { height: "min(48vh, 480px)" } : undefined}
          >
            <img
              src={selectedPreview.src}
              alt={selectedPreview.name}
              className="absolute inset-0 h-full w-full object-contain p-1"
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget;
                setPreviewOrientation({
                  src: selectedPreview.src,
                  isPortrait: naturalHeight > naturalWidth,
                });
              }}
            />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-medium">{selectedPreview.name}</p>
            {(showResolution || showFileSize) && (
              <p className="truncate text-xs text-muted-foreground">
                {showResolution && selectedPreview.resolution}
                {showResolution && showFileSize && " · "}
                {showFileSize && selectedPreview.size}
              </p>
            )}
          </div>
        </section>

        <Separator />

        <div className="space-y-4">
          <Label>Display Options</Label>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-resolution" className="text-sm font-normal text-muted-foreground">
              Show Resolution
            </Label>
            <Switch
              id="show-resolution"
              checked={showResolution}
              onCheckedChange={setShowResolution}
              aria-label="Show Resolution"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-file-size" className="text-sm font-normal text-muted-foreground">
              Show File Size
            </Label>
            <Switch
              id="show-file-size"
              checked={showFileSize}
              onCheckedChange={setShowFileSize}
              aria-label="Show File Size"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
