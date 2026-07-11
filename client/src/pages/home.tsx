import { useState, useEffect } from "react";
import { MOCK_GROUPS, DuplicateGroup, ImageFile } from "@/lib/mock-data";
import { ComparisonView } from "@/components/comparison-view";
import { SimilarityControls } from "@/components/similarity-controls";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

import { computeImageHash, calculateSimilarity } from "@/lib/image-processing";

export default function Home() {
  const [allGroups, setAllGroups] = useState<DuplicateGroup[]>(MOCK_GROUPS);
  const [isRealData, setIsRealData] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [threshold, setThreshold] = useState(90);
  const { toast } = useToast();

  // Filter groups based on threshold
  const groups = allGroups.filter(g => g.similarity >= threshold);
  
  // If current index is out of bounds after filtering, reset it
  if (currentIndex >= groups.length && groups.length > 0) {
      setCurrentIndex(0);
  }
  
  const currentGroup = groups[currentIndex];

  // Cleanup object URLs when component unmounts or data changes
  useEffect(() => {
    return () => {
      if (isRealData) {
        allGroups.forEach(group => {
          group.images.forEach(img => {
            if (img.src.startsWith('blob:')) {
              URL.revokeObjectURL(img.src);
            }
          });
        });
      }
    };
  }, [allGroups, isRealData]);

  const handleFilesSelected = async (fileList: FileList) => {
    toast({
      title: "Processing Files",
      description: `Analyzing ${fileList.length} files locally...`,
    });

    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    
    if (files.length < 2) {
      toast({
        title: "Not Enough Images",
        description: "Please select a folder with at least 2 images.",
        variant: "destructive"
      });
      return;
    }

    try {
      // 1. Compute hashes for all images
      const hashedImages = await Promise.all(files.map(async (file) => {
        try {
          const hash = await computeImageHash(file);
          return { file, hash };
        } catch (e) {
          console.error("Failed to hash image:", file.name);
          return null;
        }
      }));

      const validImages = hashedImages.filter(item => item !== null) as { file: File, hash: string }[];
      
      // 2. Compare all pairs (O(n^2) - simple implementation for demo)
      const newGroups: DuplicateGroup[] = [];
      const usedIndices = new Set<number>();

      for (let i = 0; i < validImages.length; i++) {
        if (usedIndices.has(i)) continue;

        let bestMatchIndex = -1;
        let bestSimilarity = 0;

        for (let j = i + 1; j < validImages.length; j++) {
          if (usedIndices.has(j)) continue;

          const similarity = calculateSimilarity(validImages[i].hash, validImages[j].hash);
          
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestMatchIndex = j;
          }
        }

        // Only group if similarity is reasonable (e.g. > 60%) to avoid random pairing
        if (bestMatchIndex !== -1 && bestSimilarity >= 60) {
           usedIndices.add(i);
           usedIndices.add(bestMatchIndex);

           const file1 = validImages[i].file;
           const file2 = validImages[bestMatchIndex].file;

           newGroups.push({
            id: `group-${i}-${bestMatchIndex}`,
            similarity: bestSimilarity,
            images: [
              {
                id: `img-${i}`,
                src: URL.createObjectURL(file1),
                name: file1.name,
                size: `${(file1.size / 1024 / 1024).toFixed(2)} MB`,
                resolution: "Unknown",
                date: new Date(file1.lastModified).toLocaleString(),
              },
              {
                id: `img-${bestMatchIndex}`,
                src: URL.createObjectURL(file2),
                name: file2.name,
                size: `${(file2.size / 1024 / 1024).toFixed(2)} MB`,
                resolution: "Unknown",
                date: new Date(file2.lastModified).toLocaleString(),
              }
            ]
           });
        }
      }

      // Add remaining images as singles? No, this is a diff tool, only show pairs.
      
      if (newGroups.length > 0) {
        // Sort by similarity (descending)
        newGroups.sort((a, b) => b.similarity - a.similarity);
        
        setAllGroups(newGroups);
        setIsRealData(true);
        setCurrentIndex(0);
        toast({
          title: "Analysis Complete",
          description: `Found ${newGroups.length} similar pairs using perceptual hashing.`,
        });
      } else {
        toast({
          title: "No Similar Images",
          description: "No significant similarities found in the selected folder.",
          variant: "default"
        });
      }

    } catch (error) {
      console.error("Analysis failed", error);
      toast({
        title: "Error",
        description: "Failed to analyze images.",
        variant: "destructive"
      });
    }
  };

  const handleToggleMark = (imageId: string) => {
    setAllGroups(prevGroups => {
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
    // Explanation for the user: Browsers cannot delete files from disk
    toast({
      title: "Browser Limitation",
      description: "Web apps cannot delete files from your hard drive directly due to security sandboxing.",
      variant: "destructive"
    });
    
    // In a real desktop app (Electron/Tauri), we would call:
    // await window.api.deleteFiles(exactDuplicates);
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

  const handleRescan = () => {
    toast({
        title: "Updating View",
        description: `Showing ${groups.length} groups with similarity >= ${threshold}%`,
    });
  };

  const scanSummary = {
    groupsFound: groups.length,
    wastedSpaceMB: groups.reduce((acc, group) => {
      // Calculate wasted space: sum of all images in group minus the largest one (assuming keeping one)
      if (group.images.length <= 1) return acc;
      
      const sizes = group.images.map(img => {
        const sizeStr = img.size.replace(' MB', '');
        return parseFloat(sizeStr) || 0;
      });
      
      const totalSize = sizes.reduce((sum, size) => sum + size, 0);
      const maxSize = Math.max(...sizes);
      
      return acc + (totalSize - maxSize);
    }, 0),
    duplicatesCount: groups.reduce((acc, group) => acc + Math.max(0, group.images.length - 1), 0)
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
                {currentGroup ? (
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
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <p className="text-lg font-medium">No matches found</p>
                        <p className="text-sm">Try lowering the similarity threshold</p>
                    </div>
                )}
            </AnimatePresence>
        </main>
      </div>

      {/* Sidebar Controls */}
      <SimilarityControls 
        threshold={threshold}
        setThreshold={setThreshold}
        onDeleteExact={handleDeleteExact}
        onDeleteLowSimilarity={handleDeleteLowSimilarity}
        onRescan={handleRescan}
        onFilesSelected={handleFilesSelected}
        scanSummary={scanSummary}
      />
    </div>
  );
}
