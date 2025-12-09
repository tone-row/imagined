import React from "react";
import { getImageSrc } from "./utils";
import type { RecraftStyleOptions } from "./config";

export interface ImaginedProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  prompt: string;
  width?: number;
  height?: number;
  seed?: string;
  recraftStyle?: RecraftStyleOptions;
}

export function Imagined({
  prompt,
  width,
  height,
  seed,
  recraftStyle,
  alt,
  ...imgProps
}: ImaginedProps) {
  // Generate the expected image path using the same logic as the macro
  // This is computed synchronously and can run on the server/build time
  const imageSrc = getImageSrc(prompt, width, height, seed, recraftStyle);

  return (
    <img
      src={imageSrc}
      width={width}
      height={height}
      alt={alt || prompt}
      {...imgProps}
    />
  );
}

export default Imagined;
