import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
  unlinkSync,
  watch,
} from "fs";
import { join, extname, relative } from "path";
import { RecraftGenerator } from "./generators/recraft";
import { loadConfig } from "./config-server";
import parser from "@babel/parser";
import traverse from "@babel/traverse";
const traverseDefault = (traverse as any).default || traverse;
import * as t from "@babel/types";

interface ImaginedMatch {
  fullMatch: string;
  prompt: string;
  width?: number;
  height?: number;
  seed?: string;
  recraftStyle?: string; // Serialized JSON of RecraftStyleOptions
  otherProps: string;
}

// Helper to extract value from AST node
function extractValueFromNode(
  node: t.Node | null | undefined
): string | number | undefined {
  if (!node) return undefined;

  // Unwrap JSXExpressionContainer if present (e.g., width={1024})
  let unwrappedNode = node;
  if (t.isJSXExpressionContainer(node)) {
    unwrappedNode = node.expression;
  }

  if (t.isStringLiteral(unwrappedNode)) {
    return unwrappedNode.value;
  }
  if (t.isNumericLiteral(unwrappedNode)) {
    return unwrappedNode.value;
  }
  if (t.isTemplateLiteral(unwrappedNode) && unwrappedNode.quasis.length === 1) {
    return (
      unwrappedNode.quasis[0].value.cooked || unwrappedNode.quasis[0].value.raw
    );
  }
  return undefined;
}

// Helper to extract object expression as JSON string (for recraftStyle)
function extractObjectExpression(
  node: t.ObjectExpression,
  source: string
): string {
  const props: string[] = [];

  for (const prop of node.properties) {
    if (t.isObjectProperty(prop)) {
      let key: string;
      if (t.isIdentifier(prop.key)) {
        key = prop.key.name;
      } else if (t.isStringLiteral(prop.key)) {
        key = prop.key.value;
      } else {
        continue; // Skip computed properties for now
      }

      let value: string;

      if (t.isStringLiteral(prop.value)) {
        value = `"${prop.value.value}"`;
      } else if (t.isNumericLiteral(prop.value)) {
        value = String(prop.value.value);
      } else if (t.isBooleanLiteral(prop.value)) {
        value = String(prop.value.value);
      } else if (t.isObjectExpression(prop.value)) {
        value = `{${extractObjectExpression(prop.value, source)}}`;
      } else {
        // For other types, extract from source code
        if (prop.value.start != null && prop.value.end != null) {
          value = source.substring(prop.value.start, prop.value.end);
        } else {
          continue; // Skip if we can't extract
        }
      }

      props.push(`"${key}":${value}`);
    }
  }

  return props.join(",");
}

