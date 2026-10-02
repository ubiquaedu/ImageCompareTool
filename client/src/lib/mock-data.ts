import mountainA from "@assets/generated_images/mountain_landscape_variation_a.png";
import mountainB from "@assets/generated_images/mountain_landscape_variation_b.png";
import cityA from "@assets/generated_images/cyberpunk_city_variation_a.png";
import cityB from "@assets/generated_images/cyberpunk_city_variation_b.png";

export interface ImageFile {
  id: string;
  src: string;
  name: string;
  size: string;
  resolution: string;
  date: string;
  isMarkedForDeletion?: boolean;
  /** Real absolute path on disk — available only when running inside Electron */
  filePath?: string;
  /** Exact file size in bytes, used to choose the smaller file in a pair */
  fileSizeBytes?: number;
}

export interface DuplicateGroup {
  id: string;
  similarity: number;
  images: [ImageFile, ImageFile]; // simplified to pairs for this mockup
}

export const MOCK_GROUPS: DuplicateGroup[] = [
  {
    id: "group-1",
    similarity: 94,
    images: [
      {
        id: "img-1a",
        src: mountainA,
        name: "DSC_8842.JPG",
        size: "4.2 MB",
        resolution: "6000x4000",
        date: "2023-11-15 08:42:11",
      },
      {
        id: "img-1b",
        src: mountainB,
        name: "DSC_8843.JPG",
        size: "4.1 MB",
        resolution: "6000x4000",
        date: "2023-11-15 08:42:15",
      },
    ],
  },
  {
    id: "group-2",
    similarity: 87,
    images: [
      {
        id: "img-2a",
        src: cityA,
        name: "NEON_CITY_V1.PNG",
        size: "12.4 MB",
        resolution: "3840x2160",
        date: "2023-12-01 22:15:00",
      },
      {
        id: "img-2b",
        src: cityB,
        name: "NEON_CITY_V2.PNG",
        size: "12.2 MB",
        resolution: "3840x2160",
        date: "2023-12-01 22:18:33",
      },
    ],
  },
  // Add some duplicates for the "exact match" scenario
  {
    id: "group-3",
    similarity: 100,
    images: [
      {
        id: "img-3a",
        src: mountainA,
        name: "BACKUP_DSC_8842.JPG",
        size: "4.2 MB",
        resolution: "6000x4000",
        date: "2023-11-16 10:00:00",
      },
      {
        id: "img-3b",
        src: mountainA, // Same image source
        name: "DSC_8842_COPY.JPG",
        size: "4.2 MB",
        resolution: "6000x4000",
        date: "2023-11-15 08:42:11",
      },
    ],
  },
];
