import type { RecraftStyleOptions } from "./types/recraft-styles";

export interface ImaginedConfig {
  // API Configuration
  apiKey?: string;

  // Source Configuration
  // Directory to scan for Imagined components (defaults to current directory)
  sourceDir?: string;

  // Output Configuration
  outputDir?: string;
  imageFormat?: "jpg" | "png" | "webp";
  
  // Public Path Configuration
  // The URL path used by the component to reference images (e.g., "/generated-images")
  // This can differ from outputDir (e.g., outputDir: "./public/generated-images", publicPath: "/generated-images")
  publicPath?: string;

  // Global Style Configuration
  defaultStyle?: RecraftStyleOptions;

  // Model Configuration
  model?: "recraftv2" | "recraftv3";
}

export interface ImaginedConfigFile extends ImaginedConfig {
  // Config file can contain additional non-runtime settings
  version?: string;
}

// Helper to validate style configuration
export function validateStyleConfig(style: RecraftStyleOptions): boolean {
  if ("style_id" in style) {
    return typeof style.style_id === "string" && style.style_id.length > 0;
  }

  if ("style" in style) {
    const validStyles = [
      "realistic_image",
      "digital_illustration",
      "vector_illustration",
    ];
    return validStyles.includes(style.style);
  }

  return false;
}

// Export types for TypeScript users
export type { RecraftStyleOptions } from "./types/recraft-styles";
export type {
  RecraftV3Style,
  RecraftV3Substyle,
  RecraftStyleConfig,
  RealisticImageSubstyle,
  DigitalIllustrationSubstyle,
  VectorIllustrationSubstyle,
} from "./types/recraft-styles";
