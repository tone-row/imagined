#!/usr/bin/env -S bun run

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { RecraftGenerator } from './generators/recraft';
import { loadConfig } from './config';

interface LivingImageMatch {
  fullMatch: string;
  prompt: string;
  width?: number;
  height?: number;
  seed?: string;
  recraftStyle?: string; // Serialized JSON of RecraftStyleOptions
  otherProps: string;
}

function findLivingImageComponents(content: string): LivingImageMatch[] {
  const matches: LivingImageMatch[] = [];

  // Simple regex to find LivingImage components
  // This is a basic implementation - in production we'd use a proper AST parser
  const componentRegex = /<LivingImage\s+([^>]+)(?:\s*\/?>|>[^<]*<\/LivingImage>)/g;

  let match;
  while ((match = componentRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const propsString = match[1];

    // Extract props using simple regex (in production, would use AST parser)
    const promptMatch = propsString.match(/prompt=["']([^"']+)["']/);
    const widthMatch = propsString.match(/width=\{?(\d+)\}?/);
    const heightMatch = propsString.match(/height=\{?(\d+)\}?/);
    const seedMatch = propsString.match(/seed=["']([^"']+)["']/);
    const recraftStyleMatch = propsString.match(/recraftStyle=\{([^}]+)\}/);

    if (promptMatch) {
      // Extract other props by removing the ones we've parsed
      let otherProps = propsString;
      otherProps = otherProps.replace(/prompt=["'][^"']+["']/, '');
      otherProps = otherProps.replace(/width=\{?\d+\}?/, '');
      otherProps = otherProps.replace(/height=\{?\d+\}?/, '');
      otherProps = otherProps.replace(/seed=["'][^"']+["']/, '');
      otherProps = otherProps.replace(/recraftStyle=\{[^}]+\}/, '');
      otherProps = otherProps.trim();

      matches.push({
        fullMatch,
        prompt: promptMatch[1],
        width: widthMatch ? parseInt(widthMatch[1]) : undefined,
        height: heightMatch ? parseInt(heightMatch[1]) : undefined,
        seed: seedMatch ? seedMatch[1] : undefined,
        recraftStyle: recraftStyleMatch ? recraftStyleMatch[1] : undefined,
        otherProps
      });
    }
  }

  return matches;
}

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

function transformLivingImageToImg(match: LivingImageMatch): string {
  const imageKey = generateImageKey(match.prompt, match.width, match.height, match.seed, match.recraftStyle);
  const imagePath = `./generated-images/${imageKey}.jpg`; // For now, assume JPG

  // Build the img element
  let imgElement = `<img src="${imagePath}"`;

  if (match.width) imgElement += ` width={${match.width}}`;
  if (match.height) imgElement += ` height={${match.height}}`;

  // Add other props
  if (match.otherProps) {
    imgElement += ` ${match.otherProps}`;
  }

  // Add alt text based on prompt
  imgElement += ` alt="${match.prompt}"`;

  imgElement += ' />';

  return imgElement;
}

async function generateImageIfNeeded(match: LivingImageMatch, config: any): Promise<boolean> {
  const imageKey = generateImageKey(match.prompt, match.width, match.height, match.seed, match.recraftStyle);
  const imagePath = join(config.outputDir, `${imageKey}.jpg`);

  // Check if image already exists
  if (existsSync(imagePath)) {
    console.log(`    ✅ Image already exists: ${imagePath}`);
    return true;
  }

  if (!config.apiKey) {
    console.log(`    ⚠️  RECRAFT_API_KEY not set - skipping generation for: ${imagePath}`);
    return false;
  }

  // Create generator and generate image
  const generator = new RecraftGenerator({ apiKey: config.apiKey });

  // Parse recraftStyle if it exists
  let recraftStyle;
  if (match.recraftStyle) {
    try {
      recraftStyle = JSON.parse(`{${match.recraftStyle}}`);
    } catch (error) {
      console.log(`    ⚠️  Invalid recraftStyle format: ${match.recraftStyle}`);
      // Use default style from config
      recraftStyle = config.defaultStyle;
    }
  } else {
    // Use default style from config
    recraftStyle = config.defaultStyle;
  }

  const result = await generator.generateImage({
    prompt: match.prompt,
    width: match.width,
    height: match.height,
    seed: match.seed,
    recraftStyle,
    outputPath: imagePath,
  });

  if (result.success) {
    console.log(`    ✅ Generated: ${imagePath}`);
    return true;
  } else {
    console.log(`    ❌ Failed to generate: ${result.error}`);
    return false;
  }
}

