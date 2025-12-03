function generateImageKey(prompt: string, width?: number, height?: number, seed?: string, recraftStyle?: string): string {
  // Create a hash-like key from the prompt and all parameters that affect image generation
  const keyString = `${prompt}_${width || ''}_${height || ''}_${seed || ''}_${recraftStyle || ''}`;
  // Simple hash function (in production, use a proper hash like crypto.createHash)
  let hash = 0;
  for (let i = 0; i < keyString.length; i++) {
    const char = keyString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export function getImageSrc(prompt: string, width?: number, height?: number, seed?: string, recraftStyle?: any): string {
  const recraftStyleString = recraftStyle ? JSON.stringify(recraftStyle).slice(1, -1) : undefined;
  const imageKey = generateImageKey(prompt, width, height, seed, recraftStyleString);
  return `./generated-images/${imageKey}.jpg`;
}