import React, { useState } from "react";
import { getImageSrc, getCheckeredFallback } from "./utils";
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
  const imageSrc = getImageSrc(prompt, width, height, seed, recraftStyle);
  const [src, setSrc] = useState(imageSrc);
  const fallback = getCheckeredFallback();

  const handleError = () => {
    // If image fails to load, use checkered fallback
    if (src !== fallback) {
      setSrc(fallback);
    }
  };

  return (
    <img
      src={src}
      width={width}
      height={height}
      alt={alt || prompt}
      onError={handleError}
      {...imgProps}
    />
  );
}

export default Imagined;