function findImaginedComponents(content: string): ImaginedMatch[] {
  const matches: ImaginedMatch[] = [];

  try {
    // Parse the file content into an AST
    const ast = parser.parse(content, {
      sourceType: "module",
      plugins: ["jsx", "typescript", "decorators-legacy"],
    });

    // Traverse the AST to find Imagined JSX elements
    traverseDefault(ast, {
      JSXOpeningElement(path: any) {
        const node = path.node;

        // Check if this is an Imagined component
        if (t.isJSXIdentifier(node.name) && node.name.name === "Imagined") {
          // Extract props
          let prompt: string | undefined;
          let width: number | undefined;
          let height: number | undefined;
          let seed: string | undefined;
          let recraftStyle: string | undefined;
          const otherProps: string[] = [];

          // Process each attribute
          for (const attr of node.attributes) {
            if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
              const attrName = attr.name.name;
              const attrValue = attr.value;

              if (attrName === "prompt") {
                prompt = extractValueFromNode(attrValue) as string | undefined;
              } else if (attrName === "width") {
                width = extractValueFromNode(attrValue) as number | undefined;
              } else if (attrName === "height") {
                height = extractValueFromNode(attrValue) as number | undefined;
              } else if (attrName === "seed") {
                seed = extractValueFromNode(attrValue) as string | undefined;
              } else if (attrName === "recraftStyle") {
                // Extract object expression
                if (
                  attrValue &&
                  t.isJSXExpressionContainer(attrValue) &&
                  t.isObjectExpression(attrValue.expression)
                ) {
                  const extracted = extractObjectExpression(
                    attrValue.expression,
                    content
                  );
                  // Normalize to ensure consistent key generation regardless of source order
                  recraftStyle = normalizeRecraftStyleString(extracted);
                }
              } else {
                // Collect other props for reconstruction
                if (t.isStringLiteral(attrValue)) {
                  otherProps.push(`${attrName}="${attrValue.value}"`);
                } else if (t.isJSXExpressionContainer(attrValue)) {
                  // For expression containers, we'd need to stringify the expression
                  // For now, we'll reconstruct from the source
                  const source = content.substring(
                    attrValue.start || 0,
                    attrValue.end || 0
                  );
                  otherProps.push(`${attrName}={${source}}`);
                }
              }
            }
          }

          // Only add if we found a prompt (required prop)
          if (prompt) {
            // Get the full match from source
            const fullMatchStart = node.start || 0;
            const fullMatchEnd = node.end || 0;
            const fullMatch = content.substring(fullMatchStart, fullMatchEnd);

            matches.push({
              fullMatch,
              prompt,
              width,
              height,
              seed,
              recraftStyle,
              otherProps: otherProps.join(" "),
            });
          }
        }
      },
    });
  } catch (error) {
    console.error(
      `Error parsing file: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    // Fall back to empty array if parsing fails
  }

  return matches;
}

import { generateImageKey, normalizeRecraftStyleString } from "./utils";

function transformImaginedToImg(
  match: ImaginedMatch,
  config: any
): string {
  const imageKey = generateImageKey(
    match.prompt,
    match.width,
    match.height,
    match.seed,
    match.recraftStyle
  );

  // Determine the public path for the image URL
  // Priority: 1. config.publicPath (explicit), 2. infer from outputDir, 3. default
  let imagePath: string;
  const imageFormat = config.imageFormat || "jpg";

  if (config.publicPath) {
    // Use explicit publicPath from config
    const publicPath = config.publicPath.startsWith("/")
      ? config.publicPath
      : `/${config.publicPath}`;
    const cleanPath = publicPath.endsWith("/")
      ? publicPath.slice(0, -1)
      : publicPath;
    imagePath = `${cleanPath}/${imageKey}.${imageFormat}`;
  } else if (
    config.outputDir &&
    (config.outputDir.includes("public") ||
      config.outputDir.includes("public\\"))
  ) {
    // Infer from outputDir if it's in public/
    const normalizedPath = config.outputDir.replace(/\\/g, "/");
    const match = normalizedPath.match(/public\/(.+)$/);
    if (match && match[1]) {
      const relativePath = match[1];
      imagePath = `/${relativePath}/${imageKey}.${imageFormat}`;
    } else {
      imagePath = `/generated-images/${imageKey}.${imageFormat}`;
    }
  } else {
    // Default fallback
    imagePath = `./generated-images/${imageKey}.${imageFormat}`;
  }

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

  imgElement += " />";

  return imgElement;
}

async function generateImageIfNeeded(
  match: ImaginedMatch,
  config: any
): Promise<boolean> {
  const imageKey = generateImageKey(
    match.prompt,
    match.width,
    match.height,
    match.seed,
    match.recraftStyle
  );
  const imagePath = join(config.outputDir, `${imageKey}.jpg`);

  // Check if image already exists
  if (existsSync(imagePath)) {
    console.log(`    ✅ Image already exists: ${imagePath}`);
    return true;
  }

  if (!config.apiKey) {
    console.log(
      `    ⚠️  RECRAFT_API_KEY not set - skipping generation for: ${imagePath}`
    );
    return false;
  }

  // Create generator and generate image
  const generator = new RecraftGenerator({ apiKey: config.apiKey });

  // Parse recraftStyle if it exists
  let recraftStyle;
  if (match.recraftStyle) {
    try {
      // recraftStyle is already a JSON string from AST extraction
      recraftStyle = JSON.parse(`{${match.recraftStyle}}`);
    } catch (error) {
      console.log(`    ⚠️  Invalid recraftStyle format: ${match.recraftStyle}`);
      console.log(
        `    Error: ${error instanceof Error ? error.message : String(error)}`
      );
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

async function processFile(
  filePath: string,
  config: any,
  generateImages: boolean = false
): Promise<boolean> {
  const content = readFileSync(filePath, "utf-8");
  const matches = findImaginedComponents(content);

  if (matches.length === 0) {
    return false;
  }

  console.log(`Found ${matches.length} Imagined components in ${filePath}`);

  // Ensure output directory exists
  if (generateImages && !existsSync(config.outputDir)) {
    mkdirSync(config.outputDir, { recursive: true });
    console.log(`Created output directory: ${config.outputDir}`);
  }

  let newContent = content;
  for (const match of matches) {
    console.log(`  - Prompt: "${match.prompt}"`);
    if (match.width || match.height) {
      console.log(
        `    Dimensions: ${match.width || "auto"} x ${match.height || "auto"}`
      );
    }
    if (match.seed) console.log(`    Seed: ${match.seed}`);
    if (match.recraftStyle) {
      console.log(`    Recraft Style: ${match.recraftStyle}`);
    }

    // Generate image if requested
    if (generateImages) {
      await generateImageIfNeeded(match, config);
    }

    const imgElement = transformImaginedToImg(match, config);
    newContent = newContent.replace(match.fullMatch, imgElement);
  }

  // For now, just log the transformation - don't write back yet
  console.log("Transformed content preview:");
  console.log("---");
  console.log(
    newContent.slice(0, 500) + (newContent.length > 500 ? "..." : "")
  );
  console.log("---\n");

  return true;
}

async function scanDirectory(
  dirPath: string,
  config: any,
  generateImages: boolean = false
): Promise<void> {
  const items = readdirSync(dirPath);

  for (const item of items) {
    const itemPath = join(dirPath, item);
    const stat = statSync(itemPath);

    if (
      stat.isDirectory() &&
      item !== "node_modules" &&
      item !== ".git" &&
      item !== "dist"
    ) {
      await scanDirectory(itemPath, config, generateImages);
    } else if (stat.isFile()) {
      const ext = extname(item);
      if (ext === ".tsx" || ext === ".jsx" || ext === ".ts") {
        await processFile(itemPath, config, generateImages);
      }
    }
  }
}

export async function runMacro(
  targetDir: string | undefined = undefined,
  options: { generate?: boolean; outputDir?: string } = {}
): Promise<void> {
  // Determine project root first (use current directory as starting point)
  const projectRoot = process.cwd();
  const config = await loadConfig(projectRoot);

  // Determine the target directory to scan
  // Priority: 1. CLI argument, 2. config.sourceDir, 3. current directory
  let finalTargetDir: string;
  if (targetDir) {
    // CLI argument provided - resolve relative to project root
    finalTargetDir = join(projectRoot, targetDir);
  } else if (config.sourceDir) {
    // Use sourceDir from config - resolve relative to project root
    finalTargetDir = join(projectRoot, config.sourceDir);
  } else {
    // Default to current directory
    finalTargetDir = projectRoot;
  }

  console.log("🎨 Running imagined macro...");
  console.log(`Scanning directory: ${finalTargetDir}\n`);

  // Override with CLI options
  if (options.outputDir) {
    config.outputDir = options.outputDir;
  } else {
    // Check if public folder exists in project root (common in Vite/React projects)
    // If no explicit outputDir was set, prefer public/generated-images
    const publicDir = join(projectRoot, "public", "generated-images");
    const generatedImagesDir = join(projectRoot, "generated-images");

    if (existsSync(join(projectRoot, "public"))) {
      config.outputDir = publicDir;
      console.log(
        "📁 Using public/generated-images (Vite/React project detected)"
      );
    } else {
      config.outputDir = generatedImagesDir;
    }
  }

  const generateImages = options.generate || false;

  if (generateImages) {
    console.log("🚀 Image generation enabled");
    console.log(`📋 Model: ${config.model}`);
    if (config.apiKey) {
      console.log("✅ RECRAFT_API_KEY found");
    } else {
      console.log("⚠️  RECRAFT_API_KEY not set - images will not be generated");
    }
    console.log(`📁 Output directory: ${config.outputDir}`);
    if (config.defaultStyle) {
      console.log(`🎨 Default style: ${JSON.stringify(config.defaultStyle)}`);
    }
    console.log();
  } else {
    console.log("👀 Scan-only mode (use --generate to create images)\n");
  }

  await scanDirectory(finalTargetDir, config, generateImages);

  console.log("✅ Macro scan complete!");
}

/**
 * Collect all image keys that are referenced in source files
 */
async function collectReferencedImageKeys(
  dirPath: string,
  config: any
): Promise<Set<string>> {
  const referencedKeys = new Set<string>();
  const items = readdirSync(dirPath);

  for (const item of items) {
    const itemPath = join(dirPath, item);
    const stat = statSync(itemPath);

    if (
      stat.isDirectory() &&
      item !== "node_modules" &&
      item !== ".git" &&
      item !== "dist"
    ) {
      const subKeys = await collectReferencedImageKeys(itemPath, config);
      subKeys.forEach((key) => referencedKeys.add(key));
    } else if (stat.isFile()) {
      const ext = extname(item);
      if (ext === ".tsx" || ext === ".jsx" || ext === ".ts") {
        const content = readFileSync(itemPath, "utf-8");
        const matches = findImaginedComponents(content);

        for (const match of matches) {
          const imageKey = generateImageKey(
            match.prompt,
            match.width,
            match.height,
            match.seed,
            match.recraftStyle
          );
          referencedKeys.add(imageKey);
        }
      }
    }
  }

  return referencedKeys;
}

/**
 * Clean up unused images from the output directory
 */
export async function cleanupUnusedImages(
  targetDir: string | undefined = undefined,
  options: { outputDir?: string; dryRun?: boolean } = {}
): Promise<void> {
  const projectRoot = process.cwd();
  const config = await loadConfig(projectRoot);

  // Determine the target directory to scan
  let finalTargetDir: string;
  if (targetDir) {
    finalTargetDir = join(projectRoot, targetDir);
  } else if (config.sourceDir) {
    finalTargetDir = join(projectRoot, config.sourceDir);
  } else {
    finalTargetDir = projectRoot;
  }

  // Determine output directory
  let finalOutputDir: string;
  if (options.outputDir) {
    finalOutputDir = options.outputDir;
  } else if (config.outputDir) {
    finalOutputDir = join(projectRoot, config.outputDir);
  } else {
    // Default fallback
    const publicDir = join(projectRoot, "public", "generated-images");
    const generatedImagesDir = join(projectRoot, "generated-images");
    finalOutputDir = existsSync(join(projectRoot, "public"))
      ? publicDir
      : generatedImagesDir;
  }

  console.log("🧹 Cleaning up unused images...");
  console.log(`Scanning source directory: ${finalTargetDir}`);
  console.log(`Checking output directory: ${finalOutputDir}\n`);

  if (!existsSync(finalOutputDir)) {
    console.log("⚠️  Output directory does not exist. Nothing to clean.");
    return;
  }

  // Collect all referenced image keys from source files
  const referencedKeys = await collectReferencedImageKeys(
    finalTargetDir,
    config
  );
  console.log(
    `Found ${referencedKeys.size} referenced image(s) in source files\n`
  );

  // Get all images in output directory
  // Check for all supported formats since images might have been generated with different formats
  const imageFiles = readdirSync(finalOutputDir).filter((file) => {
    const ext = extname(file).toLowerCase();
    return (
      ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp"
    );
  });

  console.log(`Found ${imageFiles.length} image(s) in output directory\n`);

  // Find unused images
  const unusedImages: string[] = [];
  for (const imageFile of imageFiles) {
    // Extract the image key from filename (remove extension)
    const imageKey = imageFile.replace(/\.(jpg|jpeg|png|webp)$/i, "");

    if (!referencedKeys.has(imageKey)) {
      unusedImages.push(join(finalOutputDir, imageFile));
    }
  }

  if (unusedImages.length === 0) {
    console.log("✅ No unused images found. Everything is clean!");
    return;
  }

  console.log(`Found ${unusedImages.length} unused image(s):`);
  for (const imagePath of unusedImages) {
    console.log(`  - ${imagePath}`);
  }
  console.log();

  if (options.dryRun) {
    console.log("🔍 Dry run mode - no files were deleted");
    console.log(`Would delete ${unusedImages.length} file(s)`);
  } else {
    // Delete unused images
    let deletedCount = 0;
    for (const imagePath of unusedImages) {
      try {
        unlinkSync(imagePath);
        deletedCount++;
        console.log(`  ✅ Deleted: ${imagePath}`);
      } catch (error) {
        console.error(`  ❌ Failed to delete ${imagePath}:`, error);
      }
    }
    console.log(
      `\n✅ Cleanup complete! Deleted ${deletedCount} unused image(s)`
    );
  }
}

/**
 * Watch for file changes and regenerate images as needed
 */
export async function watchFiles(
  targetDir: string | undefined = undefined,
  options: { outputDir?: string } = {}
): Promise<void> {
  const projectRoot = process.cwd();
  const config = await loadConfig(projectRoot);

  // Determine the target directory to scan
  let finalTargetDir: string;
  if (targetDir) {
    finalTargetDir = join(projectRoot, targetDir);
  } else if (config.sourceDir) {
    finalTargetDir = join(projectRoot, config.sourceDir);
  } else {
    finalTargetDir = projectRoot;
  }

  // Determine output directory
  if (options.outputDir) {
    config.outputDir = options.outputDir;
  } else {
    const publicDir = join(projectRoot, "public", "generated-images");
    const generatedImagesDir = join(projectRoot, "generated-images");

    if (existsSync(join(projectRoot, "public"))) {
      config.outputDir = publicDir;
    } else {
      config.outputDir = generatedImagesDir;
    }
  }

  console.log("👀 Starting file watcher...");
  console.log(`Watching directory: ${finalTargetDir}`);
  console.log(`Output directory: ${config.outputDir}`);
  console.log("Press Ctrl+C to stop\n");

  // Track processed files to avoid duplicate processing
  const processingFiles = new Set<string>();

  // Debounce function to avoid processing the same file multiple times rapidly
  const debounceMap = new Map<string, NodeJS.Timeout>();
  const DEBOUNCE_MS = 300;

  async function processChangedFile(filePath: string) {
    // Skip if already processing
    if (processingFiles.has(filePath)) {
      return;
    }

    // Clear existing debounce timer
    if (debounceMap.has(filePath)) {
      clearTimeout(debounceMap.get(filePath)!);
    }

    // Set debounce timer
    const timer = setTimeout(async () => {
      processingFiles.add(filePath);
      debounceMap.delete(filePath);

      try {
        const ext = extname(filePath);
        if (ext === ".tsx" || ext === ".jsx" || ext === ".ts") {
          const relativePath = relative(finalTargetDir, filePath);
          console.log(`\n📝 File changed: ${relativePath}`);
          await processFile(filePath, config, true);
        }
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
      } finally {
        processingFiles.delete(filePath);
      }
    }, DEBOUNCE_MS);

    debounceMap.set(filePath, timer);
  }

  // Initial scan
  console.log("🔍 Performing initial scan...");
  await scanDirectory(finalTargetDir, config, true);
  console.log("\n✅ Initial scan complete. Watching for changes...\n");

  // Watch directory recursively
  function watchDirectory(dirPath: string) {
    try {
      const watcher = watch(
        dirPath,
        { recursive: true },
        async (eventType, filename) => {
          if (!filename) return;

          const filePath = join(dirPath, filename);

          // Skip node_modules, .git, dist, and other ignored directories
          if (
            filePath.includes("node_modules") ||
            filePath.includes(".git") ||
            filePath.includes("dist") ||
            filePath.includes(".next")
          ) {
            return;
          }

          try {
            const stat = statSync(filePath);
            if (stat.isFile()) {
              const ext = extname(filePath);
              if (ext === ".tsx" || ext === ".jsx" || ext === ".ts") {
                if (eventType === "change" || eventType === "rename") {
                  await processChangedFile(filePath);
                }
              }
            } else if (stat.isDirectory() && eventType === "rename") {
              // New directory added, start watching it
              watchDirectory(filePath);
            }
          } catch (error) {
            // File might have been deleted, ignore
          }
        }
      );

      // Handle watcher errors
      watcher.on("error", (error) => {
        console.error("Watcher error:", error);
      });
    } catch (error) {
      console.error(`Failed to watch directory ${dirPath}:`, error);
    }
  }

  // Start watching
  watchDirectory(finalTargetDir);

  // Keep process alive
  process.on("SIGINT", () => {
    console.log("\n\n👋 Stopping file watcher...");
    process.exit(0);
  });
}

// If run directly
if (import.meta.main) {
  const args = process.argv.slice(2);

  // Parse command-style arguments: imagined [command] [directory] [flags]
  // Examples:
  //   imagined                    -> generate .
  //   imagined generate            -> generate .
  //   imagined generate ./src      -> generate ./src
  //   imagined ./src               -> generate ./src (backward compat)
  //   imagined --generate          -> generate . (backward compat)

  let command: string | undefined;
  let targetDir: string | undefined;
  let generateFlag = false;
  let outputDir: string | undefined;

  // Extract flags first (they can appear anywhere)
  const remainingArgs: string[] = [];
  for (const arg of args) {
    if (arg === "--generate" || arg === "-g") {
      generateFlag = true;
    } else if (arg.startsWith("--output=")) {
      outputDir = arg.split("=")[1];
    } else {
      remainingArgs.push(arg);
    }
  }

  // Parse remaining arguments (command and directory)
  if (remainingArgs.length === 0) {
    // No arguments: default to generate command, no directory (will use config or default)
    command = "generate";
    targetDir = undefined; // Will use config.sourceDir or default to current directory
  } else if (remainingArgs.length === 1) {
    // One argument: could be command or directory
    const arg = remainingArgs[0];
    // Check if it looks like a directory path (starts with . or /, or contains /)
    if (
      arg.startsWith(".") ||
      arg.startsWith("/") ||
      arg.includes("/") ||
      arg.includes("\\")
    ) {
      // Looks like a directory path
      targetDir = arg;
      command = "generate"; // Default command
    } else {
      // Assume it's a command
      command = arg;
      targetDir = undefined; // Will use config.sourceDir or default to current directory
    }
  } else {
    // Two or more arguments: first is command, second is directory
    command = remainingArgs[0];
    targetDir = remainingArgs[1];
  }

  // Handle different commands
  if (command === "cleanup" || command === "clean") {
    // Extract --dry-run flag if present
    const dryRun = args.includes("--dry-run") || args.includes("-d");
    cleanupUnusedImages(targetDir, { outputDir, dryRun }).catch(console.error);
  } else if (command === "watch") {
    // Watch mode - continuously watch for changes
    watchFiles(targetDir, { outputDir }).catch(console.error);
  } else {
    // Determine if generation should happen
    // If command is "generate" or generateFlag is set, enable generation
    const shouldGenerate = command === "generate" || generateFlag;

    // Pass targetDir only if explicitly provided (will use config.sourceDir or default if undefined)
    runMacro(targetDir, { generate: shouldGenerate, outputDir }).catch(
      console.error
    );
  }
}
