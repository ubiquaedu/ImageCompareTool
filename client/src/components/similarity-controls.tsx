import { useState, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  Filter, 
  Image as ImageIcon,
  Settings2,
  FolderSearch,
  FolderOpen,
  Play
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SimilarityControlsProps {
  threshold: number;
  setThreshold: (val: number) => void;
  onDeleteExact: () => void;
  onDeleteLowSimilarity: () => void;
}

export function SimilarityControls({
  threshold,
  setThreshold,
  onDeleteExact,
  onDeleteLowSimilarity
}: SimilarityControlsProps) {
  const [selectedPath, setSelectedPath] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // In a real app, we'd get the path, but browsers obscure the real system path for security.
      // We can mock it or show the folder name relative to the upload.
      // For the mockup, let's pretend we got a full path or just show the folder name.
      // e.target.files[0].webkitRelativePath usually starts with the folder name.
      const folderName = e.target.files[0].webkitRelativePath.split('/')[0];
      setSelectedPath(`~/Pictures/${folderName}`);
    }
  };

  return (
    <div className="w-80 border-l bg-sidebar/50 backdrop-blur-xl p-6 flex flex-col gap-6 h-full overflow-y-auto">
      
      {/* Source Selection */}
      <div>
        <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-1">
          <FolderSearch className="h-5 w-5 text-primary" />
          Source
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Select folder to scan
        </p>

        <div className="space-y-3">
            <div className="flex flex-col gap-2">
                 <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFolderSelect}
                    className="hidden"
                    {...({ webkitdirectory: "", directory: "" } as any)}
                 />
                <Button 
                    variant={selectedPath ? "outline" : "secondary"}
                    className="w-full justify-start overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <FolderOpen className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">
                        {selectedPath ? "Change Folder" : "Select Folder..."}
                    </span>
                </Button>
            </div>
            {selectedPath && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <div className="text-xs font-mono text-muted-foreground break-all bg-muted/50 p-2 rounded border">
                        Target: {selectedPath}
                    </div>
                    <Button size="sm" className="w-full bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-transparent">
                        <Play className="h-3 w-3 mr-2" />
                        Rescan Directory
                    </Button>
                </div>
            )}
        </div>
      </div>

      <Separator />

      {/* Filters Header */}
      <div>
        <h2 className="font-display font-semibold text-lg flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          Filters
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Adjust comparison sensitivity
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Similarity Threshold</Label>
            <span className="font-mono text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
              {threshold}%
            </span>
          </div>
          <Slider
            value={[threshold]}
            onValueChange={(vals) => setThreshold(vals[0])}
            min={0}
            max={100}
            step={1}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono uppercase">
            <span>Loose</span>
            <span>Strict</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label>Quick Actions</Label>
          
          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
            onClick={onDeleteExact}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Exact Duplicates (100%)
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={onDeleteLowSimilarity}
          >
            <Filter className="h-4 w-4 mr-2" />
            Delete Matches &lt; {threshold}%
          </Button>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label>Display Options</Label>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Show Resolution</span>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Show File Size</span>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-medium">Scan Summary</div>
              <div className="text-xs text-muted-foreground">3 groups found</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
             <div className="bg-muted/50 p-2 rounded">
                <span className="block text-muted-foreground">Wasted Space</span>
                <span className="font-mono font-medium">24.5 MB</span>
             </div>
             <div className="bg-muted/50 p-2 rounded">
                <span className="block text-muted-foreground">Duplicates</span>
                <span className="font-mono font-medium">3 Files</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
