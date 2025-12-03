import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { config as dotenvConfig } from 'dotenv';
import type { RecraftStyleOptions } from './types/recraft-styles';

export interface LivingImageConfig {
  // API Configuration
  apiKey?: string;

  // Output Configuration
  outputDir?: string;
  imageFormat?: 'jpg' | 'png' | 'webp';

  // Global Style Configuration
  defaultStyle?: RecraftStyleOptions;

  // Model Configuration
  model?: 'recraftv3';
}

export interface LivingImageConfigFile extends LivingImageConfig {
  // Config file can contain additional non-runtime settings
  version?: string;
}

/**
 * Load configuration from multiple sources in order of priority:
 * 1. Environment variables
 * 2. living-image.config.js/ts
 * 3. package.json "livingImage" field
 * 4. Default values
 */
export function loadConfig(projectRoot: string = process.cwd()): LivingImageConfig {
  // Load .env files automatically
  const envFiles = ['.env.local', '.env', '.env.production'];
  for (const envFile of envFiles) {
    const envPath = join(projectRoot, envFile);
    if (existsSync(envPath)) {
      dotenvConfig({ path: envPath });
      break; // Use first found .env file
    }
  }

  const config: LivingImageConfig = {
    // Defaults
    outputDir: './generated-images',
    imageFormat: 'jpg',
    model: 'recraftv3',
    defaultStyle: {
      style: 'realistic_image',
      substyle: 'natural_light'
    }
  };

  // 1. Environment variables
  if (process.env.RECRAFT_API_KEY) {
    config.apiKey = process.env.RECRAFT_API_KEY;
  }

  if (process.env.LIVING_IMAGE_OUTPUT_DIR) {
    config.outputDir = process.env.LIVING_IMAGE_OUTPUT_DIR;
  }

  // 2. living-image.config.js/ts
  const configFiles = [
    'living-image.config.ts',
    'living-image.config.js',
    'living-image.config.mjs'
  ];

  for (const configFile of configFiles) {
    const configPath = join(projectRoot, configFile);
    if (existsSync(configPath)) {
      try {
        // For now, we'll skip dynamic imports for config files
        // In production, you'd want to use dynamic import() here
        console.log(`📁 Found config file: ${configFile} (manual loading required)`);
      } catch (error) {
        console.warn(`⚠️  Failed to load config file ${configFile}:`, error);
      }
      break;
    }
  }

  // 3. package.json "livingImage" field
  const packageJsonPath = join(projectRoot, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.livingImage) {
        Object.assign(config, packageJson.livingImage);
      }
    } catch (error) {
      console.warn('⚠️  Failed to parse package.json:', error);
    }
  }

  return config;
}

// Helper to validate style configuration
export function validateStyleConfig(style: RecraftStyleOptions): boolean {
  if ('style_id' in style) {
    return typeof style.style_id === 'string' && style.style_id.length > 0;
  }

  if ('style' in style) {
    const validStyles = ['realistic_image', 'digital_illustration', 'vector_illustration', 'logo_raster'];
    return validStyles.includes(style.style);
  }

  return false;
}

// Export types for TypeScript users
export type { RecraftStyleOptions } from './types/recraft-styles';
export type {
  RecraftV3Style,
  RecraftV3Substyle,
  RecraftStyleConfig,
  RealisticImageSubstyle,
  DigitalIllustrationSubstyle,
  VectorIllustrationSubstyle,
  LogoRasterSubstyle
} from './types/recraft-styles';