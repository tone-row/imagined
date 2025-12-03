// Main component and types
export { LivingImage, type LivingImageProps } from "./LivingImage.tsx";
export { default } from "./LivingImage.tsx";

// Utility functions
export { 
  getImageSrc, 
  configureImagePath, 
  getImagePath,
  configureImageFormat,
  getImageFormat,
  configureImageSettings
} from "./utils";

// Configuration and types (client-safe - no server-only functions)
export { type LivingImageConfig, type RecraftStyleOptions } from "./config";

// All Recraft style types for strong typing
export type * from "./types/recraft-styles";

// Macro types (for advanced users)
export type {
  ImageGenerationParams,
  ImageGenerationResult,
} from "./generators/types";
