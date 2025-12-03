// Recraft V3 API Style Types
// Based on https://www.recraft.ai/docs/api-reference/appendix

export type RecraftV3Style =
  | 'realistic_image'
  | 'digital_illustration'
  | 'vector_illustration'
  | 'logo_raster';

export type RealisticImageSubstyle =
  | 'b_and_w'
  | 'enterprise'
  | 'evening_light'
  | 'faded_nostalgia'
  | 'forest_life'
  | 'hard_flash'
  | 'hdr'
  | 'motion_blur'
  | 'mystic_naturalism'
  | 'natural_light'
  | 'natural_tones'
  | 'organic_calm'
  | 'real_life_glow'
  | 'retro_realism'
  | 'retro_snapshot'
  | 'studio_portrait'
  | 'urban_drama'
  | 'village_realism'
  | 'warm_folk';

export type DigitalIllustrationSubstyle =
  | '2d_art_poster'
  | '2d_art_poster_2'
  | 'antiquarian'
  | 'bold_fantasy'
  | 'child_book'
  | 'cover'
  | 'crosshatch'
  | 'digital_engraving'
  | 'engraving_color'
  | 'anime'
  | 'cartoon'
  | 'comic_book'
  | 'futuristic'
  | 'game_art'
  | 'grunge'
  | 'hand_drawn'
  | 'horror'
  | 'lofi'
  | 'low_poly'
  | 'magical'
  | 'medieval'
  | 'minimalist'
  | 'noir'
  | 'pixar'
  | 'pop_art'
  | 'psychedelic'
  | 'renaissance'
  | 'steampunk'
  | 'surreal'
  | 'synthwave'
  | 'tribal'
  | 'vintage'
  | 'watercolor'
  | 'sketch'
  | 'oil_painting'
  | 'pencil'
  | 'charcoal'
  | 'pastel';

export type VectorIllustrationSubstyle =
  | 'bold_stroke'
  | 'chemistry'
  | 'colored_stencil'
  | 'cosmics'
  | 'cutout'
  | 'emblem'
  | 'flat_2'
  | 'glyph'
  | 'illustration'
  | 'line_art'
  | 'line_circuit'
  | 'linocut'
  | 'marker'
  | 'mosaic'
  | 'naif'
  | 'pictogram_scene'
  | 'realistic'
  | 'screen_print'
  | 'shadow_box'
  | 'street_art'
  | 'tribal';

export type LogoRasterSubstyle =
  | 'emblem_graffiti'
  | 'emblem_pop_art'
  | 'emblem_punk'
  | 'emblem_stamp'
  | 'emblem_vintage';

export type RecraftV3Substyle =
  | RealisticImageSubstyle
  | DigitalIllustrationSubstyle
  | VectorIllustrationSubstyle
  | LogoRasterSubstyle;

// Style configuration for strongly typed usage
export interface RecraftStyleConfig {
  style: RecraftV3Style;
  substyle?: RecraftV3Substyle;
}

// Union type for style configuration - either style config or custom style_id
export type RecraftStyleOptions = RecraftStyleConfig | {
  style_id: string; // Custom UUID from Recraft platform
};