import type { InteractiveName } from "@/lib/interactive-names";

/** Props every registered figure receives from the post body. */
export type InteractiveFigureProps = {
  name: InteractiveName;
  caption?: string;
};
