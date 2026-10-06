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

export interface SimilarityPair {
  firstIndex: number;
  secondIndex: number;
  similarity: number;
}

const MAX_RETAINED_CANDIDATES = 250_000;

/**
 * Select disjoint matches by ranking every qualifying pair together, instead
 * of letting the first file in a folder claim its best remaining neighbor.
 * Stable keys make equal-score decisions repeatable across scans.
 */
export function findBestSimilarityPairs(
  hashes: readonly string[],
  stableKeys: readonly string[],
  minimumSimilarity = 60,
): SimilarityPair[] {
  const candidates: SimilarityPair[] = [];
  let candidateLimitExceeded = false;

  outer: for (let i = 0; i < hashes.length; i++) {
    for (let j = i + 1; j < hashes.length; j++) {
      const similarity = calculateSimilarity(hashes[i], hashes[j]);
      if (similarity < minimumSimilarity) continue;

      if (candidates.length >= MAX_RETAINED_CANDIDATES) {
        candidateLimitExceeded = true;
        break outer;
      }

      const keyOrder = (stableKeys[i] ?? String(i)).localeCompare(stableKeys[j] ?? String(j));
      candidates.push({
        firstIndex: keyOrder <= 0 ? i : j,
        secondIndex: keyOrder <= 0 ? j : i,
        similarity,
      });
    }
  }

  // Dense folders can produce millions of candidate edges. In that case,
  // avoid retaining a huge edge list and use a deterministic, bounded-memory
  // fallback over the already stably ordered files.
  if (candidateLimitExceeded) {
    const used = new Uint8Array(hashes.length);
    const pairs: SimilarityPair[] = [];

    for (let i = 0; i < hashes.length; i++) {
      if (used[i]) continue;

      let bestIndex = -1;
      let bestSimilarity = minimumSimilarity - 1;
      for (let j = i + 1; j < hashes.length; j++) {
        if (used[j]) continue;
        const similarity = calculateSimilarity(hashes[i], hashes[j]);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestIndex = j;
        }
      }

      if (bestIndex !== -1) {
        used[i] = 1;
        used[bestIndex] = 1;
        pairs.push({ firstIndex: i, secondIndex: bestIndex, similarity: bestSimilarity });
      }
    }

    return pairs.sort((a, b) => b.similarity - a.similarity);
  }

  candidates.sort((a, b) =>
    b.similarity - a.similarity
    || (stableKeys[a.firstIndex] ?? String(a.firstIndex)).localeCompare(stableKeys[b.firstIndex] ?? String(b.firstIndex))
    || (stableKeys[a.secondIndex] ?? String(a.secondIndex)).localeCompare(stableKeys[b.secondIndex] ?? String(b.secondIndex))
  );

  const used = new Uint8Array(hashes.length);
  const pairs: SimilarityPair[] = [];
  for (const candidate of candidates) {
    if (used[candidate.firstIndex] || used[candidate.secondIndex]) continue;
    used[candidate.firstIndex] = 1;
    used[candidate.secondIndex] = 1;
    pairs.push(candidate);
  }

  return pairs;
}
