// Recraft V3 API Style Types
// Based on https://www.recraft.ai/docs/api-reference/appendix

export type RecraftV3Style =
  | "realistic_image"
  | "digital_illustration"
  | "vector_illustration"
  | "logo_raster";

export type RealisticImageSubstyle =
  | "b_and_w"
  | "enterprise"
  | "evening_light"
  | "faded_nostalgia"
  | "forest_life"
  | "hard_flash"
  | "hdr"
  | "motion_blur"
  | "mystic_naturalism"
  | "natural_light"
  | "natural_tones"
  | "organic_calm"
  | "real_life_glow"
  | "retro_realism"
  | "retro_snapshot"
  | "studio_portrait"
  | "urban_drama"
  | "village_realism"
  | "warm_folk";

export type DigitalIllustrationSubstyle =
  | "2d_art_poster"
  | "2d_art_poster_2"
  | "antiquarian"
  | "bold_fantasy"
  | "child_book"
  | "cover"
  | "crosshatch"
  | "digital_engraving"
  | "engraving_color"
  | "expressionism"
  | "freehand_details"
  | "grain"
  | "grain_20"
  | "graphic_intensity"
  | "hand_drawn"
  | "hand_drawn_outline"
  | "handmade_3d"
  | "hard_comics"
  | "infantile_sketch"
  | "long_shadow"
  | "modern_folk"
  | "multicolor"
  | "neon_calm"
  | "noir"
  | "nostalgic_pastel"
  | "outline_details"
  | "pastel_gradient"
  | "pastel_sketch"
  | "pixel_art"
  | "plastic"
  | "pop_art"
  | "pop_renaissance"
  | "seamless"
  | "street_art"
  | "tablet_sketch"
  | "urban_glow"
  | "urban_sketching"
  | "young_adult_book"
  | "young_adult_book_2";

export type VectorIllustrationSubstyle =
  | "bold_stroke"
  | "chemistry"
  | "colored_stencil"
  | "cosmics"
  | "cutout"
  | "depressive"
  | "editorial"
  | "emotional_flat"
  | "engraving"
  | "line_art"
  | "line_circuit"
  | "linocut"
  | "marker_outline"
  | "mosaic"
  | "naivector"
  | "roundish_flat"
  | "seamless"
  | "segmented_colors"
  | "sharp_contrast"
  | "thin"
  | "vector_photo"
  | "vivid_shapes";

export type LogoRasterSubstyle =
  | "emblem_graffiti"
  | "emblem_pop_art"
  | "emblem_punk"
  | "emblem_stamp"
  | "emblem_vintage";

export type RecraftV3Substyle =
  | RealisticImageSubstyle
  | DigitalIllustrationSubstyle
  | VectorIllustrationSubstyle
  | LogoRasterSubstyle;

type StrictStyle = {
  realistic_image: RealisticImageSubstyle;
  digital_illustration: DigitalIllustrationSubstyle;
  vector_illustration: VectorIllustrationSubstyle;
  logo_raster: LogoRasterSubstyle;
};

type StrictStyleConfig<T extends RecraftV3Style> = {
  style: T;
  substyle?: StrictStyle[T];
};

// Style configuration for strongly typed usage
// substyle is only allowed when style is present
export type RecraftStyleOptions =
  | StrictStyleConfig<RecraftV3Style>
  | {
      style_id: string;
    };
