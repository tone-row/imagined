# Imagined

A build-time macro system for AI image generation that transforms React components into static images using the Recraft API.

## Overview

Imagined allows you to write declarative React components for AI-generated images that are transformed at build time into regular `<img>` tags with pre-generated assets. Similar to how i18n tools work, this system scans your codebase, finds `Imagined` components, generates the images via the Recraft API, and transforms them into standard img elements.

## Key Features

- **Build-time transformation**: Components are replaced with static img tags during the build process
- **Recraft V3 API integration**: Supports all Recraft models and style parameters
- **Intelligent caching**: Generated images are cached based on prompt, dimensions, seed, and style parameters
- **TypeScript-first**: Full TypeScript support with strongly typed Recraft style options
- **Zero runtime overhead**: No JavaScript shipped to the browser for image generation

## Installation

```bash
npm install imagined
# or
bun add imagined
```

## Setup

1. Get a Recraft API key from [recraft.ai](https://recraft.ai)
2. Add it to your `.env` file:

```env
RECRAFT_API_KEY=your_api_key_here
```

## Usage

### 1. Use the Component

```tsx
import { Imagined } from 'imagined';

function App() {
  return (
    <div>
      <Imagined
        prompt="a majestic mountain landscape at sunrise with golden light"
        width={1024}
        height={1024}
        className="hero-image"
      />
    </div>
  );
}
```

### 2. Run the Macro

The macro scans your codebase and generates images:

```bash
# Generate images (default command)
npx imagined generate

# Or with explicit directory
npx imagined generate ./src

# Or use the legacy flag syntax
npx imagined ./src --generate
```

#### Available Commands

- `generate` (default) - Scan and generate missing images
- `watch` - Watch for file changes and regenerate images automatically
- `cleanup` - Remove unused images from the output directory

```bash
# Watch mode - automatically regenerate images when files change
npx imagined watch

# Cleanup unused images
npx imagined cleanup

# Cleanup with dry-run (preview what would be deleted)
npx imagined cleanup --dry-run
```

### 3. Build Result

Your component gets transformed to:

```tsx
<img
  src="./generated-images/abc123.jpg"
  width={1024}
  height={1024}
  className="hero-image"
  alt="a majestic mountain landscape at sunrise with golden light"
/>
```

## Advanced Usage

### Custom Styles

Use Recraft's style system for consistent image generation:

```tsx
<Imagined
  prompt="a futuristic city skyline"
  width={1536}
  height={1024}
  recraftStyle={{
    style: "realistic_image",
    substyle: "natural_light"
  }}
/>
```

### Seeded Generation

Use seeds for reproducible results:

```tsx
<Imagined
  prompt="abstract art with vibrant colors"
  width={1024}
  height={1024}
  seed="my-unique-seed"
/>
```

## How It Works

1. **Scan**: The macro recursively scans your source files for `Imagined` components
2. **Generate**: Missing images are generated via the Recraft API and cached locally
3. **Transform**: Components are replaced with `<img>` tags pointing to generated assets
4. **Cache**: Subsequent runs skip generation for existing images with matching parameters

## Configuration

Create an `imagined.config.js` file in your project root:

```js
export default {
  outputDir: './public/generated-images',
  model: 'recraftv3',
  defaultStyle: {
    style: 'realistic_image',
    substyle: 'natural_light'
  }
};
```

## Architecture

This is a TypeScript-only package that references source files directly. The macro system is designed for maximum performance and zero runtime overhead, making it ideal for static sites, documentation, and any application where AI-generated images need to be pre-rendered at build time.

## Development Workflow

### Watch Mode for Vite/Next.js

For development, you can run the watch mode alongside your dev server:

**Option 1: Using concurrently (recommended)**

```bash
# Install concurrently
npm install --save-dev concurrently

# Update package.json scripts
{
  "scripts": {
    "dev": "concurrently \"vite\" \"imagined watch\"",
    "dev:next": "concurrently \"next dev\" \"imagined watch\""
  }
}
```

**Option 2: Run in separate terminals**

```bash
# Terminal 1: Start your dev server
npm run dev  # or vite, next dev, etc.

# Terminal 2: Start image watcher
npx imagined watch
```

The watch mode will automatically:
- Detect when you add or modify `Imagined` components
- Generate missing images on the fly
- Skip images that already exist

### Cleanup Unused Images

Periodically clean up unused images to save disk space:

```bash
# Preview what would be deleted
npx imagined cleanup --dry-run

# Actually delete unused images
npx imagined cleanup
```

## Development

To install dependencies:

```bash
bun install
```

This project was created using `bun init` in bun v1.3.0. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
