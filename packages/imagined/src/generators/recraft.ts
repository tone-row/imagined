import { join, dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { ImageGenerator, ImageGenerationParams, ImageGenerationResult } from './types';

export interface RecraftConfig {
  apiKey: string;
  baseUrl?: string;
}

export class RecraftGenerator extends ImageGenerator {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: RecraftConfig) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://external.api.recraft.ai/v1';
  }

  async generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    try {
      // Ensure output directory exists
      const outputDir = dirname(params.outputPath);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Determine the model to use based on style
      let model = 'recraftv3'; // Default to v3

      // Check if logo_raster is actually supported - for now let's try without model override
      // if (params.recraftStyle && 'style' in params.recraftStyle && params.recraftStyle.style === 'logo_raster') {
      //   model = 'recraftv2';
      // }

      // Build request body for Recraft API
      const requestBody: any = {
        prompt: params.prompt,
        model: model,
        n: 1, // Generate 1 image
        response_format: 'url', // Get URL to download from
      };

      // Set size if provided
      if (params.width && params.height) {
        requestBody.size = `${params.width}x${params.height}`;
      } else {
        requestBody.size = '1024x1024'; // Default size
      }

      // Handle style configuration
      if (params.recraftStyle) {
        if ('style_id' in params.recraftStyle) {
          requestBody.style_id = params.recraftStyle.style_id;
        } else {
          requestBody.style = params.recraftStyle.style;
          if (params.recraftStyle.substyle) {
            requestBody.substyle = params.recraftStyle.substyle;
          }
        }
      }

      console.log(`🎨 Generating image with Recraft API...`);
      console.log(`   Prompt: "${params.prompt}"`);
      console.log(`   Size: ${requestBody.size}`);
      console.log(`   Model: ${requestBody.model}`);
      if (requestBody.style_id) {
        console.log(`   Style ID: ${requestBody.style_id}`);
      } else if (requestBody.style) {
        console.log(`   Style: ${requestBody.style}`);
        if (requestBody.substyle) {
          console.log(`   Substyle: ${requestBody.substyle}`);
        }
      } else {
        console.log(`   Style: default (any)`);
      }

      // Make API request
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Recraft API error (${response.status}): ${errorText}`);
      }

      const result = await response.json();

      if (!result.data || !result.data[0] || !result.data[0].url) {
        throw new Error('Invalid response from Recraft API - no image URL provided');
      }

      const imageUrl = result.data[0].url;
      console.log(`   Image URL: ${imageUrl}`);

      // Download the image
      const downloadSuccess = await this.downloadImage(imageUrl, params.outputPath);

      if (!downloadSuccess) {
        throw new Error('Failed to download generated image');
      }

      console.log(`   ✅ Image saved: ${params.outputPath}`);

      return {
        success: true,
        imagePath: params.outputPath,
        metadata: {
          actualSize: {
            width: params.width || 1024,
            height: params.height || 1024,
          },
          format: params.format || 'jpeg',
        },
      };

    } catch (error) {
      console.error('❌ Recraft image generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Helper method to validate API key format (basic check)
  public static validateApiKey(apiKey: string): boolean {
    return typeof apiKey === 'string' && apiKey.length > 10;
  }
}