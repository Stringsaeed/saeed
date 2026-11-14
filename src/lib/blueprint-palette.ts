// The colours a 3D object is drawn in when blueprint mode is on: a face
// colour (core), the lines along its edges, and fainter lines between its
// facets. Cyanotype for the dark sheet, vellum for the light one. Kept apart
// from the 3D code so a page can choose a palette without loading three.js.

export type BlueprintMeshPalette = {
  core: number;
  edge: number;
  facet: number;
};

export const DARK_CYANOTYPE_PALETTE: BlueprintMeshPalette = {
  core: 0x0b223e,
  edge: 0xe2f1ff,
  facet: 0x56a8f5,
};

export const LIGHT_VELLUM_PALETTE: BlueprintMeshPalette = {
  core: 0xf6f4ec,
  edge: 0x1d4ed8,
  facet: 0x60a5fa,
};

/** The palette for blueprint mode in a theme, or none when it is off. */
export function blueprintMeshPalette(
  blueprint: boolean,
  resolvedTheme: string | undefined,
): BlueprintMeshPalette | null {
  if (!blueprint) return null;
  return resolvedTheme === "light"
    ? LIGHT_VELLUM_PALETTE
    : DARK_CYANOTYPE_PALETTE;
}