async function processFile(filePath: string, config: any, generateImages: boolean = false): Promise<boolean> {
  const content = readFileSync(filePath, 'utf-8');
  const matches = findLivingImageComponents(content);

  if (matches.length === 0) {
    return false;
  }

  console.log(`Found ${matches.length} LivingImage components in ${filePath}`);

  // Ensure output directory exists
  if (generateImages && !existsSync(config.outputDir)) {
    mkdirSync(config.outputDir, { recursive: true });
    console.log(`Created output directory: ${config.outputDir}`);
  }

  let newContent = content;
  for (const match of matches) {
    console.log(`  - Prompt: "${match.prompt}"`);
    if (match.width || match.height) {
      console.log(`    Dimensions: ${match.width || 'auto'} x ${match.height || 'auto'}`);
    }
    if (match.seed) console.log(`    Seed: ${match.seed}`);
    if (match.recraftStyle) {
      console.log(`    Recraft Style: ${match.recraftStyle}`);
    }

    // Generate image if requested
    if (generateImages) {
      await generateImageIfNeeded(match, config);
    }

    const imgElement = transformLivingImageToImg(match);
    newContent = newContent.replace(match.fullMatch, imgElement);
  }

  // For now, just log the transformation - don't write back yet
  console.log('Transformed content preview:');
  console.log('---');
  console.log(newContent.slice(0, 500) + (newContent.length > 500 ? '...' : ''));
  console.log('---\n');

  return true;
}

async function scanDirectory(dirPath: string, config: any, generateImages: boolean = false): Promise<void> {
  const items = readdirSync(dirPath);

  for (const item of items) {
    const itemPath = join(dirPath, item);
    const stat = statSync(itemPath);

    if (stat.isDirectory() && item !== 'node_modules' && item !== '.git' && item !== 'dist') {
      await scanDirectory(itemPath, config, generateImages);
    } else if (stat.isFile()) {
      const ext = extname(item);
      if (ext === '.tsx' || ext === '.jsx' || ext === '.ts') {
        await processFile(itemPath, config, generateImages);
      }
    }
  }
}

export async function runMacro(targetDir: string = process.cwd(), options: { generate?: boolean, outputDir?: string } = {}): Promise<void> {
  console.log('🎨 Running living-image macro...');
  console.log(`Scanning directory: ${targetDir}\n`);

  // Load configuration with dotenv support
  const config = loadConfig(targetDir);

  // Override with CLI options
  if (options.outputDir) {
    config.outputDir = options.outputDir;
  }
  if (!config.outputDir) {
    config.outputDir = join(targetDir, 'generated-images');
  }

  const generateImages = options.generate || false;

  if (generateImages) {
    console.log('🚀 Image generation enabled');
    console.log(`📋 Model: ${config.model}`);
    if (config.apiKey) {
      console.log('✅ RECRAFT_API_KEY found');
    } else {
      console.log('⚠️  RECRAFT_API_KEY not set - images will not be generated');
    }
    console.log(`📁 Output directory: ${config.outputDir}`);
    if (config.defaultStyle) {
      console.log(`🎨 Default style: ${JSON.stringify(config.defaultStyle)}`);
    }
    console.log();
  } else {
    console.log('👀 Scan-only mode (use --generate to create images)\n');
  }

  await scanDirectory(targetDir, config, generateImages);

  console.log('✅ Macro scan complete!');
}

// If run directly
if (import.meta.main) {
  const targetDir = process.argv[2] || process.cwd();
  const generateFlag = process.argv.includes('--generate') || process.argv.includes('-g');
  const outputDirFlag = process.argv.find(arg => arg.startsWith('--output='));
  const outputDir = outputDirFlag ? outputDirFlag.split('=')[1] : undefined;

  runMacro(targetDir, { generate: generateFlag, outputDir }).catch(console.error);
}