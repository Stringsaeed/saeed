"use client";

import { RiTerminalBoxLine } from "@remixicon/react";
import { usePathname } from "next/navigation";
import { TERMINAL, toTerminal } from "@/components/terminal/paths";
import { Button } from "@/components/ui/button";

// The pages that have a twin in the terminal version. Anywhere else, the
// switch goes to the terminal's home.
function twin(pathname: string) {
  const known =
    pathname === "/" ||
    pathname === "/blog" ||
    pathname === "/links" ||
    pathname === "/office" ||
    /^\/blog\/[^/]+$/.test(pathname);
  return known ? toTerminal(pathname) : TERMINAL;
}

// The way into the terminal version of the site, from the header: the same
// page, as a tab in a terminal. A plain link, so that version loads fresh.
export function TerminalSwitch({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <Button asChild variant="surface" size="icon" className={className}>
      <a
        href={twin(pathname)}
        aria-label="Terminal version"
        title="See this page in the terminal version of the site"
        data-analytics-event="Navigation Clicked"
        data-analytics-destination="Terminal"
        data-analytics-location="Header"
        data-sound="tap"
        data-sound-hover="hover"
      >
        <RiTerminalBoxLine aria-hidden="true" />
      </a>
    </Button>
  );
}
