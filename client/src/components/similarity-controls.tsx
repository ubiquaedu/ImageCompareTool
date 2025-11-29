import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  Filter, 
  RefreshCcw, 
  Image as ImageIcon,
  Settings2
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
  return (
    <div className="w-80 border-l bg-sidebar/50 backdrop-blur-xl p-6 flex flex-col gap-8 h-full">
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

      <div className="mt-auto">
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
