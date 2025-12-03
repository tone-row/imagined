// Global configuration for image public path
// This can be set via configureImagePath() or defaults to "/generated-images"
let globalImagePath = "/generated-images";

// Global configuration for image format
// This can be set via configureImageFormat() or defaults to "jpg"
let globalImageFormat: "jpg" | "png" | "webp" = "jpg";

/**
 * Configure the public path used for image URLs.
 * This should match the publicPath from your living-image.config.ts file.
 *
 * @param path - The public path (e.g., "/generated-images" or "/assets/images")
 */
export function configureImagePath(path: string): void {
  // Ensure path starts with / and doesn't end with /
  globalImagePath = path.startsWith("/") ? path : `/${path}`;
  globalImagePath = globalImagePath.endsWith("/")
    ? globalImagePath.slice(0, -1)
    : globalImagePath;
}

/**
 * Get the currently configured image public path.
 */
export function getImagePath(): string {
  return globalImagePath;
}

/**
 * Configure the image format used for image URLs.
 * This should match the imageFormat from your living-image.config.ts file.
 *
 * @param format - The image format ("jpg" | "png" | "webp")
 */
export function configureImageFormat(format: "jpg" | "png" | "webp"): void {
  globalImageFormat = format;
}

/**
 * Get the currently configured image format.
 */
export function getImageFormat(): "jpg" | "png" | "webp" {
  return globalImageFormat;
}

/**
 * Configure both image path and format from a config object.
 * This is a convenience function that calls configureImagePath and configureImageFormat.
 *
 * @param config - Configuration object with publicPath and/or imageFormat
 */
export function configureImageSettings(config: {
  publicPath?: string;
  imageFormat?: "jpg" | "png" | "webp";
}): void {
  if (config.publicPath !== undefined) {
    configureImagePath(config.publicPath);
  }
  if (config.imageFormat !== undefined) {
    configureImageFormat(config.imageFormat);
  }
}

/**
 * Normalizes a recraftStyle serialized string to a consistent format.
 * This ensures that regardless of the order properties appear in source code,
 * the same object produces the same serialized string.
 *
 * Format: "key":"value","key2":"value2" (comma-separated, no braces)
 * Order: style, substyle, style_id (alphabetical by key name)
 */
export function normalizeRecraftStyleString(
  recraftStyleString: string | undefined
): string | undefined {
  if (!recraftStyleString) return undefined;

  // Parse the serialized string into key-value pairs
  // Format is: "key":"value","key2":"value2"
  const pairs: Array<{ key: string; value: string }> = [];

  // Use regex to extract key-value pairs
  const regex = /"([^"]+)":"([^"]*)"/g;
  let match;
  while ((match = regex.exec(recraftStyleString)) !== null) {
    pairs.push({ key: match[1], value: match[2] });
  }

  // Sort by key name to ensure consistent order
  pairs.sort((a, b) => a.key.localeCompare(b.key));

  // Reconstruct the string in normalized order
  return pairs.map((p) => `"${p.key}":"${p.value}"`).join(",");
}

export function generateImageKey(
  prompt: string,
  width?: number,
  height?: number,
  seed?: string,
  recraftStyle?: string
): string {
  // Normalize recraftStyle to ensure consistent key generation
  const normalizedRecraftStyle = normalizeRecraftStyleString(recraftStyle);

  // Create a hash-like key from the prompt and all parameters that affect image generation
  const keyString = `${prompt}_${width || ""}_${height || ""}_${seed || ""}_${
    normalizedRecraftStyle || ""
  }`;
  // Simple hash function (in production, use a proper hash like crypto.createHash)
  let hash = 0;
  for (let i = 0; i < keyString.length; i++) {
    const char = keyString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export function getImageSrc(
  prompt: string,
  width?: number,
  height?: number,
  seed?: string,
  recraftStyle?: any
): string {
  // Serialize recraftStyle to match macro format: "key":"value","key2":"value2"
  let recraftStyleString: string | undefined;
  if (recraftStyle) {
    if (typeof recraftStyle === "string") {
      // Already a string (from macro extraction) - normalize it
      recraftStyleString = normalizeRecraftStyleString(recraftStyle);
    } else {
      // Convert object to serialized string format
      const props: string[] = [];

      // Collect all properties (order doesn't matter - normalizeRecraftStyleString will sort them)
      if ("style" in recraftStyle && recraftStyle.style) {
        props.push(`"style":"${String(recraftStyle.style)}"`);
      }
      if ("substyle" in recraftStyle && recraftStyle.substyle) {
        props.push(`"substyle":"${String(recraftStyle.substyle)}"`);
      }
      if ("style_id" in recraftStyle && recraftStyle.style_id) {
        props.push(`"style_id":"${String(recraftStyle.style_id)}"`);
      }

      // Normalize to ensure consistent ordering
      recraftStyleString =
        props.length > 0
          ? normalizeRecraftStyleString(props.join(","))
          : undefined;
    }
  }

  const imageKey = generateImageKey(
    prompt,
    width,
    height,
    seed,
    recraftStyleString
  );

  // Use the configured public path and format (can be set via configureImagePath/configureImageFormat())
  // Defaults to "/generated-images" and "jpg" if not configured
  return `${globalImagePath}/${imageKey}.${globalImageFormat}`;
}

/**
 * Returns a data URI for a 4x4 pixel checkered pattern (transparent/white checkerboard)
 * This is used as a fallback when the generated image hasn't been created yet.
 */
export function getCheckeredFallback(): string {
  // SVG data URI for a 4x4 pixel checkered pattern
  // Each square is 1x1 pixel, alternating white and light gray
  const svg = `<svg width="4" height="4" xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1" fill="#fff"/><rect x="1" width="1" height="1" fill="#ddd"/><rect x="2" width="1" height="1" fill="#fff"/><rect x="3" width="1" height="1" fill="#ddd"/><rect y="1" width="1" height="1" fill="#ddd"/><rect x="1" y="1" width="1" height="1" fill="#fff"/><rect x="2" y="1" width="1" height="1" fill="#ddd"/><rect x="3" y="1" width="1" height="1" fill="#fff"/><rect y="2" width="1" height="1" fill="#fff"/><rect x="1" y="2" width="1" height="1" fill="#ddd"/><rect x="2" y="2" width="1" height="1" fill="#fff"/><rect x="3" y="2" width="1" height="1" fill="#ddd"/><rect y="3" width="1" height="1" fill="#ddd"/><rect x="1" y="3" width="1" height="1" fill="#fff"/><rect x="2" y="3" width="1" height="1" fill="#ddd"/><rect x="3" y="3" width="1" height="1" fill="#fff"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
