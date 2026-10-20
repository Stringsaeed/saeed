import {
  RiAppleFill,
  RiGithubFill,
  RiGlobalLine,
  RiGooglePlayFill,
  RiLinkedinFill,
  RiNewspaperLine,
  RiPlaneFill,
} from "@remixicon/react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardGroup,
  CardHeader,
  CardMedia,
  CardTitle,
} from "@/components/ui/card";
import {
  type ProjectLink,
  type ProjectLinkType,
  type ShippedApp,
  shippedApps,
  sideProjects,
} from "@/data/projects";

/** One row in either list: the card opens `href`, the footer offers the
 *  other destinations. */
type ProjectRow = {
  name: string;
  description: string;
  logo: string;
  brand?: string;
  href: string;
  type: ProjectLinkType;
  links: readonly ProjectLink[];
};

const groupClassName =
  "mt-3 smooth-shadow-ring shadow-black smooth-ring-neutral-300/30 bg-background";

// The edge goes on the image itself so it shares the image's radius; a hairline
// lets white icons hold their shape on light and dark ones on dark. Logos sit
// grey until their card is hovered or focused, like Work.
const mediaClassName =
  "[&_img]:rounded-lg [&_img]:ring-1 [&_img]:ring-foreground/10 grayscale opacity-70 transition-[filter,opacity] duration-150 group-hover/card:grayscale-0 group-hover/card:opacity-100 group-focus-within/card:grayscale-0 group-focus-within/card:opacity-100";

// Footer links are 28px targets around 16px glyphs, so the footer pulls in by
// the 6px of padding to keep the glyphs on the card's edges. The row itself
// lets clicks through to the card; only the links catch them.
const footerClassName = "pointer-events-none gap-1 pr-1.5";

// On phones the footer drops onto its own line under the description, with
// its first item on the text column (22px media + 10px gap, less the 6px
// padding). The negative margin cancels the row gap and the header's bottom
// padding so it reads as part of the same block.
const footerBelowOnMobileClassName =
  "max-sm:ml-0 max-sm:basis-full max-sm:-mt-5 max-sm:pb-1 max-sm:pl-[26px]";

const linkIcons = {
  "app-store": RiAppleFill,
  "play-store": RiGooglePlayFill,
  github: RiGithubFill,
  web: RiGlobalLine,
  press: RiNewspaperLine,
  linkedin: RiLinkedinFill,
  testflight: RiPlaneFill,
} satisfies Record<ProjectLinkType, unknown>;

function cardLabel(row: ProjectRow) {
  return row.type === "app-store"
    ? `${row.name} on the App Store`
    : `${row.name}, ${new URL(row.href).hostname}`;
}

function shippedAppRow(app: ShippedApp): ProjectRow {
  const links: ProjectLink[] = [
    {
      ariaLabel: `${app.name} on Google Play`,
      href: app.playStore,
      type: "play-store",
    },
  ];
  if (app.web) {
    links.push({
      ariaLabel: `${app.name} on the web`,
      href: app.web,
      type: "web",
    });
  }
  return {
    name: app.name,
    description: app.description,
    logo: app.logo,
    brand: app.brand,
    href: app.appStore,
    type: "app-store",
    links,
  };
}

function ProjectFooterLink({
  project,
  link,
}: {
  project: string;
  link: ProjectLink;
}) {
  const Icon = linkIcons[link.type];
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={link.ariaLabel}
      title={link.ariaLabel}
      className="pointer-events-auto inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded-md px-1.5 text-muted-foreground outline-none transition-[color,transform] duration-150 ease-out hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-muted-foreground active:scale-[0.97]"
      data-analytics-event="Project Link Clicked"
      data-analytics-project={project}
      data-analytics-type={link.type}
      data-analytics-label="Icon"
      data-analytics-location="Home"
      data-sound="tap"
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {/* Two repos for one app would be two identical marks; the platform
          tells them apart. */}
      {link.platform ? (
        <span className="font-mono text-[10px] leading-none">
          {link.platform}
        </span>
      ) : null}
    </a>
  );
}

// Returns the Card itself rather than a wrapper component: CardGroup reads
// `highlightColor` from, and injects `index` into, its direct children.
function projectCard(row: ProjectRow) {
  return (
    <Card
      key={row.name}
      href={row.href}
      external
      label={cardLabel(row)}
      size="compact"
      highlightColor={
        row.brand
          ? `color-mix(in oklab, ${row.brand} 12%, var(--background))`
          : undefined
      }
      className="flex-wrap sm:flex-nowrap"
      data-analytics-event="Project Link Clicked"
      data-analytics-project={row.name}
      data-analytics-type={row.type}
      data-analytics-label="Card"
      data-analytics-location="Home"
      data-sound="tap"
      data-sound-hover="hover"
    >
      <CardMedia logo={row.logo} className={mediaClassName} />
      <CardHeader className="max-sm:pr-3">
        <CardTitle>{row.name}</CardTitle>
        {/* Wraps to two lines on phones, where the footer has its own line;
            stays one line on wider screens, like Work. */}
        <CardDescription className="line-clamp-2 leading-5 sm:line-clamp-none sm:truncate">
          {row.description}
        </CardDescription>
      </CardHeader>
      <CardFooter
        className={`${footerClassName} ${footerBelowOnMobileClassName}`}
      >
        {/* The card's own destination comes first: a store as its glyph,
            a website as a quiet hostname (the card already links there). */}
        {row.type === "app-store" ? (
          <ProjectFooterLink
            project={row.name}
            link={{
              ariaLabel: cardLabel(row),
              href: row.href,
              type: "app-store",
            }}
          />
        ) : (
          <span
            aria-hidden="true"
            className="px-1.5 font-mono text-[11px] text-muted-foreground"
          >
            {new URL(row.href).hostname}
          </span>
        )}
        {row.links.map((link) => (
          <ProjectFooterLink key={link.href} project={row.name} link={link} />
        ))}
      </CardFooter>
    </Card>
  );
}

function GroupLabel({ children }: { children: string }) {
  return (
    <h3 className="backdrop-plate text-xs font-medium text-muted-foreground">
      {children}
    </h3>
  );
}

export function ProjectsSection() {
  return (
    <>
      <div
        className="mt-5"
        data-analytics-view="Content Viewed"
        data-analytics-label="Side Projects"
      >
        <GroupLabel>Side projects</GroupLabel>
        <CardGroup
          className={groupClassName}
          orientation="inline"
          border="outlined"
        >
          {sideProjects.map(projectCard)}
        </CardGroup>
      </div>

      <div
        className="mt-8"
        data-analytics-view="Content Viewed"
        data-analytics-label="Shipped Apps"
      >
        <GroupLabel>Apps I’ve worked on</GroupLabel>
        <CardGroup
          className={groupClassName}
          orientation="inline"
          border="outlined"
        >
          {shippedApps.map((app) => projectCard(shippedAppRow(app)))}
        </CardGroup>
      </div>
    </>
  );
}
