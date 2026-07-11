import { DuplicateGroup, ImageFile } from "@/lib/mock-data";
import { Check, Trash2, Maximize2, Info, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface ComparisonViewProps {
  group: DuplicateGroup;
  onToggleMark: (imageId: string) => void;
  onToggleMarkAll?: (markAll: boolean) => void;
}

export function ComparisonView({ group, onToggleMark, onToggleMarkAll }: ComparisonViewProps) {
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
            <Button variant="outline" size="icon" className="h-8 w-8"><ZoomIn className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8"><ZoomOut className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
        {group.images.map((img) => (
          <ImageCard 
            key={img.id} 
            image={img} 
            isMarked={img.isMarkedForDeletion} 
            onToggle={() => onToggleMark(img.id)} 
          />
        ))}
      </div>
    </div>
  );
}

function ImageCard({ 
  image, 
  isMarked, 
  onToggle 
}: { 
  image: ImageFile; 
  isMarked?: boolean; 
  onToggle: () => void; 
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
        "relative group flex flex-col rounded-xl border bg-card overflow-hidden transition-all duration-300 min-h-[300px]",
        isMarked ? "border-destructive/50 ring-1 ring-destructive/20 opacity-60" : "border-border hover:border-primary/50"
      )}
    >
      {/* Image Container */}
      <div className="relative flex-1 min-h-[200px] bg-black/5 overflow-hidden">
        <img 
          src={image.src} 
          alt={image.name} 
          className="absolute inset-0 w-full h-full object-contain p-2"
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4">
          <div className="flex justify-end">
             <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border-white/10">
                <Maximize2 className="h-4 w-4" />
             </Button>
          </div>
        </div>
      </div>

      {/* Details Footer */}
      <div className="p-4 bg-card border-t flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm truncate" title={image.name}>{image.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>{image.resolution}</span>
              <span>•</span>
              <span>{image.size}</span>
            </div>
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
