// Simple Blockhash implementation for client-side image comparison
// Based on the blockhash algorithm concepts (scaling, grayscale, median comparison)

const HAS_SIZE = 16; // 16x16 hash = 256 bits

export async function computeImageHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const hash = processImage(img);
        resolve(hash);
      } catch (e) {
        reject(e);
      }
    };
    
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    
    img.src = url;
  });
}

function processImage(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error("Could not get canvas context");
  
  // 1. Resize image to small fixed size (e.g. 16x16) to simplify details
  canvas.width = HAS_SIZE;
  canvas.height = HAS_SIZE;
  
  // Draw image to fill the small canvas (ignoring aspect ratio is intentional for hashing)
  ctx.drawImage(img, 0, 0, HAS_SIZE, HAS_SIZE);
  
  // 2. Get pixel data
  const imageData = ctx.getImageData(0, 0, HAS_SIZE, HAS_SIZE);
  const data = imageData.data;
  const grays: number[] = [];
  
  // 3. Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    // Luminance formula: 0.299*R + 0.587*G + 0.114*B
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    grays.push(gray);
  }
  
  // 4. Calculate median value
  // Sorting is expensive, mean is faster and often sufficient for simple blockhash
  const sum = grays.reduce((a, b) => a + b, 0);
  const mean = sum / grays.length;
  
  // 5. Generate hash bits (1 if pixel > mean, 0 otherwise)
  let hash = "";
  for (let i = 0; i < grays.length; i++) {
    hash += grays[i] >= mean ? "1" : "0";
  }
  
  return hash;
}

export function calculateSimilarity(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    console.warn("Hash lengths differ", hash1.length, hash2.length);
    return 0;
  }
  
  // Hamming distance: count differing bits
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  
  // Convert distance to similarity percentage
  // 0 distance = 100% similar
  // Max distance = hash length (completely opposite)
  const totalBits = hash1.length;
  const similarity = 1 - (distance / totalBits);
  
  // Scale to percentage (0-100)
  return Math.round(similarity * 100);
}
