import { useState, useEffect } from "react";
import { MOCK_GROUPS, DuplicateGroup, ImageFile } from "@/lib/mock-data";
import { ComparisonView } from "@/components/comparison-view";
import { SimilarityControls } from "@/components/similarity-controls";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { computeImageHash, calculateSimilarity } from "@/lib/image-processing";

export default function Home() {
  const [allGroups, setAllGroups] = useState<DuplicateGroup[]>(MOCK_GROUPS);
  const [isRealData, setIsRealData] = useState(false);
  const [threshold, setThreshold] = useState(90);
  const { toast } = useToast();

  // Filter groups based on threshold
  const groups = allGroups.filter(g => g.similarity >= threshold);

  // Cleanup object URLs ONLY when component unmounts (not when allGroups changes!)
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
  }, []); // Empty dependency array prevents premature cleanup during state updates

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
                fileSizeBytes: file1.size,
                resolution: "Unknown",
                date: new Date(file1.lastModified).toLocaleString(),
                // file.path is exposed by Electron; undefined in a plain browser
                filePath: (file1 as any).path || undefined,
              },
              {
                id: `img-${bestMatchIndex}`,
                src: URL.createObjectURL(file2),
                name: file2.name,
                size: `${(file2.size / 1024 / 1024).toFixed(2)} MB`,
                fileSizeBytes: file2.size,
                resolution: "Unknown",
                date: new Date(file2.lastModified).toLocaleString(),
                filePath: (file2 as any).path || undefined,
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

  const handleToggleMark = (groupId: string, imageId: string) => {
    setAllGroups(prevGroups => {
      return prevGroups.map(group => {
        if (group.id === groupId) {
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

  const handleToggleMarkGroup = (groupId: string, markAll: boolean) => {
    setAllGroups(prevGroups => {
      return prevGroups.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            images: group.images.map(img => ({ ...img, isMarkedForDeletion: markAll })) as [any, any]
          };
        }
        return group;
      });
    });
  };

  const getFileSizeBytes = (image: ImageFile) => {
    if (typeof image.fileSizeBytes === "number") return image.fileSizeBytes;
    const sizeInMb = Number.parseFloat(image.size);
    return Number.isFinite(sizeInMb) ? sizeInMb * 1024 * 1024 : 0;
  };

  const markSmallerFiles = (eligibleGroups: DuplicateGroup[], label: string) => {
    if (eligibleGroups.length === 0) {
      toast({
        title: "No Matching Pairs",
        description: label,
      });
      return;
    }

    const eligibleGroupIds = new Set(eligibleGroups.map(group => group.id));
    const equalSizeCount = eligibleGroups.filter(group =>
      getFileSizeBytes(group.images[0]) === getFileSizeBytes(group.images[1])
    ).length;

    setAllGroups(prevGroups => prevGroups.map(group => {
      if (!eligibleGroupIds.has(group.id)) return group;

      const [first, second] = group.images;
      // If sizes tie, mark the second file as a review candidate.
      const candidateId =
        getFileSizeBytes(first) < getFileSizeBytes(second) ? first.id : second.id;

      return {
        ...group,
        images: group.images.map(image =>
          image.id === candidateId
            ? { ...image, isMarkedForDeletion: true }
            : image
        ) as [ImageFile, ImageFile]
      };
    }));

    const tieNote = equalSizeCount > 0
      ? ` In ${equalSizeCount} pair(s) with equal sizes, the second file was marked.`
      : "";
    toast({
      title: "Candidates Marked for Review",
      description: `Marked the smaller file in ${eligibleGroups.length} pair(s). Review the selections, then use Apply All Changes to delete them.${tieNote}`,
    });
  };

  const handleMarkExactDuplicates = () => {
    const exactGroups = allGroups.filter(group => group.similarity === 100);
    markSmallerFiles(
      exactGroups,
      "No pairs have 100% visual similarity."
    );
  };

  const handleMarkThresholdCandidates = () => {
    const matchingGroups = allGroups.filter(group => group.similarity >= threshold);
    markSmallerFiles(
      matchingGroups,
      `No pairs meet the selected threshold of ${threshold}%.`
    );
  };

  const handleSave = async () => {
    const markedImages = allGroups.flatMap(group =>
      group.images.filter(i => i.isMarkedForDeletion)
    );

    if (markedImages.length === 0) {
      toast({
        title: "No Action Taken",
        description: "Please mark at least one image to delete across all groups.",
        variant: "destructive"
      });
      return;
    }

    const electronAPI = (window as any).electronAPI;

    if (electronAPI) {
      // Running inside Electron — actually delete files from disk
      let deletedCount = 0;
      const errors: string[] = [];
      const deletedImageIds = new Set<string>();

      for (const img of markedImages) {
        if (!img.filePath) {
          errors.push(`${img.name}: no path available`);
          continue;
        }
        try {
          const result = await electronAPI.deleteFile(img.filePath);
          if (result.success) {
            deletedCount++;
            deletedImageIds.add(img.id);
          } else {
            errors.push(`${img.name}: ${result.error}`);
          }
        } catch (error) {
          errors.push(`${img.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Remove only files confirmed deleted; retain failures for review/retry.
      setAllGroups(prevGroups =>
        prevGroups
          .map(group => ({
            ...group,
            images: group.images.filter(img => !deletedImageIds.has(img.id)) as [any, any]
          }))
          .filter(group => group.images.length >= 2)
      );

      if (errors.length > 0) {
        toast({
          title: `Deleted ${deletedCount} of ${markedImages.length} file(s)`,
          description: `Errors: ${errors.join('; ')}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Files Deleted",
          description: `${deletedCount} file(s) permanently deleted from disk.`,
        });
      }
    } else {
      // Running in a plain browser — can't touch the filesystem
      toast({
        title: "Browser Limitation",
        description: "Web apps cannot delete files from disk. Run the desktop app (.exe) to enable deletion.",
        variant: "destructive"
      });
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
    <div className="min-h-screen bg-background text-foreground h-screen overflow-hidden">
      <PanelGroup direction="horizontal">
        {/* Main Content Area */}
        <Panel defaultSize={75} minSize={40} className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <header className="h-16 border-b flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm z-10 shrink-0">
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
              Reviewing {groups.length} duplicate groups
            </div>
            
            <Button onClick={handleSave} className="gap-2 shadow-lg shadow-primary/20">
                <Save className="h-4 w-4" />
                Apply All Changes
            </Button>
          </div>
        </header>

          {/* Comparison Stage */}
          <main className="flex-1 p-6 overflow-y-auto bg-muted/10 min-h-0">
            <div className="w-full flex flex-col gap-10 pb-12">
              <AnimatePresence>
                  {groups.length > 0 ? (
                      groups.map(group => (
                          <motion.div
                              key={group.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="bg-card rounded-2xl border shadow-sm p-4 overflow-hidden"
                          >
                              <ComparisonView 
                                  group={group} 
                                  onToggleMark={(imageId) => handleToggleMark(group.id, imageId)} 
                                  onToggleMarkAll={(markAll) => handleToggleMarkGroup(group.id, markAll)}
                              />
                          </motion.div>
                      ))
                  ) : (
                      <div className="py-32 flex flex-col items-center justify-center text-muted-foreground bg-card/50 rounded-2xl border border-dashed">
                          <p className="text-xl font-medium text-foreground">No matches found</p>
                          <p className="text-sm mt-1">Try lowering the similarity threshold</p>
                      </div>
                  )}
              </AnimatePresence>
            </div>
          </main>
        </Panel>

        <PanelResizeHandle className="w-1.5 bg-border/50 hover:bg-primary/50 transition-colors" />

        {/* Sidebar Controls */}
        <Panel defaultSize={25} minSize={20} maxSize={40} className="h-full">
          <SimilarityControls 
            threshold={threshold}
            setThreshold={setThreshold}
            onMarkExactDuplicates={handleMarkExactDuplicates}
            onMarkThresholdCandidates={handleMarkThresholdCandidates}
            onRescan={handleRescan}
            onFilesSelected={handleFilesSelected}
            scanSummary={scanSummary}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}
