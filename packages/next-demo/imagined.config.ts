import type { ImaginedConfig } from "imagined";

const config: ImaginedConfig = {
  sourceDir: "./app",
  outputDir: "./public/generated-images",
  publicPath: "/generated-images",
  imageFormat: "jpg",
  model: "recraftv3",
  defaultStyle: {
    style: "realistic_image",
    substyle: "natural_light",
  },
};

export default config;

