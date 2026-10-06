import { DuplicateGroup, ImageFile } from "@/lib/mock-data";
import { Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface ComparisonViewProps {
  group: DuplicateGroup;
  onToggleMark: (imageId: string) => void;
  onToggleMarkAll?: (markAll: boolean) => void;
  selectedPreviewId?: string | null;
  onSelectPreview?: (image: ImageFile) => void;
  showResolution: boolean;
  showFileSize: boolean;
}

export function ComparisonView({
  group,
  onToggleMark,
  onToggleMarkAll,
  selectedPreviewId,
  onSelectPreview,
  showResolution,
  showFileSize,
}: ComparisonViewProps) {
  const allMarked = group.images.every(img => img.isMarkedForDeletion);
  
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <Badge 
            variant={group.similarity === 100 ? "destructive" : "secondary"}
            className={cn(
              "text-sm px-3 py-1", 
              group.similarity === 100 && "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20",
              group.similarity < 90 && "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20",
              group.similarity >= 90 && group.similarity < 100 && "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
            )}
          >
            {group.similarity}% Match
          </Badge>
          <span className="text-muted-foreground text-sm font-mono">Group ID: {group.id}</span>
        </div>
        <div className="flex gap-2">
            {onToggleMarkAll && (
              <Button 
                variant={allMarked ? "default" : "outline"} 
                size="sm" 
                className="gap-2"
                onClick={() => onToggleMarkAll(!allMarked)}
              >
                <Check className="h-4 w-4" />
                {allMarked ? "Keep All" : "Mark All"}
              </Button>
            )}
        </div>
      </div>

      <div 
        className="grid gap-4" 
        style={{ 
          gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 350px), 1fr))` 
        }}
      >
        {group.images.map((img) => (
          <ImageCard 
            key={img.id} 
            image={img} 
            isMarked={img.isMarkedForDeletion} 
            onToggle={() => onToggleMark(img.id)} 
            isSelected={img.id === selectedPreviewId}
            onSelect={() => onSelectPreview?.(img)}
            showResolution={showResolution}
            showFileSize={showFileSize}
          />
        ))}
      </div>
    </div>
  );
}

function ImageCard({ 
  image, 
  isMarked, 
  onToggle,
  isSelected,
  onSelect,
  showResolution,
  showFileSize,
}: { 
  image: ImageFile; 
  isMarked?: boolean; 
  onToggle: () => void; 
  isSelected?: boolean;
  onSelect: () => void;
  showResolution: boolean;
  showFileSize: boolean;
}) {
  // Extract file extension to display prominently
  const getExtension = (filename: string) => {
    const parts = filename.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toUpperCase();
    }
    return 'FILE';
  };
  
  const ext = getExtension(image.name);

  return (
    <div 
      className={cn(
        "relative group flex flex-col rounded-xl border bg-card overflow-hidden transition-all duration-300 min-h-[220px]",
        isSelected && "border-primary ring-2 ring-primary/20",
        isMarked ? "border-destructive/50 ring-1 ring-destructive/20 opacity-60" : "border-border hover:border-primary/50"
      )}
    >
      {/* Image Container */}
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Show ${image.name} in the side preview`}
        aria-pressed={isSelected}
        className="relative block h-[175px] w-full bg-black/5 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <img
          src={image.src}
          alt={image.name}
          className="absolute inset-0 w-full h-full object-contain p-2"
        />
        {isSelected && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground shadow">
            Preview
          </span>
        )}
      </button>

      {/* Details Footer */}
      <div className="p-3 bg-card border-t flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm truncate" title={image.name}>{image.name}</h3>
            {(showResolution || showFileSize) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {showResolution && <span>{image.resolution}</span>}
                {showResolution && showFileSize && <span>•</span>}
                {showFileSize && <span>{image.size}</span>}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="font-mono bg-muted/30">
              {ext}
            </Badge>
            <Button
              variant={isMarked ? "secondary" : "outline"}
              size="sm"
              className={cn(
                "transition-all",
                isMarked ? "bg-muted text-foreground hover:bg-muted/80" : "hover:border-destructive hover:text-destructive text-destructive border-destructive/20"
              )}
              onClick={onToggle}
            >
              {isMarked ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Keep
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
          {image.date}
        </div>
      </div>

      {/* Status Indicator Overlay */}
      {isMarked && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-background/20 backdrop-blur-[1px]">
          <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full font-medium shadow-lg animate-in zoom-in-95 duration-200">
            Marked for Deletion
          </div>
        </div>
      )}
    </div>
  );
}
