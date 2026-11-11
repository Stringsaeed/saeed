export const BLUEPRINT_STORAGE_KEY = "blueprint-enabled";
export const BLUEPRINT_ATTRIBUTE = "data-blueprint";

/**
 * Tiny synchronous FOUC script mirrored after next-themes so reloading with
 * blueprint mode active paints the schematic palette on the first frame.
 */
export const BLUEPRINT_BOOTSTRAP_SCRIPT = `try{if(localStorage.getItem("${BLUEPRINT_STORAGE_KEY}")==="true")document.documentElement.setAttribute("${BLUEPRINT_ATTRIBUTE}","")}catch{}`;
