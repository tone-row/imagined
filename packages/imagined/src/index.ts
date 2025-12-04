// Main component and types
export { Imagined, type ImaginedProps } from "./Imagined.tsx";
export { default } from "./Imagined.tsx";

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
export { type ImaginedConfig, type RecraftStyleOptions } from "./config";

// All Recraft style types for strong typing
export type * from "./types/recraft-styles";

// Macro types (for advanced users)
export type {
  ImageGenerationParams,
  ImageGenerationResult,
} from "./generators/types";
