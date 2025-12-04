import type { ImaginedConfig } from "imagined";

const config: ImaginedConfig = {
  sourceDir: "./src",
  outputDir: "./public/generated-images",
  publicPath: "/generated-images",
  imageFormat: "jpg",
  model: "recraftv3",
  defaultStyle: {
    style_id: "4866d684-8ed1-4692-af4c-73466a5c8958",
  },
};

export default config;
