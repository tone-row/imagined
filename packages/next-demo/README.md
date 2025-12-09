# Next.js Demo for Imagined

This is a Next.js demo application showcasing the `imagined` package integration.

## Setup

1. Make sure you have a `.env.local` file with your Recraft API key:
   ```
   RECRAFT_API_KEY=your_api_key_here
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

## Usage

1. **Generate images** (run this before starting the dev server):
   ```bash
   bun run images:generate
   ```

2. **Start the development server**:
   ```bash
   bun run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) to see the demo.

## Configuration

The `imagined.config.ts` file configures:
- Source directory: `./app` (scans all files in the app directory)
- Output directory: `./public/generated-images`
- Public path: `/generated-images` (URL path for images)
- Image format: `jpg`
- Default style: `realistic_image` with `natural_light` substyle

## Watch Mode

For development, you can run the image watcher alongside the Next.js dev server:

```bash
# Terminal 1: Start Next.js dev server
bun run dev

# Terminal 2: Start image watcher
imagined watch
```

The watcher will automatically regenerate images when you modify `Imagined` components.
