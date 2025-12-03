import React from 'react';
import { getImageSrc } from './utils';
import type { RecraftStyleOptions } from './config';

export interface LivingImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  prompt: string;
  width?: number;
  height?: number;
  seed?: string;
  recraftStyle?: RecraftStyleOptions;
}

export function LivingImage({ prompt, width, height, seed, recraftStyle, alt, ...imgProps }: LivingImageProps) {
  // Generate the expected image path using the same logic as the macro
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

export default LivingImage;