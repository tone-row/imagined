# Living Image

A build-time macro system for AI image generation that transforms React components into static images using the Recraft API.

## Overview

Living Image allows you to write declarative React components for AI-generated images that are transformed at build time into regular `<img>` tags with pre-generated assets. Similar to how i18n tools work, this system scans your codebase, finds `LivingImage` components, generates the images via the Recraft API, and transforms them into standard img elements.

## Key Features

- **Build-time transformation**: Components are replaced with static img tags during the build process
- **Recraft V3 API integration**: Supports all Recraft models and style parameters
- **Intelligent caching**: Generated images are cached based on prompt, dimensions, seed, and style parameters
- **TypeScript-first**: Full TypeScript support with strongly typed Recraft style options
- **Zero runtime overhead**: No JavaScript shipped to the browser for image generation

## Installation

```bash
npm install living-image
# or
bun add living-image
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
import { LivingImage } from 'living-image';

function App() {
  return (
    <div>
      <LivingImage
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
npx living-image-macro ./src --generate
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
<LivingImage
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
<LivingImage
  prompt="abstract art with vibrant colors"
  width={1024}
  height={1024}
  seed="my-unique-seed"
/>
```

## How It Works

1. **Scan**: The macro recursively scans your source files for `LivingImage` components
2. **Generate**: Missing images are generated via the Recraft API and cached locally
3. **Transform**: Components are replaced with `<img>` tags pointing to generated assets
4. **Cache**: Subsequent runs skip generation for existing images with matching parameters

## Configuration

Create a `living-image.config.js` file in your project root:

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

## Development

To install dependencies:

```bash
bun install
```

This project was created using `bun init` in bun v1.3.0. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
