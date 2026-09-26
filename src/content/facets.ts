import type { ColourFacet, Density, FormFacet, StyleKind } from "./types";

export const kindLabels: Record<StyleKind, string> = {
  movement: "Movement",
  period: "Period look",
  aesthetic: "Aesthetic",
  technique: "Technique",
  interface: "Interface style",
};

export const kindDescriptions: Record<StyleKind, string> = {
  movement: "A recognised art, design or architecture movement.",
  period: "A look drawn from an era’s visual culture.",
  aesthetic: "A named aesthetic, often from internet or music culture.",
  technique: "A way of making images, independent of era.",
  interface: "A screen and interface design style.",
};

export const colourLabels: Record<ColourFacet, string> = {
  restrained: "Restrained",
  muted: "Muted",
  earthy: "Earthy",
  pastel: "Pastel",
  vivid: "Vivid",
  neon: "Neon",
  metallic: "Metallic",
  dark: "Dark",
};

export const formLabels: Record<FormFacet, string> = {
  geometric: "Geometric",
  organic: "Organic",
  typographic: "Typographic",
  ornamental: "Ornamental",
  photographic: "Photographic",
  illustrative: "Illustrative",
  textured: "Textured",
  digital: "Digital",
  dimensional: "3D / dimensional",
};

export const densityLabels: Record<Density, string> = {
  sparse: "Sparse",
  balanced: "Balanced",
  dense: "Dense",
};
