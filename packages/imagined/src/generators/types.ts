import type { RecraftStyleOptions } from '../types/recraft-styles';

export interface ImageGenerationParams {
  prompt: string;
  width?: number;
  height?: number;
  seed?: string;
  recraftStyle?: RecraftStyleOptions;
  format?: 'png' | 'jpeg' | 'webp';
  outputPath: string; // Where to save the generated image
}

export interface ImageGenerationResult {
  success: boolean;
  imagePath?: string;
  error?: string;
  metadata?: {
    actualSize?: { width: number; height: number };
    format?: string;
    fileSize?: number;
  };
}

export abstract class ImageGenerator {
  abstract generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult>;

  protected async downloadImage(url: string, outputPath: string): Promise<boolean> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Check if we're in Bun or Node.js environment
      if (typeof Bun !== 'undefined') {
        // Use Bun's file API
        await Bun.write(outputPath, buffer);
      } else {
        // Use Node.js fs module
        const { writeFileSync } = await import('fs');
        writeFileSync(outputPath, buffer);
      }

      return true;
    } catch (error) {
      console.error('Failed to download image:', error);
      return false;
    }
  }
}