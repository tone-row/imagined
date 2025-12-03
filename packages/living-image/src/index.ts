// Main component and types
export { LivingImage, type LivingImageProps } from './LivingImage.tsx';
export { HonoLivingImage, type HonoLivingImageProps } from './HonoLivingImage.tsx';
export { default } from './LivingImage.tsx';

// Utility functions
export { getImageSrc } from './utils';

// Configuration and types
export { loadConfig, type LivingImageConfig, type RecraftStyleOptions } from './config';

// All Recraft style types for strong typing
export type * from './types/recraft-styles';

// Macro types (for advanced users)
export type { ImageGenerationParams, ImageGenerationResult } from './generators/types';