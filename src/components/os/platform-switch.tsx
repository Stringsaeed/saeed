"use client";

import type { ReactNode } from "react";
import { usePlatform } from "./platform";

/** Renders the phone version of a screen, or the plain page on the web. */
export function PlatformSwitch({
  phone,
  web,
}: {
  phone: ReactNode;
  web: ReactNode;
}) {
  const { platform } = usePlatform();
  return <>{platform === "web" ? web : phone}</>;
}
