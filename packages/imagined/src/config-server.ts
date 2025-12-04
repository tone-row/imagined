import { join, resolve } from "path";
import { existsSync, readFileSync } from "fs";
import { config as dotenvConfig } from "dotenv";
import type { ImaginedConfig } from "./config";

/**
 * Load configuration from multiple sources in order of priority:
 * 1. Environment variables
 * 2. imagined.config.js/ts
 * 3. package.json "imagined" field
 * 4. Default values
 *
 * NOTE: This function is server-only and uses Node.js modules.
 * It should NOT be imported in client-side code.
 */
export async function loadConfig(
  projectRoot: string = process.cwd()
): Promise<ImaginedConfig> {
  // Load .env files automatically
  const envFiles = [".env.local", ".env", ".env.production"];
  for (const envFile of envFiles) {
    const envPath = join(projectRoot, envFile);
    if (existsSync(envPath)) {
      dotenvConfig({ path: envPath });
      break; // Use first found .env file
    }
  }

  const config: ImaginedConfig = {
    // Defaults
    outputDir: "./generated-images",
    imageFormat: "jpg",
    model: "recraftv3",
    defaultStyle: {
      style: "realistic_image",
      substyle: "natural_light",
    },
  };

  // 2. imagined.config.js/ts
  const configFiles = [
    "imagined.config.ts",
    "imagined.config.js",
    "imagined.config.mjs",
  ];

  for (const configFile of configFiles) {
    const configPath = resolve(projectRoot, configFile);
    if (existsSync(configPath)) {
      try {
        // Use dynamic import to load the config file
        // Bun supports TypeScript imports natively
        // Use absolute path for reliable imports
        const configModule = await import(configPath);
        const fileConfig = configModule.default || configModule.config || {};
        
        // Merge config file values into our config object
        // Only assign defined values to preserve defaults
        if (fileConfig.apiKey !== undefined) {
          config.apiKey = fileConfig.apiKey;
        }
        if (fileConfig.outputDir !== undefined) {
          config.outputDir = fileConfig.outputDir;
        }
        if (fileConfig.imageFormat !== undefined) {
          config.imageFormat = fileConfig.imageFormat;
        }
        if (fileConfig.defaultStyle !== undefined) {
          config.defaultStyle = fileConfig.defaultStyle;
        }
        if (fileConfig.model !== undefined) {
          config.model = fileConfig.model;
        }
        if (fileConfig.publicPath !== undefined) {
          config.publicPath = fileConfig.publicPath;
        }
        if (fileConfig.sourceDir !== undefined) {
          config.sourceDir = fileConfig.sourceDir;
        }
        
        console.log(`✅ Loaded config from ${configFile}`);
      } catch (error) {
        console.warn(`⚠️  Failed to load config file ${configFile}:`, error);
      }
      break;
    }
  }

  // 3. package.json "imagined" field
  const packageJsonPath = join(projectRoot, "package.json");
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      if (packageJson.imagined) {
        Object.assign(config, packageJson.imagined);
      }
    } catch (error) {
      console.warn("⚠️  Failed to parse package.json:", error);
    }
  }

  // 1. Environment variables (highest priority - override everything)
  if (process.env.RECRAFT_API_KEY) {
    config.apiKey = process.env.RECRAFT_API_KEY;
  }

  if (process.env.IMAGINED_OUTPUT_DIR) {
    config.outputDir = process.env.IMAGINED_OUTPUT_DIR;
  }

  return config;
}
