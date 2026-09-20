import { codeInput } from "@sanity/code-input";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { dataset, projectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";

export default defineConfig({
  name: "saeed",
  title: "Saeed",
  projectId,
  dataset,
  plugins: [
    structureTool(),
    codeInput(),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
});
