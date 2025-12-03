import type { LivingImageConfig } from "living-image";

const config: LivingImageConfig = {
  sourceDir: "./src",
  outputDir: "./public/generated-images",
  publicPath: "/generated-images",
  imageFormat: "jpg",
  model: "recraftv3",
  defaultStyle: {
    style_id: "a9dcef6d-f052-4672-8f2b-a0a3bd8640b0",
  },
};

export default config;
