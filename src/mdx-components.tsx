import type { MDXComponents } from "mdx/types";
import { Callout, Figure } from "@/components/mdx/post";

const components = {
  Callout,
  Figure,
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
