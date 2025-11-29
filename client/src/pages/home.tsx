import { useState } from "react";
import { MOCK_GROUPS, DuplicateGroup } from "@/lib/mock-data";
import { ComparisonView } from "@/components/comparison-view";
import { SimilarityControls } from "@/components/similarity-controls";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [groups, setGroups] = useState<DuplicateGroup[]>(MOCK_GROUPS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [threshold, setThreshold] = useState(90);
  const { toast } = useToast();

  const currentGroup = groups[currentIndex];

  // Filter groups based on threshold logic (mock implementation)
  // Real app would filter the list. Here we just use the threshold for the "Delete Low Similarity" action

  const handleToggleMark = (imageId: string) => {
    setGroups(prevGroups => {
      return prevGroups.map(group => {
        if (group.id === currentGroup.id) {
          return {
            ...group,
            images: group.images.map(img => 
              img.id === imageId 
                ? { ...img, isMarkedForDeletion: !img.isMarkedForDeletion } 
                : img
            ) as [any, any]
          };
        }
        return group;
      });
    });
  };

  const nextGroup = () => {
    if (currentIndex < groups.length - 1) setCurrentIndex(c => c + 1);
  };

  const prevGroup = () => {
    if (currentIndex > 0) setCurrentIndex(c => c - 1);
  };

  const handleDeleteExact = () => {
    toast({
      title: "Processing Deletion",
      description: "Removing all exact duplicates (100% match)...",
    });
    // Mock logic
    setTimeout(() => {
        toast({
            title: "Cleanup Complete",
            description: "Removed 1 exact duplicate file.",
        });
    }, 1000);
  };

  const handleDeleteLowSimilarity = () => {
    toast({
      title: "Filtering Images",
      description: `Marking images with similarity < ${threshold}% for review...`,
    });
  };

  const handleSave = () => {
    const markedCount = currentGroup.images.filter(i => i.isMarkedForDeletion).length;
    if (markedCount === 0) {
        toast({
            title: "No Action Taken",
            description: "Please mark at least one image to delete.",
            variant: "destructive"
        });
        return;
    }
    
    toast({
        title: "Changes Applied",
        description: `Deleted ${markedCount} image(s) from this group.`,
    });
    // Simulate moving to next
    if (currentIndex < groups.length - 1) {
        setTimeout(nextGroup, 500);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-foreground">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
               </svg>
            </div>
            <h1 className="font-display font-bold text-xl tracking-tight">ImageDiff Pro</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground font-mono">
              Group {currentIndex + 1} of {groups.length}
            </div>
            <div className="flex items-center border rounded-md bg-background">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={prevGroup} 
                disabled={currentIndex === 0}
                className="rounded-r-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="w-px h-4 bg-border"></div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={nextGroup} 
                disabled={currentIndex === groups.length - 1}
                className="rounded-l-none"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Button onClick={handleSave} className="gap-2 shadow-lg shadow-primary/20">
                <Save className="h-4 w-4" />
                Apply Changes
            </Button>
          </div>
        </header>

        {/* Comparison Stage */}
        <main className="flex-1 p-6 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentGroup.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                >
                    <ComparisonView 
                        group={currentGroup} 
                        onToggleMark={handleToggleMark} 
                    />
                </motion.div>
            </AnimatePresence>
        </main>
      </div>

      {/* Sidebar Controls */}
      <SimilarityControls 
        threshold={threshold}
        setThreshold={setThreshold}
        onDeleteExact={handleDeleteExact}
        onDeleteLowSimilarity={handleDeleteLowSimilarity}
      />
    </div>
  );
}
