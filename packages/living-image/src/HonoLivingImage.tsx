import type { FC } from 'hono/jsx';
import { getImageSrc } from './utils';
import type { RecraftStyleOptions } from './config';

export interface HonoLivingImageProps {
  prompt: string;
  width?: number;
  height?: number;
  seed?: string;
  recraftStyle?: RecraftStyleOptions;
  className?: string;
  alt?: string;
  [key: string]: any;
}

export const HonoLivingImage: FC<HonoLivingImageProps> = ({
  prompt,
  width,
  height,
  seed,
  recraftStyle,
  alt,
  ...imgProps
}) => {
  const src = getImageSrc(prompt, width, height, seed, recraftStyle);

  return (
    <img
      src={src}
      width={width}
      height={height}
      alt={alt || prompt}
      {...imgProps}
    />
  );
};